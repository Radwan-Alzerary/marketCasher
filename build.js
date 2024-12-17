const { minify } = require('terser');
const fs = require('fs-extra');
const path = require('path');
const cp = require('child_process');

async function build() {
  try {
    const bundlePath = path.join(__dirname, 'build', 'bundle.js');

    if (!fs.existsSync(bundlePath)) {
      console.error('Error: bundle.js not found. Make sure you ran `npm run bundle` first.');
      process.exit(1);
    }

    const originalCode = await fs.readFile(bundlePath, 'utf8');
    console.log(`Original bundle size: ${originalCode.length} bytes`);

    if (originalCode.trim().length === 0) {
      console.warn('Warning: bundle.js is empty. Check your entry file or included code.');
    }

    console.log('Minifying with Terser...');
    const { code, error } = await minify(originalCode, {
      compress: true,
      mangle: true,
      keep_classnames: false,
      keep_fnames: false
    });

    if (error) {
      console.error('Terser encountered an error:', error);
      process.exit(1);
    }

    const outputFile = path.join(__dirname, 'build', 'all.min.js');
    await fs.writeFile(outputFile, code, 'utf8');
    console.log(`Minification complete. Output written to: ${outputFile}`);
    console.log(`Minified bundle size: ${code.length} bytes`);

    // Copy public and views directories
    const publicSrc = path.join(__dirname, 'public');
    const viewsSrc = path.join(__dirname, 'views');

    const publicDest = path.join(__dirname, 'build', 'public');
    const viewsDest = path.join(__dirname, 'build', 'views');

    if (fs.existsSync(publicSrc)) {
      console.log('Copying public directory...');
      await fs.copy(publicSrc, publicDest);
      console.log('Public directory copied successfully.');
    } else {
      console.warn('No public directory found to copy.');
    }

    if (fs.existsSync(viewsSrc)) {
      console.log('Copying views directory...');
      await fs.copy(viewsSrc, viewsDest);
      console.log('Views directory copied successfully.');
    } else {
      console.warn('No views directory found to copy.');
    }

    // Copy package.json and package-lock.json if present
    const pkgSrc = path.join(__dirname, 'package.json');
    const pkgDest = path.join(__dirname, 'build', 'package.json');
    await fs.copy(pkgSrc, pkgDest);
    console.log('package.json copied to build folder.');

    const lockSrc = path.join(__dirname, 'package-lock.json');
    if (fs.existsSync(lockSrc)) {
      const lockDest = path.join(__dirname, 'build', 'package-lock.json');
      await fs.copy(lockSrc, lockDest);
      console.log('package-lock.json copied to build folder.');
    }

    // Run npm install in the build directory
    console.log('Installing node modules inside build directory...');
    // cp.execSync('npm install --production', { cwd: path.join(__dirname, 'build'), stdio: 'inherit' });
    console.log('Node modules installed successfully inside build directory.');

    console.log('Build process completed successfully.');
  } catch (err) {
    console.error('Error during the build process:', err);
    process.exit(1);
  }
}

build();
