const express = require('express');
const { addUser, loginUser, getUsers, getUserById, editUser, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const router = express.Router();

// Ruta para crear usuarios
router.post('/', auth, addUser);

// Ruta para iniciar sesión
router.post('/login', loginUser);

// Ruta para obtener todos los usuarios
router.get('/', auth, getUsers);

// Ruta para obtener un usuario por ID
router.get('/:id', auth, getUserById);

// Ruta para editar un usuario
router.put('/:id', auth, editUser);

// Ruta para eliminar un usuario
router.delete('/:id', auth, deleteUser);

module.exports = router;