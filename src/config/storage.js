const path = require('path');
const fs = require('fs');

const STORAGE_BASE = path.join(__dirname, '../storage/photos');

// Ensure folder exists on startup
if (!fs.existsSync(STORAGE_BASE)) {
  fs.mkdirSync(STORAGE_BASE, { recursive: true });
}

module.exports = { STORAGE_BASE };