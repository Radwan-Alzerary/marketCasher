const { minify } = require('terser');
const fs = require('fs-extra');
const path = require('path');
const cp = require('child_process');

async function build() {
  try {
    const productinDir = path.join(__dirname, '..', 'productin');
    const bundlePath = path.join(productinDir, 'bundle.js');

    if (!fs.existsSync(bundlePath)) {
      console.error('Error: bundle.js not found. Run `npm run bundle` first.');
      process.exit(1);
    }

    const originalCode = await fs.readFile(bundlePath, 'utf8');
    console.log(`Original bundle size: ${originalCode.length} bytes`);

    const { code, error } = await minify(originalCode, {
      compress: true,
      mangle: true
    });

    if (error) {
      console.error('Terser encountered an error:', error);
      process.exit(1);
    }

    const allMinPath = path.join(productinDir, 'all.min.js');
    await fs.writeFile(allMinPath, code, 'utf8');
    console.log('all.min.js created.');

    // Remove bundle.js now that we have all.min.js
    fs.removeSync(bundlePath);
    console.log('bundle.js removed.');

    // Copy public and views
    const publicSrc = path.join(__dirname, '..', 'public');
    const viewsSrc = path.join(__dirname, '..', 'views');

    const publicDest = path.join(productinDir, 'public');
    const viewsDest = path.join(productinDir, 'views');

    if (fs.existsSync(publicSrc)) {
      await fs.copy(publicSrc, publicDest);
      console.log('public directory copied.');
    }

    if (fs.existsSync(viewsSrc)) {
      await fs.copy(viewsSrc, viewsDest);
      console.log('views directory copied.');
    }

    // Copy package.json (and package-lock if present)
    const pkgSrc = path.join(__dirname, '..', 'package.json');
    const pkgDest = path.join(productinDir, 'package.json');
    await fs.copy(pkgSrc, pkgDest);
    console.log('package.json copied to productin.');

    const lockSrc = path.join(__dirname, '..', 'package-lock.json');
    if (fs.existsSync(lockSrc)) {
      const lockDest = path.join(productinDir, 'package-lock.json');
      await fs.copy(lockSrc, lockDest);
      console.log('package-lock.json copied to productin.');
    }

    // Install node_modules in productin
    console.log('Installing node modules in productin folder...');
    cp.execSync('npm install --production', { cwd: productinDir, stdio: 'inherit' });
    console.log('Node modules installed in productin folder.');

    // Copy run.js and loader.js to productin
    const runSrc = path.join(__dirname, '..', 'run.js');
    const runDest = path.join(productinDir, 'run.js');
    await fs.copy(runSrc, runDest);
    console.log('run.js copied to productin.');

    const loaderSrc = path.join(__dirname, 'loader.js');
    const loaderDest = path.join(productinDir, 'loader.js');
    await fs.copy(loaderSrc, loaderDest);
    console.log('loader.js copied to productin.');
  } catch (err) {
    console.error('Build error:', err);
    process.exit(1);
  }
}

build();
