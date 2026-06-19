import {
  loginAdminService,
  requestAdminPasswordResetService,
  resetAdminPasswordService,
  validateAdminPasswordResetTokenService,
} from "../services/adminAuth.service.js";

export const loginAdmin = async (req, res) => {
  try {
    const result = await loginAdminService(req.body);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const requestAdminPasswordReset = async (req, res) => {
  try {
    const result = await requestAdminPasswordResetService(req.body);

    return res.status(200).json({
      success: true,
      message: result?.delivered
        ? "If the account exists, a password setup email has been sent."
        : "Reset link generated. Email delivery is unavailable right now, so use the direct reset link below.",
      data: result?.resetLink
        ? {
            delivered: result.delivered,
            resetLink: result.resetLink,
          }
        : undefined,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const validateAdminPasswordResetToken = async (req, res) => {
  try {
    const result = await validateAdminPasswordResetTokenService(req.params.token);

    return res.status(200).json({
      success: true,
      message: "Reset token is valid",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const result = await resetAdminPasswordService(req.body);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can sign in now.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
