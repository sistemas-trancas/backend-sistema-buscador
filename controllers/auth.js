const { response, request } = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario");
const { generarJWT } = require("../helpers/generar-jwt");

const login = async (req = request, res = response) => {
  const { dni, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ dni });
    if (!usuario) {
      return res.status(400).json({
        msg: "DNI o Contraseña incorrectos",
      });
    }

    const validPassword = await bcryptjs.compare(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({
        msg: "DNI o Contraseña incorrectos",
      });
    }

    const token = await generarJWT(usuario.id);

    // Excluir la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = usuario.toObject();

    res.json({
      usuario: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hable con el administrador",
    });
  }
};

const obtenerID = (req = request, res = response) => {
  const { id, role } = req.usuario;

  res.json({
    id,
    role,
  });
};

module.exports = {
  login,
  obtenerID,
};