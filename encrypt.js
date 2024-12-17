const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');

const buildDir = path.join(__dirname, 'build');
const allMinPath = path.join(buildDir, 'all.min.js');
const encPath = path.join(buildDir, 'all.min.enc');

// Replace this with your actual license key or just leave it as an environment variable check later.
const licenseKey = process.env.LICENSE_KEY || "DEMO_LICENSE_KEY";

// Simple key derivation from license key (not secure, just an example)
const key = crypto.createHash('sha256').update(licenseKey).digest();
const iv = crypto.randomBytes(16);

// Encrypt using AES-256-CBC
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
  console.error(`Error: ${allMinPath} not found. Make sure you ran npm run build first.`);
  process.exit(1);
}

console.log('Encrypting all.min.js...');
encrypt(allMinPath, encPath, key, iv);
fs.removeSync(allMinPath); // Remove the original unencrypted file
console.log(`Encrypted code written to ${encPath} and all.min.js removed.`);
