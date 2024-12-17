const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');
const vm = require('vm');
const axios = require('axios');

const productinDir = __dirname;
const encFirstPath = path.join(productinDir, 'all.min.first.enc');
const encPath = path.join(productinDir, 'all.min.enc');
const deviceKeyPath = path.join(productinDir, 'device.key');
const licenseKeyPath = path.join(productinDir, 'license.key');

// Check if we already have a deviceKey (offline mode)
let deviceKey = fs.existsSync(deviceKeyPath) ? fs.readFileSync(deviceKeyPath, 'utf8').trim() : null;

(async () => {
  if (deviceKey) {
    // Subsequent runs (offline)
    console.log('Offline run using deviceKey...');
    const keyMaterial = crypto.createHash('sha256').update(deviceKey).digest();
    const decData = JSON.parse(fs.readFileSync(encPath, 'utf8'));
    const ivBuffer = Buffer.from(decData.iv, 'hex');
    const encBuffer = Buffer.from(decData.content, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyMaterial, ivBuffer);
    const decrypted = Buffer.concat([decipher.update(encBuffer), decipher.final()]);
    const code = decrypted.toString('utf8');

    const sandbox = {
      console,
      require,
      process,
      __dirname: productinDir,
      __filename: path.join(productinDir, 'all.min.js'),
      Buffer,
      global,
      setInterval,
      setTimeout,
      clearInterval,
      clearTimeout
    };
    
    vm.runInNewContext(code, sandbox); // offline run scenario
    
    console.log('App started successfully (offline mode).');
    return;
  }

  // First run: Need LICENSE_KEY to decrypt all.min.first.enc
  let licenseKey = process.env.LICENSE_KEY;
  if (!licenseKey && fs.existsSync(licenseKeyPath)) {
    licenseKey = fs.readFileSync(licenseKeyPath, 'utf8').trim();
  }

  if (!licenseKey) {
    console.error('No LICENSE_KEY found for the first run. Provide LICENSE_KEY env or license.key file.');
    process.exit(1);
  }

  if (!fs.existsSync(encFirstPath)) {
    console.error('all.min.first.enc not found. Did you run `npm run build`?');
    process.exit(1);
  }

  console.log('Decrypting all.min.first.enc with LICENSE_KEY...');
  const firstKey = crypto.createHash('sha256').update(licenseKey).digest();
  const firstData = JSON.parse(fs.readFileSync(encFirstPath, 'utf8'));
  const firstIv = Buffer.from(firstData.iv, 'hex');
  const firstEncBuffer = Buffer.from(firstData.content, 'hex');
  try {
    const firstDecipher = crypto.createDecipheriv('aes-256-cbc', firstKey, firstIv);
    const firstDecrypted = Buffer.concat([firstDecipher.update(firstEncBuffer), firstDecipher.final()]);
    fs.writeFileSync(path.join(productinDir, 'all.min.js'), firstDecrypted);
    fs.removeSync(encFirstPath);
    console.log('all.min.js recovered from first encryption.');
  } catch (error) {
    console.error('Decryption failed: invalid LICENSE_KEY or corrupted file.');
    process.exit(1);
  }

  // Now contact the server with a token to get deviceKey
  // Assume user sets TOKEN via environment or token file
  const token = process.env.TOKEN || (fs.existsSync(path.join(productinDir, 'token.txt')) ? fs.readFileSync(path.join(productinDir, 'token.txt'), 'utf8').trim() : null);
  if (!token) {
    console.error('No token provided for online check. Provide TOKEN env or token.txt file.');
    process.exit(1);
  }

  console.log('Performing online check with token...');
  try {
    const response = await axios.post('http://95.179.178.183:4000/checkToken', { token });
    if (!response.data || !response.data.valid || !response.data.deviceKey) {
      console.error('Token validation failed or no deviceKey returned.');
      process.exit(1);
    }
    deviceKey = response.data.deviceKey;
    fs.writeFileSync(deviceKeyPath, deviceKey, 'utf8');
    console.log('Received and saved deviceKey. Future runs will be offline.');

    // Re-encrypt all.min.js with deviceKey
    const deviceKeyMaterial = crypto.createHash('sha256').update(deviceKey).digest();
    const allMinData = fs.readFileSync(path.join(productinDir, 'all.min.js'));
    const deviceIv = crypto.randomBytes(16);
    const deviceCipher = crypto.createCipheriv('aes-256-cbc', deviceKeyMaterial, deviceIv);
    const deviceEncrypted = Buffer.concat([deviceCipher.update(allMinData), deviceCipher.final()]);
    const deviceEncData = { iv: deviceIv.toString('hex'), content: deviceEncrypted.toString('hex') };
    fs.writeFileSync(encPath, JSON.stringify(deviceEncData));
    fs.removeSync(path.join(productinDir, 'all.min.js'));
    console.log('all.min.enc created with deviceKey. all.min.js removed.');

    // Now decrypt all.min.enc to run the app
    const decDeviceData = JSON.parse(fs.readFileSync(encPath, 'utf8'));
    const decIv = Buffer.from(decDeviceData.iv, 'hex');
    const decEncBuffer = Buffer.from(decDeviceData.content, 'hex');
    const decDecipher = crypto.createDecipheriv('aes-256-cbc', deviceKeyMaterial, decIv);
    const decDecrypted = Buffer.concat([decDecipher.update(decEncBuffer), decDecipher.final()]);
    const finalCode = decDecrypted.toString('utf8');

    const sandbox = {
      console,
      require,
      process,
      __dirname: productinDir,
      __filename: path.join(productinDir, 'all.min.js'),
      Buffer,
      global,
      // Add these timing functions from the current Node environment
      setInterval,
      setTimeout,
      clearInterval,
      clearTimeout
    };
    
    vm.runInNewContext(finalCode, sandbox); // first run scenario
        console.log('App started successfully (first run with server).');
  } catch (err) {
    console.error('Error during online validation or encryption:', err.message);
    process.exit(1);
  }
})();
