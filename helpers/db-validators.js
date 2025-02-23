const User = require("../models/usuario");
const Area = require("../models/Area");
const { isValidObjectId } = require('mongoose');

const esRoleValido = async (role) => {
  const rolesValidos = ["admin", "moderator", "user"];
  if (!rolesValidos.includes(role)) {
    throw new Error(`El rol ${role} no es válido`);
  }
};

const dniExiste = async (dni) => {
  const existeDni = await User.findOne({ dni, active: true }); // Solo verifica usuarios activos
  if (existeDni) {
    throw new Error(`El DNI ${dni} ya está registrado y activo`);
  }
};


const existeUsuarioPorId = async (id) => {
  const existeUsuario = await User.findById(id);
  if (!existeUsuario) {
    throw new Error(`El usuario con ID ${id} no existe`);
  }
};

const existeAreaPorId = async (id) => {
  if (!isValidObjectId(id)) {
      throw new Error(`El ID "${id}" del Area no es válido.`);
  }

  const area = await Area.findById(id);
  if (!area) {
      throw new Error(`El área con el ID "${id}" no existe.`);
  }
};

module.exports = {
  esRoleValido,
  dniExiste,
  existeUsuarioPorId,
  existeAreaPorId,
};
