import { z } from "zod";

import {
  createBankVerificationLaunchService,
  startBankVerificationService,
  completeBankVerificationService,
  processBankVerificationCallbackService,
} from "../services/bankVerification.service.js";

const applicationIdSchema = z.object({
  applicationId: z
    .string()
    .trim()
    .min(1, "Application ID is required")
    .max(64, "Application ID is invalid"),
});

const verificationCallbackSchema = z.object({
  applicationId: z
    .string()
    .trim()
    .min(1, "Application ID is required")
    .max(64, "Application ID is invalid"),
  launchToken: z.string().trim().min(1, "Launch token is required"),
  outcome: z.enum(["SUCCESS", "FAILED"], {
    message: "Callback outcome is invalid",
  }),
});

const getErrorResponse = (error) => {
  if (error instanceof z.ZodError) {
    return {
      status: 422,
      message: error.issues[0]?.message ?? "Invalid request payload",
    };
  }

  if (error instanceof Error) {
    if (error.message === "Application not found") {
      return { status: 404, message: error.message };
    }

    if (error.message === "Verification session not found") {
      return { status: 404, message: error.message };
    }

    if (
      error.message === "Invalid verification launch token" ||
      error.message === "Verification launch token does not match the application" ||
      error.message === "jwt expired" ||
      error.message === "jwt malformed" ||
      error.message === "invalid token"
    ) {
      return { status: 401, message: "Verification session is invalid or expired" };
    }

    return { status: 400, message: error.message };
  }

  return {
    status: 500,
    message: "Unable to process bank verification request",
  };
};

const parseApplicationId = (body) => {
  const { applicationId } = applicationIdSchema.parse(body);
  return applicationId.trim().toUpperCase();
};

export const startVerification = async (req, res) => {
  try {
    const applicationId = parseApplicationId(req.body);
    const result = await startBankVerificationService(applicationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { status, message } = getErrorResponse(error);

    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const createVerificationLaunch = async (req, res) => {
  try {
    const applicationId = parseApplicationId(req.body);
    const result = await createBankVerificationLaunchService(applicationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { status, message } = getErrorResponse(error);

    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const completeVerification = async (req, res) => {
  try {
    const applicationId = parseApplicationId(req.body);
    const result = await completeBankVerificationService(applicationId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { status, message } = getErrorResponse(error);

    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const handleVerificationCallback = async (req, res) => {
  try {
    const payload = verificationCallbackSchema.parse(req.body);
    const result = await processBankVerificationCallbackService({
      applicationId: payload.applicationId.trim().toUpperCase(),
      launchToken: payload.launchToken,
      outcome: payload.outcome,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { status, message } = getErrorResponse(error);

    res.status(status).json({
      success: false,
      message,
    });
  }
};
