const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Generate a unique transaction ID
const generateTxnId = () => `TXN-${uuidv4()}`;

// Hash OTP using SHA-256 — never store plaintext
const hashOtp = (otp) =>
  crypto.createHash('sha256').update(otp.toString()).digest('hex');

// Generate a random numeric OTP of given length
const generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Mask Aadhaar — return only last 4 digits
const maskAadhaar = (aadhaar) => aadhaar.slice(-4);

// Validate Aadhaar format — 12 digits, cannot start with 0 or 1
const isValidAadhaar = (aadhaar) => /^[2-9]{1}[0-9]{11}$/.test(aadhaar);

module.exports = { generateTxnId, hashOtp, generateOtp, maskAadhaar, isValidAadhaar };