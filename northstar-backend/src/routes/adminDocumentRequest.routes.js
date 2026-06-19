import express from "express";

import {
  getAdminDocumentRequests,
  sendDocumentRequest,
  updateDocumentRequest,
} from "../controllers/adminDocumentRequest.controller.js";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

router.get("/", adminAuth, getAdminDocumentRequests);
router.post("/send", adminAuth, sendDocumentRequest);
router.patch("/:documentRequestId", adminAuth, updateDocumentRequest);

export default router;
