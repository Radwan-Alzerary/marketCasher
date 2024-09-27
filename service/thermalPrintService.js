const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require("node-thermal-printer");
const Devices = require("../models/devices"); // Assuming the Devices model is in the models folder
const Setting = require("../models/pagesetting");

// Sleep function to pause execution for a specified time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Launch the browser once globally to reuse it across all prints

async function printImageAsync(imagePath, printCount, printerIp, printerType, shopLogo) {
  let printer;

  // Configure printer settings based on printer type
  if (printerType === "Thermal Printer") {
    printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${printerIp}:9100`,
      characterSet: CharacterSet.SLOVENIA,
      removeSpecialCharacters: false,
      lineCharacter: "=",
      breakLine: BreakLine.WORD,
      options: {
        timeout: 2000,
      },
    });
  } else {
    // Implement logic for A4 Printer if needed
    console.log("A4 Printer logic not implemented");
    return;
  }

  try {
    // Print logo and receipt image
    printer.alignCenter();
    // await printer.printImage(shopLogo);
    console.log(shopLogo)
    await printer.printImage(imagePath);
    await printer.cut();

    // Execute the print command multiple times based on printCount
    for (let i = 0; i < printCount; i++) {
      await printer.execute();
    }

    console.log("Image printed successfully.");
  } catch (error) {
    console.error("Error printing image:", error);
  }
}

// The main service function to loop through devices by role and print
async function printForRole(imagePath, role) {
  const devices = await Devices.find({ role, status: "Active" });

  if (!devices.length) {
    console.log(`No active devices found for role: ${role}`);
    return;
  }

  const setting = await Setting.findOne();

  for (const device of devices) {
    console.log(`Printing for device: ${device.name} (${device.ip})`);
    
    // Wait for the current device to finish printing before moving to the next
    await printImageAsync(imagePath, device.numberOfPrint, device.ip, device.type, setting.shoplogo);
    console.log(`Printing completed for device: ${device.name}`);

    // Add a 500ms delay between each printer
    await sleep(500);
  }

  console.log("All print jobs for role completed.");
}

module.exports = {
  printForRole,
};
