const express = require('express');
const { addArea, editArea, getAreas, getAreaById } = require('../controllers/areasController');
const auth = require('../middleware/auth');
const router = express.Router();

// Ruta para crear áreas
router.post('/', auth, addArea);

// Ruta para editar áreas
router.put('/:id', auth, editArea);

// Ruta para obtener todas las áreas
router.get('/', auth, getAreas);

// Ruta para obtener un área por ID
router.get('/:id', auth, getAreaById);

module.exports = router;