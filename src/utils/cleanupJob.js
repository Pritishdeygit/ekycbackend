const fs = require('fs');
const path = require('path');
const KycRecord = require('../models/KycRecord.model');
const logger = require('../utils/logger');
const { STORAGE_BASE } = require('../config/storage');

const runCleanup = async () => {
  try {
    // Find all photo filenames currently in storage
    const filesOnDisk = fs.readdirSync(STORAGE_BASE);

    if (filesOnDisk.length === 0) return;

    // Find which txnIds still exist in DB
    const records = await KycRecord.find({}, { txnId: 1 });
    const activeTxnIds = new Set(records.map((r) => r.txnId));

    // Delete files whose txnId no longer exists in DB
    let deletedCount = 0;
    for (const file of filesOnDisk) {
      const txnId = file.replace('.jpg', ''); // filename = TXN-xxxx.jpg
      if (!activeTxnIds.has(txnId)) {
        const filePath = path.join(STORAGE_BASE, file);
        fs.unlinkSync(filePath);
        deletedCount++;
        logger.info(`Cleanup: deleted orphaned photo — ${file}`);
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleanup job completed — ${deletedCount} file(s) deleted`);
    }

  } catch (err) {
    logger.error(`Cleanup job failed: ${err.message}`);
  }
};

module.exports = { runCleanup };