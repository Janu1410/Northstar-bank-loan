import express from "express";

import {createApplication, getApplicationStatus} from "../controllers/application.controller.js";

const router = express.Router();

router.post("/",createApplication);

router.post("/status",getApplicationStatus);
export default router;