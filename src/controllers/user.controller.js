const User = require("../models/user.model");

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "name email role createdAt updatedAt",
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Usuario no encontrado",
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
};

module.exports = { getProfile };
