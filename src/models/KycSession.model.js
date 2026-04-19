const mongoose = require('mongoose');

const kycSessionSchema = new mongoose.Schema({
  txnId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  aadhaarLast4: {
    type: String,  // NEVER store full Aadhaar — only last 4 digits
    required: true,
  },
  otpHash: {
    type: String,  // Store hashed OTP, never plaintext
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3,        // Lock after 3 wrong attempts
  },
  consentGiven: {
    type: Boolean,
    required: true,
  },
  consentTimestamp: {
    type: Date,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'FAILED', 'EXPIRED'],
    default: 'PENDING',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600,  // TTL — auto-delete after 10 minutes
  },
});

module.exports = mongoose.model('KycSession', kycSessionSchema);