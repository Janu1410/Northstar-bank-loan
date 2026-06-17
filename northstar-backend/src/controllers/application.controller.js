import {createApplicationService, getApplicationStatusService} from "../services/application.service.js";

export const createApplication = async (req, res) => {
  try {
    const result = await createApplicationService(req.body, req.ip);

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create application error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to submit application",
    });
  }
};

export const getApplicationStatus = async (req, res) => {
  try {
    const result = await getApplicationStatusService(req.body);

    return res.status(200).json({
      success: true,
      message: "Application status fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get application status error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Unable to fetch application status",
    });
  }
};

