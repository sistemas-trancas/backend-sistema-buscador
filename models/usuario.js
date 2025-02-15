const { Schema, model } = require("mongoose");

const UsuarioSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "moderator", "admin"],
    required: true,
  },
  area: {
    type: String,
    required: false,
  },
  dni: {
    type: String,
    required: true,
    index: true, // Solo crea un índice normal, sin `unique`
  },
  email: {
    type: String,
    required: true,
    index: true, // Solo crea un índice normal, sin `unique`
  },
  active: {
    type: Boolean,
    default: true,
  }
});

//Agregar un índice compuesto para evitar duplicados solo en usuarios activos
UsuarioSchema.index({ dni: 1, active: 1 }, { unique: true });
UsuarioSchema.index({ email: 1, active: 1 }, { unique: true });

module.exports = model("Usuario", UsuarioSchema);
