const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Run validation and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    return next(new AppError(message, 422, 'VALIDATION_ERROR'));
  }
  next();
};

const initiateKycRules = [
  body('aadhaarNumber')
    .notEmpty().withMessage('Aadhaar number is required')
    .isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits')
    .isNumeric().withMessage('Aadhaar must contain only numbers'),
  body('consent')
    .notEmpty().withMessage('Consent is required')
    .isBoolean().withMessage('Consent must be true or false'),
];

const verifyOtpRules = [
  body('txnId').notEmpty().withMessage('Transaction ID is required'),
  body('aadhaarNumber')
    .notEmpty().withMessage('Aadhaar number is required')
    .isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits')
    .isNumeric().withMessage('Aadhaar must contain only numbers'),
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
];

const getKycDataRules = [
  param('txnId')
    .notEmpty().withMessage('Transaction ID is required')
    .isString().withMessage('Transaction ID must be a string'),
];

module.exports = { validate, initiateKycRules, verifyOtpRules, getKycDataRules };