import {
  createAdminUserService,
  getAdminUsersService,
  updateAdminUserService,
} from "../services/adminUser.service.js";

const getStatusCode = (error) => {
  if (
    error.message === "Admin user not found"
  ) {
    return 404;
  }

  if (
    error.name === "ZodError" ||
    error.message === "An admin account with this email already exists" ||
    error.message === "At least one active manager account must remain" ||
    error.message === "You cannot change your own role or active status"
  ) {
    return 400;
  }

  return 500;
};

const getMessage = (error, fallback) => {
  if (error.name === "ZodError") {
    return error.issues?.[0]?.message ?? fallback;
  }

  return error.message || fallback;
};

export const getAdminUsers = async (req, res) => {
  try {
    const result = await getAdminUsersService(req.query);

    return res.status(200).json({
      success: true,
      message: "Admin users fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    return res.status(getStatusCode(error)).json({
      success: false,
      message: getMessage(error, "Unable to load admin users"),
    });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const result = await createAdminUserService(req.body, req.admin);

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create admin user error:", error);

    return res.status(getStatusCode(error)).json({
      success: false,
      message: getMessage(error, "Unable to create admin account"),
    });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const result = await updateAdminUserService(
      req.params.adminUserId,
      req.body,
      req.admin,
    );

    return res.status(200).json({
      success: true,
      message: "Admin account updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update admin user error:", error);

    return res.status(getStatusCode(error)).json({
      success: false,
      message: getMessage(error, "Unable to update admin account"),
    });
  }
};
