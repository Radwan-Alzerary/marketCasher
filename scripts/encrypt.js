const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');

const productinDir = path.join(__dirname, '..', 'productin');
const allMinPath = path.join(productinDir, 'all.min.js');
const encPath = path.join(productinDir, 'all.min.enc');

// Use a license key (for the first run)
// For the example, just use DEMO_LICENSE_KEY if LICENSE_KEY not set.
const licenseKey = process.env.LICENSE_KEY || "DEMO_LICENSE_KEY";

const key = crypto.createHash('sha256').update(licenseKey).digest();
const iv = crypto.randomBytes(16);

function encrypt(input, output, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const inputData = fs.readFileSync(input);
  const encrypted = Buffer.concat([cipher.update(inputData), cipher.final()]);
  const data = {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  };
  fs.writeFileSync(output, JSON.stringify(data));
}

if (!fs.existsSync(allMinPath)) {
  console.error('all.min.js not found. Run `npm run build` first.');
  process.exit(1);
}

console.log('Encrypting all.min.js...');
encrypt(allMinPath, encPath, key, iv);
fs.removeSync(allMinPath);
console.log('Encryption complete. all.min.enc created, all.min.js removed.');

// Copy run.js into productin directory
const runSrc = path.join(__dirname, 'run.js');
const runDest = path.join(productinDir, 'run.js');
fs.copyFileSync(runSrc, runDest);
console.log('run.js copied into productin directory.');
