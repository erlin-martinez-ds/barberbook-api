
const bcrypt = require("bcrypt");
const User = require("../models/user.model");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validaciones básicas para el registro.
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Nombre, correo electrónico y contraseña son obligatorios",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: "El correo electrónico no tiene un formato válido",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      // El rol siempre se asigna en el servidor.
      role: "USER",
    });

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "El correo electrónico ya está registrado",
      });
    }

    throw error;
  }
};

module.exports = { register };
