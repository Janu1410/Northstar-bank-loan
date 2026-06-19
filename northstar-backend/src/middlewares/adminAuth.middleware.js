import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const admin = await prisma.adminUser.findUnique({
      where: {
        id: decoded.adminId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    req.admin = {
      adminId: admin.id,
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }
};

