const Area = require("../models/Area");
const User = require("../models/usuario");
const { validationResult } = require("express-validator");
const {
  existeUsuarioPorId,
  esRoleValido,
} = require("../helpers/db-validators");

// Crear área
// Crear área
const addArea = async (req, res) => {
  const { name, moderatorId } = req.body;
  const userId = req.usuario.id; // ID del usuario que crea el área, obtenido del token

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar si el usuario que crea el área es administrador
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'No tiene permisos para crear áreas' });
    }

    let moderator = null;
    if (moderatorId) {
      moderator = await User.findById(moderatorId);
      if (!moderator) {
        return res.status(400).json({ message: 'Moderador no encontrado' });
      }
      await esRoleValido(moderator.role);
      if (moderator.role !== 'moderator') {
        return res.status(400).json({ message: 'El usuario proporcionado no tiene el rol de moderador' });
      }
    }

    const newArea = new Area({
      name,
      createdBy: userId,
      moderator: moderator ? moderator._id : null,
    });

    await newArea.save();

    res.status(201).json(newArea);
  } catch (err) {
    console.error('Error al crear área:', err);
    res.status(500).json({ message: 'Error al crear área' });
  }
};

// Editar área
const editArea = async (req, res) => {
  const { id } = req.params;
  const { userId, name, moderatorId } = req.body;

  try {
    // Validar resultados de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "No tiene permisos para editar áreas" });
    }

    const area = await Area.findById(id);
    if (!area) {
      return res.status(404).json({ message: "Área no encontrada" });
    }

    let moderator = null;
    if (moderatorId) {
      moderator = await User.findById(moderatorId);
      if (!moderator) {
        return res.status(400).json({ message: "Moderador no encontrado" });
      }
      if (moderator.role !== "moderator") {
        return res
          .status(400)
          .json({
            message: "El usuario proporcionado no tiene el rol de moderador",
          });
      }
    }

    area.name = name || area.name;
    area.moderator = moderator ? moderator._id : area.moderator;

    await area.save();
    res.status(200).json(area);
  } catch (err) {
    console.error("Error al editar área:", err);
    res.status(500).json({ message: "Error al editar área" });
  }
};

// Obtener todas las áreas
const getAreas = async (req, res) => {
  try {
    const areas = await Area.find().populate("moderator", "username");
    res.status(200).json(areas);
  } catch (err) {
    console.error("Error al obtener áreas:", err);
    res.status(500).json({ message: "Error al obtener áreas" });
  }
};

// Obtener área por ID
const getAreaById = async (req, res) => {
  const { id } = req.params;

  try {
    const area = await Area.findById(id).populate("moderator", "username");
    if (!area) {
      return res.status(404).json({ message: "Área no encontrada" });
    }
    res.status(200).json(area);
  } catch (err) {
    console.error("Error al obtener área:", err);
    res.status(500).json({ message: "Error al obtener área" });
  }
};

module.exports = {
  addArea,
  editArea,
  getAreas,
  getAreaById,
};
