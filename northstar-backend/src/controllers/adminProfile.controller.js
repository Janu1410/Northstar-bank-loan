export const getAdminProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin,
  });
};

