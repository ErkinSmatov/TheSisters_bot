const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: Date,
  message: String
});

const Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;
