const mongoose = require('mongoose');

const expedienteSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: false,
  },
  numeroExpediente: {
    type: String,
    required: true,
  },
  anio: {
    type: Number,
    required: true,
  },
  caja: {
    type: String,
    required: true,
  },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true,
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  fechaActualizacion: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
  }
});

module.exports = mongoose.model('Expediente', expedienteSchema);
