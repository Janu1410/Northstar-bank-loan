import express from "express";

import {
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "../controllers/adminUser.controller.js";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(adminAuth, allowRoles("MANAGER"));

router.get("/", getAdminUsers);
router.post("/", createAdminUser);
router.patch("/:adminUserId", updateAdminUser);

export default router;
