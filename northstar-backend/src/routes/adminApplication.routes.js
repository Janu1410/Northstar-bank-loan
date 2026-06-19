import express from "express";

import {
  getAdminDashboard,
  getAdminApplications,
  getAdminApplicationDetail,
  updateAdminApplicationStatus,
  decideAdminApplication,
  generateApplicationAgreement,
} from "../controllers/adminApplication.controller.js";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/dashboard", adminAuth, getAdminDashboard);
router.get("/", adminAuth, getAdminApplications);
router.patch("/:applicationId/status", adminAuth, updateAdminApplicationStatus);
router.patch(
  "/:applicationId/decision",
  adminAuth,
  allowRoles("MANAGER"),
  decideAdminApplication,
);
router.post(
  "/:applicationId/agreement/generate",
  adminAuth,
  generateApplicationAgreement,
);
router.get("/:applicationId", adminAuth, getAdminApplicationDetail);

export default router;
