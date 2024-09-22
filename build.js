const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs-extra');
const path = require('path');

// Directory to search for JavaScript files
const inputDir = path.join(__dirname, './'); // The folder containing your JS files
const outputDir = path.join(__dirname, 'build'); // The folder where obfuscated files will go

// Directories to exclude (add more directories if needed)
const excludedDirs = ['node_modules', 'build']; // Add any directories you want to exclude

// Function to check if a directory is in the excluded list
const isExcluded = (filePath) => {
  return excludedDirs.some(dir => filePath.includes(path.join(__dirname, dir)));
};

// Function to obfuscate a single file
const obfuscateFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(fileContent, {
      compact: true,
      // controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75, // Increase complexity
      deadCodeInjection: true, // Add dead code
      deadCodeInjectionThreshold: 0.4, // Adjust percentage of dead code
      stringArray: true, // Enable string array encoding
      stringArrayThreshold: 0.8, // Set threshold for string array
      stringArrayEncoding: ['base64', 'rc4'], // Use both Base64 and RC4 encoding for strings
      stringArrayRotate: true, // Rotate string array
      stringArrayShuffle: true, // Shuffle string array
      selfDefending: true, // Add self-defending code
      debugProtection: true, // Add debug protection
      debugProtectionInterval: 2000, // Set interval for debug protection (in milliseconds)
      disableConsoleOutput: true, // Disable console.log output
      

      // stringArray: true, // Encode strings in an array
      // stringArrayThreshold: 1, // Apply to all strings
      // stringArrayRotate: true, // Rotate the string array
      // stringArrayShuffle: true, // Shuffle string array order
      // selfDefending: true, // Add self-defending features
      // debugProtection: true, // Prevent debugging in the console
      // debugProtectionInterval: 1000, // Continuously block debugging attempts
      // disableConsoleOutput: true, // Remove all console output
      // transformObjectKeys: true, // Rename object keys to obscure property names
      // numbersToExpressions: true, // Obfuscate numbers as complex expressions
      // renameGlobals: true, // Rename global variables
      // splitStrings: true, // Split strings into chunks
      // splitStringsChunkLength: 5, // Chunk length for string splitting
      // simplify: true, // Simplify the code further
      // sourceMap: false, // Do not generate source maps
      // sourceMapMode: 'separate', // Source map is not bundled with the code
      // renameProperties: true, // Rename object properties to make reverse engineering harder
      // identifierNamesGenerator: 'hexadecimal', // Change names of variables to hexadecimal
      // reservedNames: [], // Reserved names that should not be renamed (add any sensitive names here)

    }).getObfuscatedCode();

    const relativePath = path.relative(inputDir, filePath);
    const outputPath = path.join(outputDir, relativePath);

    // Ensure the directory exists before writing the file
    fs.ensureDirSync(path.dirname(outputPath));

    // Write the obfuscated code to the output folder
    fs.writeFileSync(outputPath, obfuscatedCode);
    console.log(`Obfuscated: ${filePath}`);
  } catch (error) {
    console.error(`Error obfuscating file ${filePath}:`, error);
  }
};

// Function to recursively find .js files and obfuscate them, excluding specified directories
const findAndObfuscateJsFiles = (dir) => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(dir, file);

      // Check if the file is a directory or a file
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error stating file ${filePath}:`, err);
          return;
        }

        // Skip excluded directories (e.g., node_modules and dist)
        if (stats.isDirectory() && !isExcluded(filePath)) {
          // If it's a directory and not excluded, recursively search it
          findAndObfuscateJsFiles(filePath);
        } else if (stats.isFile() && file.endsWith('.js') && !isExcluded(filePath)) {
          // If it's a .js file and not excluded, obfuscate it
          obfuscateFile(filePath);
        }
      });
    });
  });
};

// Start the obfuscation process
console.log('Starting obfuscation process, excluding node_modules and dist...');
findAndObfuscateJsFiles(inputDir);
