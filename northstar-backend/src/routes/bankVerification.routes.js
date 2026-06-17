import express from "express";

import {
  createVerificationLaunch,
  handleVerificationCallback,
  startVerification,
  completeVerification,
} from "../controllers/bankVerification.controller.js";

const router = express.Router();

router.post("/start", startVerification);
router.post("/launch", createVerificationLaunch);
router.post("/callback", handleVerificationCallback);
router.post("/complete", completeVerification);

export default router;
