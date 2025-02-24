const { esRoleValido, dniExiste, existeUsuarioPorId, existeAreaPorId } = require('../helpers/db-validators');
const User = require('../models/usuario');
const Area = require('../models/Area');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { request, response } = require("express");
const Usuario = require("../models/usuario"); // Suponiendo que el modelo se llama Usuario
const mongoose = require("mongoose");

// Crear usuario
const addUser = async (req, res) => {
  const { userId, username, password, role, areaId, dni } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dniExistente = await User.findOne({ dni, active: true });
    if (dniExistente) {
      return res.status(400).json({ message: "El DNI ya está registrado y activo" });
    }

    // 🔹 Verificar permisos del usuario que crea
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(403).json({ message: "Usuario no encontrado" });
    }

    if (requestingUser.role === "admin" || requestingUser.role === "moderator") {
      if (role === "user" && !areaId) {
        return res.status(400).json({ message: "El areaId es obligatorio" });
      }

      if (areaId) {
        await existeAreaPorId(areaId);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        password: hashedPassword,
        role,
        area: areaId,
        dni,
        active: true, // Asegura que el usuario se cree activo
      });

      await newUser.save();
      const { password: _, ...userWithoutPassword } = newUser.toObject();
      res.status(201).json(userWithoutPassword);
    } else {
      res.status(403).json({ message: "No tiene permisos para crear este tipo de usuario" });
    }
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ message: "Error al crear usuario" });
  }
};


// Login de usuario
const loginUser = async (req, res) => {
  const { dni, password } = req.body;

  try {
    // Buscar solo usuarios activos o sin la propiedad `active`
    const user = await User.findOne({
      dni,
      $or: [{ active: true }, { active: { $exists: false } }],
    }).populate("area", "name");

    if (!user) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "6h" });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json({ token, ...userWithoutPassword });
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};


// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const userId = req.usuario._id; // ID del usuario autenticado
    const user = await User.findById(userId);

    if (!user) {
      return res.status(403).json({ message: "Usuario no encontrado" });
    }

    let users;
    if (user.role === "admin") {
      // Admin: obtiene todos los usuarios activos o sin el campo active
      users = await User.find({
        $or: [{ active: true }, { active: { $exists: false } }]
      })
        .select("-password")
        .populate("area", "name")
        .sort({ username: 1 })
        .lean();
    } else if (user.role === "moderator") {
      // Moderador: obtiene solo usuarios de su área que sean activos
      users = await User.find({
        area: user.area,
        $or: [{ active: true }, { active: { $exists: false } }]
      })
        .select("-password")
        .populate("area", "name")
        .lean();
    } else {
      return res.status(403).json({ message: "No tiene permisos para ver los usuarios" });
    }

    res.status(200).json({
      users,
      total: users.length
    });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// Obtener usuario por DNI

const getUserByDni = async (req, res) => {
  const { dni } = req.params;

  try {
    // Buscar usuario activo o que no tenga el campo active
    const usuario = await User.findOne({
      dni,
      $or: [{ active: true }, { active: { $exists: false } }]
    }).select("-password"); // Excluir contraseña

    if (!usuario) {
      return res.status(404).json({
        msg: `Usuario con DNI ${dni} no encontrado`,
      });
    }

    res.json({ usuario });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Error en el servidor, por favor intente más tarde.",
    });
  }
};


// Editar usuario
const editUser = async (req, res) => {
  const { id } = req.params; // ID del usuario a editar
  const { password, area, role } = req.body; // Datos editables
  const usuarioAutenticado = req.usuario; // Usuario que hace la petición

  try {
    // Verificar si el usuario autenticado es admin o moderador
    if (usuarioAutenticado.role !== "admin" && usuarioAutenticado.role !== "moderator") {
      return res.status(403).json({ message: "No tiene permisos para editar usuarios" });
    }

    // Buscar usuario a editar
    const usuarioAEditar = await Usuario.findById(id);
    if (!usuarioAEditar) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // No permitir cambiar username o DNI
    if (req.body.username || req.body.dni) {
      return res.status(400).json({ message: "No se pueden modificar username o DNI" });
    }

    // Actualizar solo los campos permitidos
    if (password) usuarioAEditar.password = await bcrypt.hash(password, 10);
    if (area) usuarioAEditar.area = area;
    if (role && usuarioAutenticado.role === "admin") {
      // Solo el admin puede cambiar el role
      usuarioAEditar.role = role;
    }

    await usuarioAEditar.save();

    // Crear una copia del usuario sin la contraseña para la respuesta
    const usuarioRespuesta = { ...usuarioAEditar._doc };
    delete usuarioRespuesta.password;

    res.status(200).json({ message: "Usuario actualizado correctamente", usuario: usuarioRespuesta });
  } catch (error) {
    console.error("Error al editar usuario:", error);
    res.status(500).json({ message: "Error al editar usuario" });
  }
};
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const usuarioAutenticado = req.usuario;

  try {
    if (usuarioAutenticado.role !== "admin" && usuarioAutenticado.role !== "moderator") {
      return res.status(403).json({ message: "No tiene permisos para desactivar usuarios" });
    }

    const usuarioAEliminar = await Usuario.findById(id);
    if (!usuarioAEliminar) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si el campo "activo" no existe, inicializarlo en true
    if (usuarioAEliminar.active === undefined) {
      usuarioAEliminar.active = true;
    }

    usuarioAEliminar.active = false; // Desactivar usuario
    await usuarioAEliminar.save();

    res.status(200).json({ message: "Usuario desactivado correctamente" });
  } catch (error) {
    console.error("Error al desactivar usuario:", error);
    res.status(500).json({ message: "Error al desactivar usuario" });
  }
};




module.exports = {
  addUser,
  loginUser,
  getUsers,
  getUserByDni,
  editUser,
  deleteUser,

};