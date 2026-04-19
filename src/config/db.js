const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // No deprecated options needed in Mongoose 7+
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`DB Connection Error: ${err.message}`);
    process.exit(1); // Fail fast — don't run without DB
  }
};

module.exports = connectDB;