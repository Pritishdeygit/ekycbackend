const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const {
  validate,
  initiateKycRules,
  verifyOtpRules,
  getKycDataRules,
} = require('../middlewares/validate');

// POST /api/v1/kyc/initiate
router.post('/initiate', initiateKycRules, validate, kycController.initiateKyc);

// POST /api/v1/kyc/verify-otp
router.post('/verify-otp', verifyOtpRules, validate, kycController.verifyOtp);

// GET /api/v1/kyc/data/:txnId
router.get('/data/:txnId', getKycDataRules, validate, kycController.getKycData);

// DEVELOPMENT ONLY — remove in production
// Add to kyc.routes.js temporarily
router.delete('/test-cleanup', async (req, res) => {
  const { runCleanup } = require('../utils/cleanupJob');
  await runCleanup();
  res.json({ status: 'success', message: 'Cleanup ran' });
});

module.exports = router;