import express from "express";

import {
  getUploadRequest,
  uploadDocument,
} from "../controllers/documentRequest.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/upload/:token", getUploadRequest);
router.post("/upload/:token", upload.single("document"), uploadDocument);

export default router;
