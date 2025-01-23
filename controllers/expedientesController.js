const File = require('../models/File');
const User = require('../models/User');
const Area = require('../models/Area');
const moment = require('moment-timezone');
const { validationResult } = require('express-validator');
const { existeUsuarioPorId, existeAreaPorId } = require('../helpers/db-validators');

// Crear expediente
const addFile = async (req, res) => {
  const { userId, numeroExpediente, fecha, caja, name, description, categoria } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    if (user.role === 'admin' || (user.role === 'moderator' && user.area.toString() === categoria)) {
      const newFile = new File({
        userId,
        numeroExpediente,
        fecha,
        caja,
        name,
        description,
        categoria,
        createdBy: user._id,
        createdAt: moment().tz('America/Argentina/Buenos_Aires').toDate(),
      });

      await newFile.save();
      res.status(201).json(newFile);
    } else {
      res.status(403).json({ message: 'No tiene permisos para crear expedientes en esta área' });
    }
  } catch (err) {
    console.error('Error al agregar expediente:', err);
    res.status(500).json({ message: 'Error al agregar expediente' });
  }
};

// Obtener expediente por ID
const getFileById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    const file = await File.findById(id).populate('createdBy', 'username').populate('updatedBy', 'username');
    if (!file) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    if (user.role === 'admin' || file.categoria.toString() === user.area.toString()) {
      res.status(200).json(file);
    } else {
      res.status(403).json({ message: 'No tiene permisos para ver este expediente' });
    }
  } catch (err) {
    console.error('Error al obtener expediente:', err);
    res.status(500).json({ message: 'Error al obtener expediente' });
  }
};

// Obtener todos los expedientes
const getFiles = async (req, res) => {
  const { userId } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    let files;
    if (user.role === 'admin') {
      files = await File.find().populate('createdBy', 'username').populate('updatedBy', 'username');
    } else {
      files = await File.find({ categoria: user.area }).populate('createdBy', 'username').populate('updatedBy', 'username');
    }

    res.status(200).json(files);
  } catch (err) {
    console.error('Error al obtener expedientes:', err);
    res.status(500).json({ message: 'Error al obtener expedientes' });
  }
};

// Editar expediente
const editFile = async (req, res) => {
  const { id } = req.params;
  const { userId, numeroExpediente, fecha, caja, name, description } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    if (user.role === 'admin' || (user.role === 'moderator' && file.categoria.toString() === user.area.toString())) {
      file.numeroExpediente = numeroExpediente || file.numeroExpediente;
      file.fecha = fecha || file.fecha;
      file.caja = caja || file.caja;
      file.name = name || file.name;
      file.description = description || file.description;
      file.updatedBy = user._id;
      file.updatedAt = moment().tz('America/Argentina/Buenos_Aires').toDate();

      await file.save();
      res.status(200).json(file);
    } else {
      res.status(403).json({ message: 'No tiene permisos para editar este expediente' });
    }
  } catch (err) {
    console.error('Error al editar expediente:', err);
    res.status(500).json({ message: 'Error al editar expediente' });
  }
};

// Eliminar expediente
const deleteFile = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'Expediente no encontrado' });
    }

    if (user.role === 'admin' || (user.role === 'moderator' && file.categoria.toString() === user.area.toString())) {
      await file.remove();
      res.status(200).json({ message: 'Expediente eliminado correctamente' });
    } else {
      res.status(403).json({ message: 'No tiene permisos para eliminar este expediente' });
    }
  } catch (err) {
    console.error('Error al eliminar expediente:', err);
    res.status(500).json({ message: 'Error al eliminar expediente' });
  }
};

// Buscar expedientes por número de expediente
const searchFilesByNumeroExpediente = async (req, res) => {
  const { userId, numeroExpediente } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ message: 'Usuario no encontrado' });
    }

    let files;
    if (user.role === 'admin') {
      files = await File.find({ numeroExpediente }).populate('createdBy', 'username').populate('updatedBy', 'username');
    } else {
      files = await File.find({ numeroExpediente, categoria: user.area }).populate('createdBy', 'username').populate('updatedBy', 'username');
    }

    if (files.length === 0) {
      return res.status(404).json({ message: 'No se encontraron expedientes con ese número' });
    }

    res.status(200).json(files);
  } catch (err) {
    console.error('Error al buscar expedientes:', err);
    res.status(500).json({ message: 'Error al buscar expedientes' });
  }
};

module.exports = {
  addFile,
  getFileById,
  getFiles,
  editFile,
  deleteFile,
  searchFilesByNumeroExpediente,
};