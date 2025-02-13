const { esRoleValido, emailExiste, dniExiste, existeUsuarioPorId, existeAreaPorId } = require('../helpers/db-validators');
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
  const { userId, username, email, password, role, areaId, dni } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validar que el rol sea válido
    await esRoleValido(role);

    // Validar que el email y el DNI no existan
    await emailExiste(email);
    await dniExiste(dni);

    // Obtener el usuario que está realizando la solicitud
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    // Verificar permisos para crear el usuario
    if (requestingUser.role === 'admin' || requestingUser.role === 'moderator' ) {
      // Si el rol es "user", el areaId es obligatorio
      if (role === 'user' && !areaId) {
        return res.status(400).json({ message: 'El areaId es obligatorio' });
      }

      // Si se proporciona un areaId, validar que exista
      if (areaId) {
        await existeAreaPorId(areaId);
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear el nuevo usuario
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role,
        area: areaId, // Si areaId es undefined, no se asignará
        dni,
      });

      // Guardar el usuario en la base de datos
      await newUser.save();

      // Excluir la contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = newUser.toObject();
      res.status(201).json(userWithoutPassword);
    } else {
      res.status(403).json({ message: 'No tiene permisos para crear este tipo de usuario' });
    }
  } catch (error) {
    console.error('Error al crear usuario:', error.message);

    // Verifica si es un error de validación
    if (error.message.includes('del Area no es válido')) {
        return res.status(400).json({
            message: error.message // Enviar el mensaje al cliente
        });
    }

    // Para cualquier otro error, devuelve un error 500 genérico
    res.status(500).json({
        message: 'Error al crear usuario'
    });}
};

// Login de usuario
const loginUser = async (req, res) => {
  const { dni, password } = req.body;

  try {
    const user = await User.findOne({ dni }).populate('area', 'name');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '6h' });

    // Excluir la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({ token, ...userWithoutPassword });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const userId = req.usuario._id; // Get ID from token
    const user = await User.findById(userId);

    if (!user) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    let users;
    if (user.role === 'admin') {
      // If admin, get all users
      users = await User.find()
        .select('-password')
        .populate('area', 'name')
        .lean();
    } else if (user.role === 'moderator') {
      // If moderator, get users from same area
      users = await User.find({ area: user.area })
        .select('-password')
        .populate('area', 'name')
        .lean();
    } else {
      return res.status(403).json({ message: 'No tiene permisos para ver los usuarios' });
    }

    res.status(200).json({
      users,
      total: users.length
    });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};
// Obtener usuario por DNI

const getUserByDni = async (req = request, res = response) => {
  const { dni } = req.params;

  try {
    // Buscamos al usuario sin traer la contraseña
    const usuario = await Usuario.findOne({ dni }).select('-password'); // Excluimos el campo 'password'

    if (!usuario) {
      return res.status(404).json({
        msg: `Usuario con DNI ${dni} no encontrado`,
      });
    }

    // Si el usuario existe, respondemos con los datos del usuario (sin la contraseña)
    return res.json({
      usuario,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Error en el servidor, por favor intente más tarde.",
    });
  }
};

// Editar usuario
const editUser = async (req, res) => {
  const { id } = req.params; // ID del usuario a editar
  const { email, password, area, role } = req.body; // Datos editables
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
    if (email) usuarioAEditar.email = email;
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

// Eliminar usuario
const deleteUser = async (req, res) => {
  const { id } = req.params; // ID del usuario a eliminar
  const usuarioAutenticado = req.usuario; // Usuario que hace la petición

  try {
    // Verificar si el usuario autenticado es admin o moderador
    if (usuarioAutenticado.role !== "admin" && usuarioAutenticado.role !== "moderator") {
      return res.status(403).json({ message: "No tiene permisos para eliminar usuarios" });
    }

    // Buscar usuario a eliminar
    const usuarioAEliminar = await Usuario.findById(id);
    if (!usuarioAEliminar) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Eliminar el usuario
    await Usuario.findByIdAndDelete(id);

    // Respuesta solo con el mensaje de confirmación
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
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