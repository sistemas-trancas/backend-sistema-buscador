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
      !descripcion ||
      !areaId ||
      !numeroExpediente ||
      !caja ||
      !anio
    ) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios." });
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

const obtenerExpedientes = async (req, res) => {
  try {
    const usuarioRol = req.usuario.role;
    const usuarioArea = req.usuario.area;

    let expedientes;
    if (usuarioRol === "admin") {
      // Si el usuario es admin, puede ver todos los expedientes activos
      expedientes = await Expediente.find({ active: true }).populate(
        "area creadoPor",
        "nombre email"
      );
    } else if (usuarioRol === "moderator") {
      // Si el usuario es moderator, solo puede ver los expedientes activos de su área
      expedientes = await Expediente.find({
        area: usuarioArea,
        active: true,
      }).populate("area creadoPor", "username dni email area");
    } else {
      // Otros roles no tienen acceso a los expedientes
      return res.status(403).json({ message: "No tienes permisos para ver los expedientes." });
    }

    // Si no se encuentran expedientes, devuelve un mensaje adecuado
    if (!expedientes || expedientes.length === 0) {
      return res.status(404).json({ message: "No se encontraron expedientes activos." });
    }

    res.json(expedientes);
  } catch (error) {
    console.error(error);  // Esto imprime el error completo en la consola para depuración
    res.status(500).json({
      message: "Error al obtener los expedientes.",
      error: error.message || error,  // Mostramos el mensaje de error detallado
    });
  }
};



// Obtener un expediente por búsqueda dinámica
const obtenerExpediente = async (req, res) => {
  try {
    const { titulo, descripcion, caja, numeroExpediente } = req.query;
    const filtro = { active: true };

    if (titulo) filtro.titulo = new RegExp(titulo, "i");
    if (descripcion) filtro.descripcion = new RegExp(descripcion, "i");
    if (caja) filtro.caja = new RegExp(caja, "i");
    if (numeroExpediente) filtro.numeroExpediente = numeroExpediente;

    // Solo admin o moderator pueden buscar expedientes
    if (req.usuario.role !== "admin" && req.usuario.role !== "moderator") {
      return res
        .status(403)
        .json({ message: "No tienes permisos para buscar expedientes." });
    }

    const expediente = await Expediente.findOne(filtro).populate(
      "area creadoPor",
      "username dni email area"
    );

    if (!expediente) {
      return res.status(404).json({ message: "Expediente no encontrado." });
    }

    res.json(expediente);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el expediente.", error });
  }
};

// Obtener expedientes por área
const obtenerExpedientesPorArea = async (req, res) => {
  try {
    const { areaId } = req.params;

    // Validación de permisos: solo admin o moderator pueden obtener expedientes por área
    if (req.usuario.role !== "admin" && req.usuario.role !== "moderator") {
      return res
        .status(403)
        .json({
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
      return res.status(400).json({ message: "El expediente ya está desactivado.", expediente });
    }

    expediente.active = false;
    await expediente.save();

    res.json({
      message: "Expediente desactivado correctamente.",
      expediente
    });
  } catch (error) {
    res.status(500).json({ message: "Error al desactivar el expediente.", error });
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
      return res.status(400).json({ message: "El expediente ya está activo.", expediente });
    }

    expediente.active = true;
    await expediente.save();

    res.json({
      message: "Expediente recuperado correctamente.",
      expediente
    });
  } catch (error) {
    res.status(500).json({ message: "Error al recuperar el expediente.", error });
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
