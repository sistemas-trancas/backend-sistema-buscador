const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRole } = require("../middlewares/validar-role");
const { existeUsuarioPorId } = require("../helpers/db-validators");
const User = require("../models/usuario");

const {
  addArea,
  editArea,
  getAreas,
  getAreaById,
  deleteArea,
  getAreaByName,
} = require("../controllers/areasController");

const router = Router();

// Ruta para crear áreas
router.post(
  "/",
  [
    validarJWT,
    validarRole,
    check('name', 'El nombre del área es obligatorio').notEmpty(),
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
    validarCampos,
  ],
  addArea
);

// Ruta para editar áreas
router.put(
  '/:id',
  [
    validarJWT,
    validarRole,
    check('id', 'No es un Id válido').isMongoId(),
    check('name', 'El nombre del área es obligatorio').notEmpty(),
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
    validarCampos,
  ],
  editArea
);

// Ruta para obtener todas las áreas (solo para usuarios con rol 'admin')
router.get('/', [validarJWT, validarRole], getAreas);

// Ruta para obtener un área por ID (solo para usuarios con rol 'admin' o 'moderator')
router.get('/:id', [validarJWT], getAreaById);

// Ruta para obtener un área por nombre (solo para usuarios con rol 'admin' o 'moderator')
router.get('/name/:name', [validarJWT], getAreaByName);

// eliminar area
router.delete('/:id', [validarJWT, validarRole], deleteArea);

module.exports = router;