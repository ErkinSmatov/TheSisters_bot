const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  name: String,
  phone: String,
//   email: String,
  package: { type: [String], default: [] },
  reminders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reminder' }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
