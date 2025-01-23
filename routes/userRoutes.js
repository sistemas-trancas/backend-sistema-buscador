const express = require('express');
const { check } = require('express-validator');
const { addUser, loginUser, getUsers, getUserByDni, editUser, deleteUser } = require('../controllers/userController');
const { esRoleValido, emailExiste, dniExiste, existeUsuarioPorId, existeAreaPorId } = require('../helpers/db-validators');
const auth = require('../middleware/auth');
const router = express.Router();

// Ruta para crear usuarios
router.post(
  '/',
  [
    auth,
    check('role').custom(esRoleValido),
    check('email').custom(emailExiste),
    check('dni').custom(dniExiste),
    check('areaId').custom(existeAreaPorId),
  ],
  addUser
);

// Ruta para iniciar sesión
router.post('/login', loginUser);

// Ruta para obtener todos los usuarios
router.get('/', auth, getUsers);

// Ruta para obtener un usuario por DNI
router.get(
  '/dni/:dni',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
  ],
  getUserByDni
);

// Ruta para editar un usuario
router.put(
  '/:id',
  [
    auth,
    check('id').custom(existeUsuarioPorId),
    check('role').optional().custom(esRoleValido),
    check('email').optional().custom(emailExiste),
    check('dni').optional().custom(dniExiste),
    check('areaId').optional().custom(existeAreaPorId),
  ],
  editUser
);

// Ruta para eliminar un usuario
router.delete(
  '/:id',
  [
    auth,
    check('id').custom(existeUsuarioPorId),
  ],
  deleteUser
);

module.exports = router;