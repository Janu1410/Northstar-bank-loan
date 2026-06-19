import {
  getUploadRequestByTokenService,
  uploadDocumentService,
} from "../services/adminDocumentRequest.service.js";

export const getUploadRequest = async (req, res) => {
  try {
    const result = await getUploadRequestByTokenService(req.params.token);

    return res.status(200).json({
      success: true,
      message: "Upload request fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to validate upload link",
    });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const result = await uploadDocumentService(req.params.token, req.file);

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to upload document",
    });
  }
};
