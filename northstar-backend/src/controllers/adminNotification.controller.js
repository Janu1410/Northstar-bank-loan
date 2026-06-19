import {
  getAdminNotificationDetailService,
  getAdminNotificationsService,
} from "../services/adminNotification.service.js";

export const getAdminNotifications = async (req, res) => {
  try {
    const result = await getAdminNotificationsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get admin notifications error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
};

export const getAdminNotificationDetail = async (req, res) => {
  try {
    const result = await getAdminNotificationDetailService(
      req.params.notificationId,
    );

    return res.status(200).json({
      success: true,
      message: "Notification detail fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get admin notification detail error:", error);

    return res.status(
      error.message === "Notification not found" ? 404 : 400,
    ).json({
      success: false,
      message: error.message || "Failed to fetch notification detail",
    });
  }
};
