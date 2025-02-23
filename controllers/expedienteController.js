const File = require("../models/File");
const User = require("../models/usuario");
const Area = require("../models/Area");
const moment = require("moment-timezone");
const { validationResult } = require("express-validator");
const Expediente = require("../models/File");

const crearExpediente = async (req, res) => {
  try {
    // Información del usuario ya disponible en req.usuario (decodificado en el middleware)
    const { id: usuarioId, role: usuarioRol } = req.usuario;

    // Verificar si el rol es admin o moderator
    if (!["admin", "moderator"].includes(usuarioRol)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para crear un expediente." });
    }

    // Desestructurar los campos necesarios para crear el expediente
    const { titulo, descripcion, areaId, numeroExpediente, caja, anio } =
      req.body;

    // Validaciones adicionales
    if (
      !titulo ||
      !areaId ||
      !numeroExpediente ||
      !caja ||
      !anio
    ) {
      return res
        .status(400)
        .json({ message: "Los campos titulo, areaId, numeroExpediente, caja y año son obligatorios." });
    }

    // Verificar si el área existe
    const area = await Area.findById(areaId);
    if (!area) {
      return res
        .status(400)
        .json({ message: "El área especificada no existe." });
    }

    // Verificar si el expediente con ese número ya existe (con `activo: true`)
    const expedienteExistente = await Expediente.findOne({
      numeroExpediente,
      active: true,
    });
    if (expedienteExistente) {
      return res
        .status(400)
        .json({ message: "Ya existe un expediente con ese número." });
    }

    // Crear el expediente
    const nuevoExpediente = new Expediente({
      titulo,
      descripcion,
      area: areaId,
      numeroExpediente,
      caja,
      anio,
      creadoPor: usuarioId,
      active: true,
      fechaCreacion: new Date(),
    });

    await nuevoExpediente.save();
    res.status(201).json(nuevoExpediente);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el expediente.", error });
  }
};

// Editar expediente
const editarExpediente = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, numeroExpediente, caja, anio, areaId } =
      req.body;
    const usuarioId = req.usuario.id;

    // Buscar el expediente por ID
    const expediente = await Expediente.findById(id);

    if (!expediente) {
      return res.status(404).json({ message: "Expediente no encontrado." });
    }

    // Actualizar los campos del expediente
    expediente.titulo = titulo || expediente.titulo;
    expediente.descripcion = descripcion || expediente.descripcion;
    expediente.numeroExpediente =
      numeroExpediente || expediente.numeroExpediente;
    expediente.caja = caja || expediente.caja;
    expediente.anio = anio || expediente.anio;
    expediente.area = areaId || expediente.area;

    // Actualizar los campos de auditoría
    expediente.actualizadoPor = usuarioId;
    expediente.fechaActualizacion = new Date();

    // Guardar los cambios
    await expediente.save();

    res.status(200).json(expediente);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar el expediente.", error });
  }
};

//obtener todos los expedientes
const obtenerExpedientes = async (req, res) => {
  try {
    const usuarioRol = req.usuario.role;
    const usuarioArea = req.usuario.area;

    let expedientes;
    if (usuarioRol === "admin") {
      expedientes = await Expediente.find({ active: true })
        .populate({ path: "area", select: "name" })
        .populate("creadoPor", "username email")
        .populate("actualizadoPor", "username"); // Agrega esta línea
    } else if (usuarioRol === "moderator") {
      expedientes = await Expediente.find({
        area: usuarioArea,
        active: true,
      })
        .populate({ path: "area", select: "name" })
        .populate("creadoPor", "username dni email area")
        .populate("actualizadoPor", "username"); // Agrega esta línea
    } else {
      return res.status(403).json({ message: "No tienes permisos para ver los expedientes." });
    }

    if (!expedientes || expedientes.length === 0) {
      return res.status(404).json({ message: "No se encontraron expedientes activos." });
    }

    const expedientesConNombre = expedientes.map(expediente => {
      return {
        ...expediente.toObject(),
        area: {
          id: expediente.area._id,
          nombre: expediente.area.name
        },
        editadoPor: expediente.editadoPor ? expediente.editadoPor.username : null // Añadir username del que editó
      };
    });

    res.json(expedientesConNombre);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener los expedientes.",
      error: error.message || error,
    });
  }
};

