const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');

const validarJWT = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ msg: 'No hay token en la petición' });
  }

  try {
    const { uid } = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario autenticado
    const usuario = await Usuario.findById(uid);
    if (!usuario || !usuario.active) {
      return res.status(401).json({ msg: 'Token no válido - usuario no existe o está inactivo' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error al validar token:', error);
    res.status(401).json({ msg: 'Token no válido' });
  }
};

module.exports = { validarJWT };
