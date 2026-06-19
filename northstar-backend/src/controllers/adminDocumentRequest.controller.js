import {
  getAdminDocumentRequestsService,
  sendDocumentRequestService,
  updateDocumentRequestService,
} from "../services/adminDocumentRequest.service.js";

export const getAdminDocumentRequests = async (req, res) => {
  try {
    const result = await getAdminDocumentRequestsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Document requests fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get admin document requests error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch document requests",
    });
  }
};

export const sendDocumentRequest = async (req, res) => {
  try {
    const result = await sendDocumentRequestService(req.body, req.admin);

    return res.status(201).json({
      success: true,
      message: "Document request sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send document request error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to send document request",
    });
  }
};

export const updateDocumentRequest = async (req, res) => {
  try {
    const result = await updateDocumentRequestService(
      req.params.documentRequestId,
      req.body,
      req.admin,
    );

    return res.status(200).json({
      success: true,
      message: "Document request updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update document request error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update document request",
    });
  }
};
