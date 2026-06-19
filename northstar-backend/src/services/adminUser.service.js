import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

import prisma from "../config/prisma.js";
import {
  sendAdminPortalAccessEmail,
  sendNotificationEmailSafely,
} from "./notificationEmail.service.js";

const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("A valid email is required"),
  role: z.enum(["MANAGER", "STANDARD_AGENT"]),
});

const updateAdminSchema = z
  .object({
    name: z.string().trim().min(2, "Full name is required").optional(),
    role: z.enum(["MANAGER", "STANDARD_AGENT"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      typeof value.name !== "undefined" ||
      typeof value.role !== "undefined" ||
      typeof value.isActive !== "undefined",
    {
      message: "At least one field is required",
    },
  );

const formatDateValue = (value) => (value ? value.toISOString() : null);
const generateTemporaryPassword = () => crypto.randomBytes(6).toString("base64url");
const createPasswordResetToken = () => crypto.randomBytes(32).toString("hex");

const mapAdminUser = (admin) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  status: admin.isActive ? "ACTIVE" : "INACTIVE",
  isActive: admin.isActive,
  lastLoginAt: formatDateValue(admin.lastLoginAt),
  inviteSentAt: formatDateValue(admin.inviteSentAt),
  createdAt: formatDateValue(admin.createdAt),
  updatedAt: formatDateValue(admin.updatedAt),
  createdByName: admin.createdBy?.name ?? null,
});

const ensureManagerAccountRemains = async (adminId, nextValues) => {
  const existingAdmin = await prisma.adminUser.findUnique({
    where: {
      id: adminId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!existingAdmin) {
    throw new Error("Admin user not found");
  }

  const nextRole = nextValues.role ?? existingAdmin.role;
  const nextIsActive =
    typeof nextValues.isActive === "boolean"
      ? nextValues.isActive
      : existingAdmin.isActive;

  const removesManagerAccess =
    existingAdmin.role === "MANAGER" &&
    existingAdmin.isActive &&
    (nextRole !== "MANAGER" || nextIsActive === false);

  if (!removesManagerAccess) {
    return existingAdmin;
  }

  const activeManagers = await prisma.adminUser.count({
    where: {
      role: "MANAGER",
      isActive: true,
    },
  });

  if (activeManagers <= 1) {
    throw new Error("At least one active manager account must remain");
  }

  return existingAdmin;
};

export const getAdminUsersService = async (query) => {
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const normalizedRoleSearch =
    search.toUpperCase() === "MANAGER"
      ? "MANAGER"
      : search.toUpperCase() === "STANDARD_AGENT"
        ? "STANDARD_AGENT"
        : null;

  const where = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          ...(normalizedRoleSearch
            ? [
                {
                  role: normalizedRoleSearch,
                },
              ]
            : []),
        ],
      }
    : undefined;

  const admins = await prisma.adminUser.findMany({
    where,
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  const allAdmins = await prisma.adminUser.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    kpis: {
      totalAdmins: allAdmins.length,
      managers: allAdmins.filter((admin) => admin.role === "MANAGER").length,
      standardAgents: allAdmins.filter((admin) => admin.role === "STANDARD_AGENT").length,
      inactiveUsers: allAdmins.filter((admin) => !admin.isActive).length,
    },
    admins: admins.map(mapAdminUser),
  };
};

export const createAdminUserService = async (body, currentAdmin) => {
  const payload = createAdminSchema.parse(body);

  const existingAdmin = await prisma.adminUser.findUnique({
    where: {
      email: payload.email.toLowerCase(),
    },
  });

  if (existingAdmin) {
    throw new Error("An admin account with this email already exists");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const passwordResetToken = createPasswordResetToken();
  const inviteSentAt = new Date();
  const passwordResetExpiresAt = new Date(inviteSentAt.getTime() + 1000 * 60 * 60 * 24);

  const admin = await prisma.adminUser.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: payload.role,
      passwordChangeRequired: true,
      passwordResetToken,
      passwordResetExpiresAt,
      inviteSentAt,
      createdById: currentAdmin.adminId ?? currentAdmin.id,
    },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  const inviteDelivery = await sendNotificationEmailSafely(sendAdminPortalAccessEmail, {
    email: admin.email,
    fullName: admin.name,
    role: admin.role,
    temporaryPassword,
    token: passwordResetToken,
  });

  if (!inviteDelivery.delivered) {
    throw new Error(
      inviteDelivery.error || "Admin account created, but invite email delivery failed",
    );
  }

  return mapAdminUser(admin);
};

export const updateAdminUserService = async (adminUserId, body, currentAdmin) => {
  const payload = updateAdminSchema.parse(body);
  const existingAdmin = await ensureManagerAccountRemains(adminUserId, payload);

  const isSelf = existingAdmin.id === (currentAdmin.adminId ?? currentAdmin.id);

  if (isSelf && (typeof payload.role !== "undefined" || typeof payload.isActive !== "undefined")) {
    throw new Error("You cannot change your own role or active status");
  }

  const updatedAdmin = await prisma.adminUser.update({
    where: {
      id: adminUserId,
    },
    data: {
      ...(typeof payload.name !== "undefined" ? { name: payload.name } : {}),
      ...(typeof payload.role !== "undefined" ? { role: payload.role } : {}),
      ...(typeof payload.isActive !== "undefined"
        ? { isActive: payload.isActive }
        : {}),
    },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return mapAdminUser(updatedAdmin);
};
