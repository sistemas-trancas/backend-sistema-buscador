const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRole } = require("../middlewares/validar-role");
const {
  esRoleValido,
  emailExiste,
  dniExiste,
  existeUsuarioPorId,
  existeAreaPorId,
} = require("../helpers/db-validators");

const {
  addUser,
  getUsers,
  getUserByDni,
  editUser,
  deleteUser,
  getUsersByModeratorArea
} = require("../controllers/userController");

const router = Router();

// Ruta para crear usuarios
router.post(
  "/",
  [
    validarJWT,
    validarRole,
    check("username", "El nombre de usuario es obligatorio").notEmpty(),
    check("password", "La contraseña debe tener más de 6 caracteres").isLength({
      min: 6,
    }),
    check("email", "El email no es válido").isEmail(),
    check("email").custom(emailExiste),
    check("role").custom(esRoleValido),
    check("dni", "El DNI es obligatorio").notEmpty(),
    check("dni").custom(dniExiste),
    validarCampos,
  ],
  addUser
);

// Ruta para obtener todos los usuarios
router.get("/", [validarJWT, validarRole], getUsers);

// Ruta para obtener un usuario por DNI
router.get(
  "/dni/:dni",
  [
    validarJWT,
    validarRole,
    check("dni", "El DNI es obligatorio").notEmpty(),
    validarCampos,
  ],
  getUserByDni
);
// Ruta para editar un usuario
router.put(
  "/:id",
  [
    validarJWT,
    validarRole,
    check("id", "No es un Id válido").isMongoId(),
    check("id").custom(existeUsuarioPorId),
    check("role").custom(esRoleValido),
    check("password").optional().isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
    validarCampos,
  ],
  editUser
);

// Ruta para eliminar un usuario
router.delete(
  "/:id",
  [
    validarJWT,
    validarRole,
    check("id", "No es un Id válido").isMongoId(),
    check("id").custom(existeUsuarioPorId),
    validarCampos,
  ],
  deleteUser
);

module.exports = router;