const mongoose = require('mongoose');
const config = require("config");
const PORT = config.get("serverPort");
const dbUrl = config.get("dbUrl");

mongoose.connect(dbUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

module.exports = mongoose;