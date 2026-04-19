const kycService = require('../services/kyc.service');

const initiateKyc = async (req, res, next) => {
  try {
    const { aadhaarNumber, consent } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await kycService.initiateKyc({
      aadhaarNumber,
      consent,
      ipAddress,
      userAgent,
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err); // Global error handler takes over
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { txnId, aadhaarNumber, otp } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await kycService.verifyOtp({
      txnId,
      aadhaarNumber,
      otp,
      ipAddress,
      userAgent,
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

const getKycData = async (req, res, next) => {
  try {
    const { txnId } = req.params;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await kycService.getKycData({ txnId, ipAddress, userAgent });

    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { initiateKyc, verifyOtp, getKycData };