const Area = require("../models/Area");
const User = require("../models/usuario");
const { validationResult } = require("express-validator");
const {
  existeUsuarioPorId,
  esRoleValido,
} = require("../helpers/db-validators");

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

    // Validar el moderador solo si se pasa un moderadorId
    let moderator = null;
    if (moderatorId) {
      moderator = await User.findById(moderatorId);
      if (!moderator) {
        return res.status(400).json({ message: 'Moderador no encontrado' });
      }

      // Verificar que el moderador tenga el rol 'moderator'
      if (moderator.role !== 'moderator') {
        return res.status(400).json({ message: 'El usuario proporcionado no tiene el rol de moderador' });
      }
    }

    // Crear el nuevo área
    const newArea = new Area({
      name,
      createdBy: userId,
      moderator: moderator ? moderator._id : null, // Asignar el ObjectId del moderador
    });

    // Guardar el área
    await newArea.save();

    // Devolver la respuesta con el área creada y el moderador
    res.status(201).json({
      _id: newArea._id,
      name: newArea.name,
      moderator: moderator ? { _id: moderator._id, username: moderator.username } : null,
    });
  } catch (err) {
    console.error('Error al crear área:', err);
    res.status(500).json({ message: 'Error al crear área' });
  }
};
// Editar área
const editArea = async (req, res) => {    
  const { id } = req.params;
  const { userId, name, moderatorId, createdBy } = req.body;  // Agregado 'createdBy'

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

    // Actualización de los campos
    area.name = name || area.name;
    area.moderator = moderator ? moderator._id : area.moderator;
    area.createdBy = createdBy || area.createdBy;  // Asignación de 'createdBy'

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
    const userId = req.usuario.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ message: 'No tiene permisos para ver las áreas' });
    }

    const areas = await Area.find({ $or: [{ active: true }, { active: { $exists: false } }] }) // Filtrar por áreas activas
      .populate({
        path: 'moderator',
        select: 'username email dni role',
        model: 'Usuario'
      })
      .populate({
        path: 'createdBy',
        select: 'username',
        model: 'Usuario'
      })
      .lean();

    res.status(200).json({ areas });
  } catch (err) {
    console.error('Error al obtener áreas:', err);
    res.status(500).json({ message: 'Error al obtener áreas' });
  }
};
// Obtener área por ID
const getAreaById = async (req, res) => {
  const { id } = req.params;

  try {
    const area = await Area.findById(id)
      .populate("moderator", "username");  // Aquí debes especificar qué campo(s) deseas del moderador

    if (!area) {
      return res.status(404).json({ message: "Área no encontrada" });
    }

    res.status(200).json(area);
  } catch (err) {
    console.error("Error al obtener área:", err);
    res.status(500).json({ message: "Error al obtener área" });
  }
};

// Eliminar área
const deleteArea = async (req, res) => {
  const { id } = req.params;
  const userId = req.usuario.id;

  try {
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "No tiene permisos para eliminar áreas" });
    }

    const area = await Area.findById(id);
    if (!area) {
      return res.status(404).json({ message: "Área no encontrada" });
    }

    area.active = false; // Marcar el área como inactiva
    await area.save();

    res.status(200).json({ message: "Área desactivada correctamente" });
  } catch (err) {
    console.error("Error al desactivar área:", err);
    res.status(500).json({ message: "Error al desactivar área" });
  }
};

module.exports = {
  addArea,
  editArea,
  getAreas,
  getAreaById,
  deleteArea,
};
