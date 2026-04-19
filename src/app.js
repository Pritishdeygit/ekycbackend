require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const AppError = require('./utils/AppError');

const app = express();

const { runCleanup } = require('./utils/cleanupJob');

// Connect DB
connectDB();

// Run cleanup every hour
setInterval(runCleanup, 60 * 60 * 1000);

// Also run once on startup
runCleanup();

// Core Middleware
app.use(helmet());                          // Security headers
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));  // Limit payload size
app.use(morgan('combined'));

// Routes (added in Step 4)
app.use('/api/v1/kyc', require('./routes/kyc.routes'));

// 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  logger.error({
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode,
  });

  // Never leak stack traces or internal details in production
  res.status(statusCode).json({
    status: 'error',
    code: err.code || 'INTERNAL_ERROR',
    message: isOperational ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Temporary debug — remove after fix
app._router.stack.forEach((r) => {
  if (r.route) console.log(r.route.path);
  if (r.handle && r.handle.stack) {
    r.handle.stack.forEach((h) => {
      if (h.route) console.log(h.route.path);
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));