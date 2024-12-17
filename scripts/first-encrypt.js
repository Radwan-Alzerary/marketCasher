const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');

const productinDir = path.join(__dirname, '..', 'productin');
const allMinPath = path.join(productinDir, 'all.min.js');
const encFirstPath = path.join(productinDir, 'all.min.first.enc');

// Static key for first encryption
const staticKey = "STATIC_BUILD_KEY";
const key = crypto.createHash('sha256').update(staticKey).digest();
const iv = crypto.randomBytes(16);

if (!fs.existsSync(allMinPath)) {
  console.error('all.min.js not found.');
  process.exit(1);
}

console.log('Encrypting all.min.js with static key...');
const inputData = fs.readFileSync(allMinPath);
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const encrypted = Buffer.concat([cipher.update(inputData), cipher.final()]);
const data = { iv: iv.toString('hex'), content: encrypted.toString('hex') };
fs.writeFileSync(encFirstPath, JSON.stringify(data));
fs.removeSync(allMinPath);

console.log('all.min.first.enc created, all.min.js removed.');
