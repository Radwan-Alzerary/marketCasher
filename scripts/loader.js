const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');
const vm = require('vm');

const productinDir = __dirname;
const runEncPath = path.join(productinDir, 'run.js.first.enc');
const licenseKeyPath = path.join(productinDir, 'license.key');

// Get LICENSE_KEY from env or file
let licenseKey = process.env.LICENSE_KEY;
if (!licenseKey && fs.existsSync(licenseKeyPath)) {
  licenseKey = fs.readFileSync(licenseKeyPath, 'utf8').trim();
}

if (!licenseKey) {
  console.error('No LICENSE_KEY provided. Set LICENSE_KEY env or create license.key file.');
  process.exit(1);
}

if (!fs.existsSync(runEncPath)) {
  console.error('run.js.first.enc not found.');
  process.exit(1);
}

// Decrypt run.js.first.enc
try {
  const key = crypto.createHash('sha256').update(licenseKey).digest();
  const encData = JSON.parse(fs.readFileSync(runEncPath, 'utf8'));
  const iv = Buffer.from(encData.iv, 'hex');
  const encBuffer = Buffer.from(encData.content, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(encBuffer), decipher.final()]);
  const runCode = decrypted.toString('utf8');

  // Provide a sandbox with necessary globals
  const sandbox = {
    console,
    require,
    process,
    __dirname: productinDir,
    __filename: path.join(productinDir, 'run.js'),
    Buffer,
    global,
    setInterval,
    setTimeout,
    clearInterval,
    clearTimeout
  };

  vm.runInNewContext(runCode, sandbox);
} catch (error) {
  console.error('Failed to decrypt run.js.first.enc. Invalid LICENSE_KEY or corrupted file:', error.message);
  process.exit(1);
}
