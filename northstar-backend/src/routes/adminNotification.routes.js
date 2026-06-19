import express from "express";

import {
  getAdminNotificationDetail,
  getAdminNotifications,
} from "../controllers/adminNotification.controller.js";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

router.get("/", adminAuth, getAdminNotifications);
router.get("/:notificationId", adminAuth, getAdminNotificationDetail);

export default router;
