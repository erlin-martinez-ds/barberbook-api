const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { name, email, password } = req.body ?? {};

  // Validar los campos obligatorios y sus tipos.
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

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // Validar longitud del nombre y del correo.
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    return res.status(400).json({
      success: false,
      message: "El nombre debe tener entre 2 y 100 caracteres",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (normalizedEmail.length > 254 || !emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: "El correo electrónico no tiene un formato válido",
    });
  }

  // bcrypt admite como máximo 72 bytes de contraseña.
  const passwordBytes = Buffer.byteLength(password, "utf8");

  if (password.length < 8 || passwordBytes > 72) {
    return res.status(400).json({
      success: false,
      message:
        "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      // El rol nunca se toma de los datos enviados por el cliente.
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

const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Correo electrónico y contraseña son obligatorios",
    });
  }

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    // Mensaje genérico para no revelar si el correo existe.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("La variable JWT_SECRET no está definida");
    }

    const token = jwt.sign({ role: user.role }, jwtSecret, {
      subject: user._id.toString(),
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    throw error;
  }
};

module.exports = { register, login };
