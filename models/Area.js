const mongoose = require('mongoose');
const { Schema } = mongoose;

const areaSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin', // Asumimos que Admin es otro modelo definido en tu aplicación.
    required: true
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',  // Ahora se usa el modelo de Usuario para la referencia al moderador
    required: false,
  },
});

module.exports = mongoose.model('Area', areaSchema);
