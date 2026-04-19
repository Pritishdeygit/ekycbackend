const { v4: uuidv4 } = require('uuid');
const KycSession = require('../models/KycSession.model');
const KycRecord = require('../models/KycRecord.model');
const AuditLog = require('../models/AuditLog.model');
const mockProvider = require('./mockEkycProvider.service');
const { generateTxnId, hashOtp, maskAadhaar, isValidAadhaar } = require('../utils/helpers');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * STEP 1 — Initiate KYC
 * Validates Aadhaar, triggers OTP, creates session
 */
const initiateKyc = async ({ aadhaarNumber, consent, ipAddress, userAgent }) => {

  // 1. Validate consent — must be explicit
  if (!consent) {
    throw new AppError('User consent is required to proceed', 400, 'CONSENT_REQUIRED');
  }

  // 2. Validate Aadhaar format
  if (!isValidAadhaar(aadhaarNumber)) {
    throw new AppError('Invalid Aadhaar number format', 400, 'INVALID_AADHAAR');
  }

  // 3. Call mock provider to send OTP
  const providerResponse = await mockProvider.sendOtp(aadhaarNumber);
  if (!providerResponse.success) {
    throw new AppError(providerResponse.message, 502, providerResponse.error);
  }

  // 4. Generate txnId + hash OTP for storage
  const txnId = generateTxnId();

  // We don't have the raw OTP here in real flow (provider sends it via SMS)
  // In simulation, provider exposes it via otpStore internally
  // We store a placeholder hash — real OTP hash is verified at verify step
  // For simulation: we store txnId and let verify step handle OTP directly
  
  // 5. Create session in DB
  const session = await KycSession.create({
    txnId,
    aadhaarLast4: maskAadhaar(aadhaarNumber),
    otpHash: hashOtp(txnId), // placeholder — real hash set at verify
    consentGiven: true,
    consentTimestamp: new Date(),
    ipAddress,
    status: 'PENDING',
  });

  // 6. Audit log
  await AuditLog.create({
    txnId,
    event: 'OTP_INITIATED',
    ipAddress,
    userAgent,
    meta: {
      aadhaarLast4: maskAadhaar(aadhaarNumber),
      refId: providerResponse.refId,
    },
  });

  logger.info(`KYC initiated — txnId: ${txnId}`);

  return {
    txnId,
    message: 'OTP sent to Aadhaar-linked mobile number',
    expiresInSeconds: 600,
  };
};

/**
 * STEP 2 — Verify OTP
 * Validates session, verifies OTP, fetches and stores KYC data
 */
const verifyOtp = async ({ txnId, aadhaarNumber, otp, ipAddress, userAgent }) => {

  // 1. Find active session
  const session = await KycSession.findOne({ txnId, status: 'PENDING' });
  if (!session) {
    throw new AppError('Session not found or already expired', 404, 'SESSION_NOT_FOUND');
  }

  // 2. Match aadhaar last 4 against session
  if (session.aadhaarLast4 !== maskAadhaar(aadhaarNumber)) {
    throw new AppError('Aadhaar mismatch for this session', 400, 'AADHAAR_MISMATCH');
  }

  // 3. Check attempt limit
  if (session.attempts >= 3) {
    await KycSession.updateOne({ txnId }, { status: 'FAILED' });
    await AuditLog.create({
      txnId,
      event: 'MAX_ATTEMPTS_EXCEEDED',
      ipAddress,
      userAgent,
    });
    throw new AppError('Max OTP attempts exceeded. Please initiate again.', 429, 'MAX_ATTEMPTS_EXCEEDED');
  }

  // 4. Call mock provider to verify OTP + fetch KYC
  const providerResponse = await mockProvider.verifyOtpAndFetchKyc(aadhaarNumber, otp);

  // 5. Handle wrong OTP
  if (!providerResponse.success) {
    // Increment attempt count
    await KycSession.updateOne({ txnId }, { $inc: { attempts: 1 } });

    await AuditLog.create({
      txnId,
      event: 'OTP_FAILED',
      ipAddress,
      userAgent,
      meta: { error: providerResponse.error, attempts: session.attempts + 1 },
    });

    throw new AppError(providerResponse.message, 400, providerResponse.error);
  }

  // 6. Save photo to local storage
  const { kycData } = providerResponse;
  const photoPath = await mockProvider.saveKycPhoto(txnId, kycData.photoBase64);

  // 7. Store KYC record
  const kycRecord = await KycRecord.create({
    txnId,
    aadhaarLast4: maskAadhaar(aadhaarNumber),
    name: kycData.name,
    dob: kycData.dob,
    gender: kycData.gender,
    address: kycData.address,
    photoPath,
    mobileVerified: kycData.mobileVerified,
    ipAddress,
  });

  // 8. Mark session as verified
  await KycSession.updateOne({ txnId }, { status: 'VERIFIED' });

  // 9. Audit log
  await AuditLog.create({
    txnId,
    event: 'KYC_STORED',
    ipAddress,
    userAgent,
    meta: { aadhaarLast4: maskAadhaar(aadhaarNumber) },
  });

  logger.info(`KYC verified and stored — txnId: ${txnId}`);

  return {
    txnId,
    message: 'KYC verification successful',
    name: kycRecord.name,
  };
};

/**
 * STEP 3 — Fetch KYC Data
 * Retrieves stored KYC record by txnId
 */
const getKycData = async ({ txnId, ipAddress, userAgent }) => {

  const record = await KycRecord.findOne({ txnId });
  if (!record) {
    throw new AppError('KYC record not found or has expired', 404, 'KYC_NOT_FOUND');
  }

  // Audit log
  await AuditLog.create({
    txnId,
    event: 'KYC_RETRIEVED',
    ipAddress,
    userAgent,
  });

  return {
    txnId: record.txnId,
    name: record.name,
    dob: record.dob,
    gender: record.gender,
    address: record.address,
    aadhaarLast4: record.aadhaarLast4,
    mobileVerified: record.mobileVerified,
    photoPath: record.photoPath,
    createdAt: record.createdAt,
  };
};

module.exports = { initiateKyc, verifyOtp, getKycData };