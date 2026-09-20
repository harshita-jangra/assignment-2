// config/db.js
// MongoDB connection configuration using Mongoose

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/labvault';
    const conn = await mongoose.connect(connUri);
    console.log(`✓ MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`✕ MongoDB Connection Failed: ${error.message}`);
    // If running in development without local mongo, log friendly guidance
    console.error('Please ensure MongoDB is running locally or provide a valid MONGODB_URI in your .env file.');
    process.exit(1);
  }
};

module.exports = connectDB;
