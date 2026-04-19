const path = require('path');
const fs = require('fs');
const { generateOtp } = require('../utils/helpers');
const { STORAGE_BASE } = require('../config/storage');
const logger = require('../utils/logger');

// In-memory OTP store for simulation only
// In production this lives on the provider's server — not yours
const otpStore = new Map();

/**
 * Simulate sending OTP to Aadhaar-linked mobile
 * Real provider: POST https://api.provider.com/kyc/initiate
 */
const sendOtp = async (aadhaarNumber) => {
  // Simulate provider-side validation
  if (!aadhaarNumber || aadhaarNumber.length !== 12) {
    return {
      success: false,
      error: 'INVALID_AADHAAR',
      message: 'Aadhaar number is invalid',
    };
  }

  const otp = generateOtp(6);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store against aadhaar (provider does this on their end)
  otpStore.set(aadhaarNumber, { otp, expiresAt });

  // In real flow: provider sends OTP via SMS to linked mobile
  // Here we log it — only in simulation
  logger.debug(`[MOCK PROVIDER] OTP for ${aadhaarNumber.slice(-4)}: ${otp}`);

  return {
    success: true,
    message: 'OTP sent to Aadhaar-linked mobile number',
    // Real providers return a reference ID for the OTP request
    refId: `REF-${Date.now()}`,
  };
};

/**
 * Simulate OTP verification + KYC data fetch
 * Real provider: POST https://api.provider.com/kyc/verify
 */
const verifyOtpAndFetchKyc = async (aadhaarNumber, otp) => {
  const record = otpStore.get(aadhaarNumber);

  // OTP not found
  if (!record) {
    return {
      success: false,
      error: 'OTP_NOT_FOUND',
      message: 'No OTP found. Please initiate again.',
    };
  }

  // OTP expired
  if (Date.now() > record.expiresAt) {
    otpStore.delete(aadhaarNumber);
    return {
      success: false,
      error: 'OTP_EXPIRED',
      message: 'OTP has expired. Please initiate again.',
    };
  }

  // OTP mismatch
  if (parseInt(otp) !== record.otp) {
    return {
      success: false,
      error: 'OTP_INVALID',
      message: 'Incorrect OTP entered.',
    };
  }

  // OTP matched — clear it (one-time use)
  otpStore.delete(aadhaarNumber);

  // Return mock KYC payload — mirrors real Aadhaar eKYC response
  return {
    success: true,
    kycData: {
      name: 'Rahul Sharma',
      dob: '1995-06-15',
      gender: 'M',
      address: {
        house: '12A',
        street: 'MG Road',
        district: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
      },
      mobileVerified: true,
      // Base64 encoded 1x1 red pixel JPEG — represents Aadhaar photo
      // In real response this is a full JPEG of the person's photo
      photoBase64:
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
        'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
        'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
        'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
        'AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA' +
        '/9oADAMBAAIRAxEAPwCwABmX/9k=',
    },
  };
};

/**
 * Save base64 photo to local storage
 * Returns the relative file path
 */
const saveKycPhoto = async (txnId, base64Photo) => {
  try {
    const filename = `${txnId}.jpg`;
    const filepath = path.join(STORAGE_BASE, filename);
    const base64Data = base64Photo.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
    // Return relative path — not absolute, not a URL
    return `storage/photos/${filename}`;
  } catch (err) {
    logger.error(`Failed to save KYC photo: ${err.message}`);
    throw new Error('PHOTO_SAVE_FAILED');
  }
};

module.exports = { sendOtp, verifyOtpAndFetchKyc, saveKycPhoto };