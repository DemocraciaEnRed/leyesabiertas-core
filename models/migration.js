const mongoose = require('mongoose')

const Migration = new mongoose.Schema({
  name: String,
  timestamp: Date
})

// Expose 'Migration' model
module.exports = mongoose.model('Migration', Migration)
