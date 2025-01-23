const express = require('express');
const { check } = require('express-validator');
const { addFile, getFileById, getFiles, editFile, deleteFile, searchFilesByNumeroExpediente } = require('../controllers/expedientesController');
const { existeUsuarioPorId, existeAreaPorId } = require('../helpers/db-validators');
const auth = require('../middleware/auth');
const router = express.Router();

// Ruta para crear expedientes
router.post(
  '/',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
    check('categoria').custom(existeAreaPorId),
  ],
  addFile
);

// Ruta para obtener un expediente por ID
router.get(
  '/:id',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
  ],
  getFileById
);

// Ruta para obtener todos los expedientes
router.get(
  '/',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
  ],
  getFiles
);

// Ruta para editar un expediente
router.put(
  '/:id',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
  ],
  editFile
);

// Ruta para eliminar un expediente
router.delete(
  '/:id',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
  ],
  deleteFile
);

// Ruta para buscar expedientes por número de expediente
router.post(
  '/search',
  [
    auth,
    check('userId').custom(existeUsuarioPorId),
  ],
  searchFilesByNumeroExpediente
);

module.exports = router;