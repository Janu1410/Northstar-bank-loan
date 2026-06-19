import express from "express";

import { getAdminProfile } from "../controllers/adminProfile.controller.js";

import {
  adminAuth
} from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

router.get(
  "/me",
  adminAuth,
  getAdminProfile
);

export default router;
