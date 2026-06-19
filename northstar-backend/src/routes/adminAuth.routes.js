import express from "express";
import {
  loginAdmin,
  requestAdminPasswordReset,
  resetAdminPassword,
  validateAdminPasswordResetToken,
} from "../controllers/adminAuth.controller.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/forgot-password", requestAdminPasswordReset);
router.get("/reset-password/:token", validateAdminPasswordResetToken);
router.post("/reset-password", resetAdminPassword);

export default router;
