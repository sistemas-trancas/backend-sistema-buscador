// routes/auth.js
const { Router } = require("express");
const { check } = require("express-validator");
const { login, verifyToken } = require("../controllers/auth"); // Importa verifyToken
const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt"); // Importa tu middleware validarJWT

const router = Router();

router.post(
  "/login",
  [
    check("dni", "El DNI es obligatorio").not().isEmpty(),
    check("password", "La contraseña es obligatoria").not().isEmpty(),
    validarCampos,
  ],
  login
);

router.get('/verify', validarJWT, verifyToken); // Usa el controlador verifyToken

module.exports = router;