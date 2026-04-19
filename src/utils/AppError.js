class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;         // e.g. 'OTP_EXPIRED', 'KYC_NOT_FOUND'
    this.isOperational = true; // Distinguish from programmer errors
  }
}

module.exports = AppError;