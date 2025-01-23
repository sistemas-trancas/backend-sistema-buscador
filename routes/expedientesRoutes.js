const express = require('express');
const {
  addFile,
  getFileById,
  getFiles,
  editFile,
  deleteFile,
  searchFilesByNumeroExpediente,
} = require('../controllers/expedientesController');
const auth = require('../middleware/auth');
const router = express.Router();

// Ruta para crear expedientes
router.post('/', auth, addFile);

// Ruta para obtener un expediente por ID
router.get('/:id', auth, getFileById);

// Ruta para obtener todos los expedientes
router.get('/', auth, getFiles);

// Ruta para editar un expediente
router.put('/:id', auth, editFile);

// Ruta para eliminar un expediente
router.delete('/:id', auth, deleteFile);

// Ruta para buscar expedientes por número de expediente
router.post('/search', auth, searchFilesByNumeroExpediente);

module.exports = router;