// Obtener expedientes por búsqueda dinámica
const obtenerExpediente = async (req, res) => {
  try {
    const usuarioRol = req.usuario.role;
    const usuarioArea = req.usuario.area;
    const { titulo, descripcion, caja, numeroExpediente, anio, active } = req.query;

    let filtro = {};

    if (titulo) filtro.titulo = new RegExp(titulo, "i");
    if (descripcion) filtro.descripcion = new RegExp(descripcion, "i");
    if (caja) filtro.caja = new RegExp(caja, "i");
    if (numeroExpediente) filtro.numeroExpediente = numeroExpediente;
    if (anio) filtro.anio = anio;
    if (active) filtro.active = active;

    let expedientes;

    if (usuarioRol === "admin") {
      expedientes = await Expediente.find(filtro)
        .populate({ path: "area", select: "name" })
        .populate("creadoPor", "username email")
        .populate("actualizadoPor", "username");
    } else if (usuarioRol === "moderator") {
      filtro.area = usuarioArea;
      expedientes = await Expediente.find(filtro)
        .populate({ path: "area", select: "name" })
        .populate("creadoPor", "username dni email area")
        .populate("actualizadoPor", "username");
    } else {
      return res
        .status(403)
        .json({ message: "No tienes permisos para ver los expedientes." });
    }

    if (!expedientes || expedientes.length === 0) {
      return res.status(404).json({ message: "No se encontraron expedientes." });
    }

    const expedientesConNombre = expedientes.map((expediente) => {
      return {
        ...expediente.toObject(),
        area: {
          id: expediente.area._id,
          nombre: expediente.area.name,
        },
        editadoPor: expediente.actualizadoPor
          ? expediente.actualizadoPor.username
          : null,
      };
    });

    res.json(expedientesConNombre);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener los expedientes.",
      error: error.message || error,
    });
  }
};

// Obtener expedientes por área
const obtenerExpedientesPorArea = async (req, res) => {
  try {
    const { areaId } = req.params;

    // Validación de permisos: solo admin o moderator pueden obtener expedientes por área
    if (req.usuario.role !== "admin" && req.usuario.role !== "moderator") {
      return res.status(403).json({
        message:
          "No tienes permisos para obtener los expedientes de esta área.",
      });
    }

    const expedientes = await Expediente.find({
      area: areaId,
      active: true,
    }).populate("area creadoPor", "username dni email area");

    res.json(expedientes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener los expedientes del área.", error });
  }
};
//desactivar expediente
const desactivarExpediente = async (req, res) => {
  try {
    const { id } = req.params;
    const expediente = await Expediente.findById(id);

    if (!expediente) {
      return res.status(404).json({ message: "Expediente no encontrado." });
    }

    if (!expediente.active) {
      return res
        .status(400)
        .json({ message: "El expediente ya está desactivado.", expediente });
    }

    expediente.active = false;
    await expediente.save();

    res.json({
      message: "Expediente desactivado correctamente.",
      expediente,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al desactivar el expediente.", error });
  }
};

const recuperarExpediente = async (req, res) => {
  try {
    const { numero } = req.params;
    const expediente = await Expediente.findOne({ numeroExpediente: numero });

    if (!expediente) {
      return res.status(404).json({ message: "Expediente no encontrado." });
    }

    if (expediente.active) {
      return res
        .status(400)
        .json({ message: "El expediente ya está activo.", expediente });
    }

    expediente.active = true;
    await expediente.save();

    res.json({
      message: "Expediente recuperado correctamente.",
      expediente,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al recuperar el expediente.", error });
  }
};

module.exports = {
  crearExpediente,
  editarExpediente,
  obtenerExpedientes,
  obtenerExpediente,
  obtenerExpedientesPorArea,
  desactivarExpediente,
  recuperarExpediente,
};
