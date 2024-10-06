const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require("node-thermal-printer");
const Devices = require("../models/devices"); // Assuming the Devices model is in the models folder
const Setting = require("../models/pagesetting");
const Category = require("../models/category");

// Sleep function to pause execution for a specified time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Launch the browser once globally to reuse it across all prints

async function printImageAsync(imagePath, printCount, printerIp, printerType, shopLogo, printRole) {
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
    if (printRole === "كاشير" || printRole === "توصيل") {
      await printer.printImage(`./public${shopLogo}`); // Print PNG image
      await printer.raw(Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]));
    }
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
async function printForRole(imagePath, role, type) {
  if (type === "category") {
    console.log("printAsCategory")
    console.log(role)
    const devices = await Devices.findById(role);
    console.log("device", role)
      console.log(`Printing for device: ${devices.name} (${devices.ip})`);
      const setting = await Setting.findOne();

      // Wait for the current device to finish printing before moving to the next
      await printImageAsync(imagePath, devices.numberOfPrint, devices.ip, devices.type, setting.shoplogo, role);
      console.log(`Printing completed for device: ${devices.name}`);
      await sleep(500);

  } else {
    // Fetch devices with the given role
    const devices = await Devices.find({ role, status: "Active" });
    console.log(devices);
    console.log(devices.length);

    if (!devices.length) {
      console.log(`No active devices found for role: ${role}`);
      return;
    }

    const setting = await Setting.findOne();

    // Loop through devices with the main role
    for (const device of devices) {
      console.log(`Printing for device: ${device.name} (${device.ip})`);

      // Wait for the current device to finish printing before moving to the next
      await printImageAsync(imagePath, device.numberOfPrint, device.ip, device.type, setting.shoplogo, role);
      console.log(`Printing completed for device: ${device.name}`);

      // Add a 500ms delay between each printer
      await sleep(500);
    }

    // Now check for secondary roles after all devices with the main role have been printed
    for (const device of devices) {
      const secondaryRole = device.secenderyRole[0]; // Assuming the secondary role is a single value
      if (secondaryRole) {
        console.log(`Checking secondary role for device: ${device.name} - Secondary Role: ${secondaryRole}`);

        // Fetch devices that have the main role equal to the secondary role
        const secondaryDevices = await Devices.find({ role: secondaryRole, status: "Active" });

        if (secondaryDevices.length) {
          for (const secondaryDevice of secondaryDevices) {
            console.log(`Printing for secondary device: ${secondaryDevice.name} (${secondaryDevice.ip})`);

            // Print for secondary devices
            await printImageAsync(imagePath, secondaryDevice.numberOfPrint, secondaryDevice.ip, secondaryDevice.type, setting.shoplogo, role);
            console.log(`Printing completed for secondary device: ${secondaryDevice.name}`);

            // Add a 500ms delay between each printer
            await sleep(500);
          }
        } else {
          console.log(`No active devices found for secondary role: ${secondaryRole}`);
        }
      }
    }


  }

  console.log("All print jobs for main and secondary roles completed.");
}

module.exports = {
  printForRole,
};
