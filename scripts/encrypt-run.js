const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');

const productinDir = path.join(__dirname, '..', 'productin');
const runPath = path.join(productinDir, 'run.js');
const runEncPath = path.join(productinDir, 'run.js.first.enc');

const staticKey = "STATIC_BUILD_KEY";
const key = crypto.createHash('sha256').update(staticKey).digest();
const iv = crypto.randomBytes(16);

if (!fs.existsSync(runPath)) {
  console.error('run.js not found.');
  process.exit(1);
}

console.log('Encrypting run.js with static key...');
const inputData = fs.readFileSync(runPath);
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const encrypted = Buffer.concat([cipher.update(inputData), cipher.final()]);
const data = { iv: iv.toString('hex'), content: encrypted.toString('hex') };
fs.writeFileSync(runEncPath, JSON.stringify(data));
fs.removeSync(runPath);

console.log('run.js.first.enc created, run.js removed.');
