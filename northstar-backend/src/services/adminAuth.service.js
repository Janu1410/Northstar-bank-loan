import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";
import {
  sendAdminPasswordResetEmail,
  sendNotificationEmailSafely,
} from "./notificationEmail.service.js";

const PASSWORD_RESET_WINDOW_MS = 1000 * 60 * 60 * 24;
const createPasswordResetToken = () => crypto.randomBytes(32).toString("hex");

export const loginAdminService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin || !admin.isActive) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    admin.passwordHash
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  if (admin.passwordChangeRequired) {
    throw new Error(
      "Password setup required. Use the access email or forgot password to set your password first.",
    );
  }

  const updatedAdmin = await prisma.adminUser.update({
    where: {
      id: admin.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  const token = jwt.sign(
    {
      adminId: updatedAdmin.id,
      role: updatedAdmin.role,
      email: updatedAdmin.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    token,
    admin: {
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      lastLoginAt: updatedAdmin.lastLoginAt?.toISOString() ?? null,
    },
  };
};

export const requestAdminPasswordResetService = async ({ email }) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const admin = await prisma.adminUser.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!admin || !admin.isActive) {
    return {
      delivered: false,
    };
  }

  const token = createPasswordResetToken();

  await prisma.adminUser.update({
    where: {
      id: admin.id,
    },
    data: {
      passwordResetToken: token,
      passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_WINDOW_MS),
    },
  });

  return sendNotificationEmailSafely(sendAdminPasswordResetEmail, {
    email: admin.email,
    fullName: admin.name,
    token,
  });
};

export const validateAdminPasswordResetTokenService = async (token) => {
  if (!token) {
    throw new Error("Reset token is required");
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiresAt: {
        gt: new Date(),
      },
      isActive: true,
    },
    select: {
      email: true,
      name: true,
      role: true,
    },
  });

  if (!admin) {
    throw new Error("Reset link is invalid or expired");
  }

  return admin;
};

export const resetAdminPasswordService = async ({ token, password }) => {
  if (!token || !password) {
    throw new Error("Reset token and password are required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiresAt: {
        gt: new Date(),
      },
      isActive: true,
    },
  });

  if (!admin) {
    throw new Error("Reset link is invalid or expired");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.update({
    where: {
      id: admin.id,
    },
    data: {
      passwordHash,
      passwordChangeRequired: false,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  return {
    email: admin.email,
  };
};

