const { esRoleValido, emailExiste, dniExiste, existeUsuarioPorId, existeAreaPorId } = require('../helpers/db-validators');
const { validateUser } = require('../validators/userValidators');
const User = require('../models/usuario');
const Area = require('../models/Area');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const transporter = require('../config/email');

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

      // Enviar correo electrónico al usuario
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Bienvenido a la plataforma',
        text: `Hola ${username},\n\nTu cuenta ha sido creada exitosamente.\n\nUsuario: ${username}\nContraseña: ${password}\n\nSaludos,\nEquipo de Soporte`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo:', error);
        } else {
          console.log('Correo enviado:', info.response);
        }
      });

      // Excluir la contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = newUser.toObject();
      res.status(201).json(userWithoutPassword);
    } else {
      res.status(403).json({ message: 'No tiene permisos para crear este tipo de usuario' });
    }
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
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
  const { userId } = req.body;

  try {
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    let users;
    if (requestingUser.role === 'admin') {
      users = await User.find().populate('area', 'name');
    } else if (requestingUser.role === 'moderator') {
      users = await User.find({ area: requestingUser.area }).populate('area', 'name');
    } else {
      return res.status(403).json({ message: 'No tiene permisos para ver los usuarios' });
    }

    res.status(200).json(users);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Obtener usuario por DNI
const getUserByDni = async (req, res) => {
  const { dni } = req.params;
  const { userId } = req.body;

  try {
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    const user = await User.findOne({ dni }).populate('area', 'name');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (requestingUser.role === 'admin' || (requestingUser.role === 'moderator' && user.area.equals(requestingUser.area))) {
      res.status(200).json(user);
    } else {
      res.status(403).json({ message: 'No tiene permisos para ver este usuario' });
    }
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

// Editar usuario
const editUser = async (req, res) => {
  const { id } = req.params;
  const { userId, username, password, role, areaId, dni } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    const userToEdit = await User.findById(id);
    if (!userToEdit) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (requestingUser.role === 'admin' || (requestingUser.role === 'moderator' && userToEdit.role === 'user')) {
      if (username) userToEdit.username = username;
      if (password) userToEdit.password = await bcrypt.hash(password, 10);
      if (role) {
        await esRoleValido(role);
        userToEdit.role = role;
      }
      if (areaId) {
        await existeAreaPorId(areaId);
        userToEdit.area = areaId;
      }
      if (dni) {
        await dniExiste(dni);
        userToEdit.dni = dni;
      }

      await userToEdit.save();
      const { password: _, ...userWithoutPassword } = userToEdit.toObject();
      res.status(200).json(userWithoutPassword);
    } else {
      res.status(403).json({ message: 'No tiene permisos para editar este usuario' });
    }
  } catch (err) {
    console.error('Error al editar usuario:', err);
    res.status(500).json({ message: 'Error al editar usuario' });
  }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (requestingUser.role === 'admin' || (requestingUser.role === 'moderator' && userToDelete.role === 'user')) {
      await userToDelete.remove();
      res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } else {
      res.status(403).json({ message: 'No tiene permisos para eliminar este usuario' });
    }
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ message: 'Error al eliminar usuario' });
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