const User = require('../models/User');
const Area = require('../models/Area');

const esRoleValido = async (role) => {
  const rolesValidos = ['admin', 'moderator', 'user'];
  if (!rolesValidos.includes(role)) {
    throw new Error(`El rol ${role} no es válido`);
  }
};

const emailExiste = async (email) => {
  const existeEmail = await User.findOne({ email });
  if (existeEmail) {
    throw new Error(`El correo ${email} ya está registrado`);
  }
};

const dniExiste = async (dni) => {
  const existeDni = await User.findOne({ dni });
  if (existeDni) {
    throw new Error(`El DNI ${dni} ya está registrado`);
  }
};

const existeUsuarioPorId = async (id) => {
  const existeUsuario = await User.findById(id);
  if (!existeUsuario) {
    throw new Error(`El usuario con ID ${id} no existe`);
  }
};

const existeAreaPorId = async (id) => {
  const existeArea = await Area.findById(id);
  if (!existeArea) {
    throw new Error(`El área con ID ${id} no existe`);
  }
};

module.exports = {
  esRoleValido,
  emailExiste,
  dniExiste,
  existeUsuarioPorId,
  existeAreaPorId,
};