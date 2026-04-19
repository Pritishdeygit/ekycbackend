const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  txnId: {
    type: String,
    required: true,
    index: true,
  },
  event: {
    type: String,
    enum: [
      'OTP_INITIATED',
      'OTP_VERIFIED',
      'OTP_FAILED',
      'OTP_EXPIRED',
      'KYC_FETCHED',
      'KYC_STORED',
      'KYC_RETRIEVED',
      'MAX_ATTEMPTS_EXCEEDED',
    ],
    required: true,
  },
  ipAddress:  { type: String, required: true },
  userAgent:  { type: String },
  meta:       { type: mongoose.Schema.Types.Mixed }, // any extra context
  createdAt:  { type: Date, default: Date.now },
});

// Prevent any update or delete at schema level
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'deleteOne', 'deleteMany'], function () {
  throw new Error('Audit logs are immutable');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);