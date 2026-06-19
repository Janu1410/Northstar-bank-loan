import {
  getAdminDashboardService,
  getAdminApplicationsService,
  getAdminApplicationDetailService,
  updateAdminApplicationStatusService,
  decideAdminApplicationService,
  generateApplicationAgreementService,
} from "../services/adminApplication.service.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const result = await getAdminDashboardService();

    return res.status(200).json({
      success: true,
      message: "Admin dashboard fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load admin dashboard",
    });
  }
};

export const getAdminApplications = async (req, res) => {
  try {
    const result = await getAdminApplicationsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get admin applications error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch applications",
    });
  }
};

export const getAdminApplicationDetail = async (req, res) => {
  try {
    const result = await getAdminApplicationDetailService(
      req.params.applicationId,
    );

    return res.status(200).json({
      success: true,
      message: "Application details fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get admin application detail error:", error);

    return res.status(
      error.message === "Application not found" ? 404 : 400,
    ).json({
      success: false,
      message: error.message || "Failed to fetch application details",
    });
  }
};

export const updateAdminApplicationStatus = async (req, res) => {
  try {
    const result = await updateAdminApplicationStatusService(
      req.params.applicationId,
      req.body,
      req.admin,
    );

    return res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update admin application status error:", error);

    return res.status(
      error.message === "Application not found" ? 404 : 400,
    ).json({
      success: false,
      message: error.message || "Failed to update application status",
    });
  }
};

export const decideAdminApplication = async (req, res) => {
  try {
    const result = await decideAdminApplicationService(
      req.params.applicationId,
      req.body,
      req.admin,
    );

    return res.status(200).json({
      success: true,
      message: "Manager decision applied successfully",
      data: result,
    });
  } catch (error) {
    console.error("Manager decision error:", error);

    return res.status(
      error.message === "Application not found" ? 404 : 400,
    ).json({
      success: false,
      message: error.message || "Failed to apply manager decision",
    });
  }
};

export const generateApplicationAgreement = async (req, res) => {
  try {
    const result = await generateApplicationAgreementService(
      req.params.applicationId,
    );

    return res.status(200).json({
      success: true,
      message: "Agreement generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Generate application agreement error:", error);

    return res.status(
      error.message === "Application not found" ? 404 : 400,
    ).json({
      success: false,
      message: error.message || "Failed to generate agreement",
    });
  }
};
