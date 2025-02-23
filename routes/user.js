const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRole } = require("../middlewares/validar-role");
const {
  esRoleValido,
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
// Ruta para editar usuario
router.put(
  "/:id",
  [
    validarJWT,
    validarRole,
    check("password", "La contraseña debe tener más de 6 caracteres").optional().isLength({ min: 6 }),
    check("areaId", "El ID del área no es válido").optional().isMongoId(),
    validarCampos
  ],
  editUser
);

// Ruta para eliminar usuario
router.delete("/:id", [validarJWT, validarRole], deleteUser);


module.exports = router;