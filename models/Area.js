const { Schema, model } = require("mongoose");

const AreaSchema = Schema({
  name: {
    type: String,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  moderator: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false
  }
});

module.exports = model('Area', AreaSchema);