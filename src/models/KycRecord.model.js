const mongoose = require('mongoose');

const kycRecordSchema = new mongoose.Schema({
  txnId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  aadhaarLast4: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  dob: {
    type: String,   // "1995-06-15" — store as string, no time component needed
    required: true,
  },
  gender: {
    type: String,
    enum: ['M', 'F', 'T'],
    required: true,
  },
  address: {
    house:    { type: String },
    street:   { type: String },
    district: { type: String },
    state:    { type: String },
    pincode:  { type: String },
  },
  photoPath: {
    type: String,   // Relative path to saved image — NOT base64, NOT full URL
    required: true,
  },
  mobileVerified: {
    type: Boolean,
    default: false,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,  // TTL — auto-delete after 24 hours
  },
});


const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Fires after a document is deleted (including TTL expiry)
kycRecordSchema.post('findOneAndDelete', async function (doc) {
  if (doc && doc.photoPath) {
    try {
      const fullPath = path.join(__dirname, '../../', doc.photoPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`Photo deleted for txnId: ${doc.txnId}`);
      }
    } catch (err) {
      logger.error(`Failed to delete photo for txnId: ${doc.txnId} — ${err.message}`);
    }
  }
});

module.exports = mongoose.model('KycRecord', kycRecordSchema);