const validarRole = (req, res, next) => {
  const { role } = req.usuario;

  if (role !== 'admin' && role !== 'moderator') {
    return res.status(403).json({
      msg: 'No tiene permisos para realizar esta acción',
    });
  }

  next();
};

module.exports = {
  validarRole,
};