const express = require('express');
const { check } = require('express-validator');
const { addArea, editArea, getAreas, getAreaById } = require('../controllers/areasController');
const { existeUsuarioPorId, esRoleValido } = require('../helpers/db-validators');
const auth = require('../middleware/auth');
const router = express.Router();

// Ruta para crear áreas
router.post(
  '/',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
    check('moderatorId').optional().custom(async (moderatorId) => {
      if (moderatorId) {
        const moderator = await User.findById(moderatorId);
        if (!moderator) {
          throw new Error('Moderador no encontrado');
        }
        if (moderator.role !== 'moderator') {
          throw new Error('El usuario proporcionado no tiene el rol de moderador');
        }
      }
    }),
  ],
  addArea
);

// Ruta para editar áreas
router.put(
  '/:id',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
    check('moderatorId').optional().custom(async (moderatorId) => {
      if (moderatorId) {
        const moderator = await User.findById(moderatorId);
        if (!moderator) {
          throw new Error('Moderador no encontrado');
        }
        if (moderator.role !== 'moderator') {
          throw new Error('El usuario proporcionado no tiene el rol de moderador');
        }
      }
    }),
  ],
  editArea
);

// Ruta para obtener todas las áreas
router.get('/', auth, getAreas);

// Ruta para obtener un área por ID
router.get('/:id', auth, getAreaById);

module.exports = router;