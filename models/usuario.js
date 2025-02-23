const { Schema, model } = require("mongoose");

const UsuarioSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "moderator", "admin"], required: true },
  area: { type: String, required: false },
  dni: { type: String, required: true },
  active: { type: Boolean, default: true },
});

// 🔹 Solo evitamos duplicados si el usuario está activo
UsuarioSchema.index({ dni: 1, active: 1 }, { unique: true });

module.exports = model("Usuario", UsuarioSchema);
