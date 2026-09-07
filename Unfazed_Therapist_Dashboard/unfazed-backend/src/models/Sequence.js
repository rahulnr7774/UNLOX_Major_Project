const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  value: { type: Number, default: 0 }
});

module.exports = mongoose.model('Sequence', sequenceSchema);
