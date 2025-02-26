const express = require("express");
const router = express.Router();
const { 
    crearExpediente, 
    editarExpediente,
    obtenerExpedientes, 
    obtenerExpediente,
    obtenerExpedientesPorArea,
    desactivarExpediente, 
    recuperarExpediente 
} = require("../controllers/expedienteController");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRole } = require("../middlewares/validar-role");
const { validarCampos } = require("../middlewares/validar-campos");
const { check } = require("express-validator");

// Crear expediente
router.post("/", [
    validarJWT, 
    check("titulo", "El título es obligatorio").not().isEmpty(),
    check("numeroExpediente", "El número de expediente es obligatorio").not().isEmpty(),
    check("caja", "La caja es obligatoria").not().isEmpty(),
    check("anio", "El año es obligatorio").not().isEmpty(),
    check("areaId", "El área es obligatoria").not().isEmpty(),
    validarCampos
], crearExpediente);

//editar expediente
// Editar expediente
router.put("/:id", [
  validarJWT], editarExpediente);


// Obtener todos los expedientes activos
router.get("/", validarJWT, obtenerExpedientes);

// Obtener un expediente por búsqueda dinámica
router.get("/buscar", validarJWT, obtenerExpediente);

// Obtener expedientes por área
router.get("/area/:areaId", validarJWT, obtenerExpedientesPorArea);

// Desactivar expediente
router.put("/desactivar/:id", [validarJWT, validarRole], desactivarExpediente);

// Recuperar expediente
router.put("/recuperar/:numero", [validarJWT, validarRole], recuperarExpediente);

module.exports = router;
