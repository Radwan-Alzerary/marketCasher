const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require("node-thermal-printer");
const Devices = require("../models/devices"); // Assuming the Devices model is in the models folder
const Setting = require("../models/pagesetting");
const Category = require("../models/category");

// Removed the sleep function

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
    console.log("printCount", printCount);
    // Execute the print command multiple times based on printCount
    for (let i = 0; i < printCount; i++) {
      // Build up the print data inside the loop
      printer.alignCenter();
      console.log("Printing copy number:", i + 1);
      if (printRole === "كاشير" || printRole === "توصيل") {
        await printer.printImage(`./public${shopLogo}`); // Print PNG image
        await printer.raw(Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]));
      }
      await printer.printImage(imagePath);
      await printer.cut();

      // Now execute the print job
      await printer.execute();
    }

    console.log("Image printed successfully.");
  } catch (error) {
    console.error("Error printing image:", error);
    throw error; // Re-throw the error to be caught in the calling function
  }
}

async function printForRole(imagePath, role, type) {
  const setting = await Setting.findOne();

  if (type === "category") {
    console.log("printAsCategory");
    console.log(role);
    const device = await Devices.findById(role);
    if (!device) {
      console.log(`Device with ID ${role} not found.`);
      return;
    }
    console.log(`Printing for device: ${device.name} (${device.ip})`);

    try {
      await printImageAsync(
        imagePath,
        device.numberOfPrint,
        device.ip,
        device.type,
        setting.shoplogo,
        role
      );
      console.log(`Printing completed for device: ${device.name}`);
    } catch (error) {
      console.error(`Error printing to device ${device.name}:`, error);
    }
  } else {
    // Fetch devices with the given role
    const devices = await Devices.find({ role, status: "Active" });

    if (!devices.length) {
      console.log(`No active devices found for role: ${role}`);
      return;
    }

    // Prepare promises for main role devices
    const mainRolePromises = devices.map(async (device) => {
      console.log(`Printing for device: ${device.name} (${device.ip})`);
      try {
        await printImageAsync(
          imagePath,
          device.numberOfPrint,
          device.ip,
          device.type,
          setting.shoplogo,
          role
        );
        console.log(`Printing completed for device: ${device.name}`);
      } catch (error) {
        console.error(`Error printing to device ${device.name}:`, error);
      }
    });

    // Execute all main role print jobs in parallel
    await Promise.all(mainRolePromises);

    // Now handle secondary roles
    const secondaryRolePromises = [];
    for (const device of devices) {
      const secondaryRole = device.secenderyRole[0]; // Assuming the secondary role is a single value
      if (secondaryRole) {
        console.log(
          `Checking secondary role for device: ${device.name} - Secondary Role: ${secondaryRole}`
        );

        // Fetch devices that have the main role equal to the secondary role
        const secondaryDevices = await Devices.find({
          role: secondaryRole,
          status: "Active",
        });

        if (secondaryDevices.length) {
          for (const secondaryDevice of secondaryDevices) {
            console.log(
              `Printing for secondary device: ${secondaryDevice.name} (${secondaryDevice.ip})`
            );

            // Add to the list of promises
            secondaryRolePromises.push(
              (async () => {
                try {
                  await printImageAsync(
                    imagePath,
                    secondaryDevice.numberOfPrint,
                    secondaryDevice.ip,
                    secondaryDevice.type,
                    setting.shoplogo,
                    role
                  );
                  console.log(
                    `Printing completed for secondary device: ${secondaryDevice.name}`
                  );
                } catch (error) {
                  console.error(
                    `Error printing to secondary device ${secondaryDevice.name}:`,
                    error
                  );
                }
              })()
            );
          }
        } else {
          console.log(`No active devices found for secondary role: ${secondaryRole}`);
        }
      }
    }

    // Execute all secondary role print jobs in parallel
    await Promise.all(secondaryRolePromises);
  }

  console.log("All print jobs for main and secondary roles completed.");
}

module.exports = {
  printForRole,
};
 