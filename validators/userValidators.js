const { body } = require('express-validator');

const validateUser = [
  body('userId').notEmpty().withMessage('El userId es obligatorio'),
  body('username').notEmpty().withMessage('El username es obligatorio'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  body('role').notEmpty().withMessage('El rol es obligatorio'),
  body('dni').notEmpty().withMessage('El DNI es obligatorio'),
  body('areaId')
    .if((value, { req }) => req.body.role === 'user') // Solo valida si el rol es "user"
    .notEmpty()
    .withMessage('El área es obligatoria para usuarios con rol "user"'),
];

module.exports = { validateUser };