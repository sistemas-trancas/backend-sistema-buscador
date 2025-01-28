const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');


const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Moderator',
    required: false,
  },
});

module.exports = mongoose.model('Area', areaSchema);