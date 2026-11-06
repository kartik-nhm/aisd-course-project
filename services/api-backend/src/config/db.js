const mongoose = require('mongoose');

async function connectDB(mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log('[Database] MongoDB connected successfully');
  } catch (error) {
    console.warn('[Database] MongoDB connection warning:', error.message);
  }
}

module.exports = { connectDB };
