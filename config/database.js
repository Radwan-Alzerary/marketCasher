const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

/**
 * -------------- DATABASE ----------------
 */


const keyFilePath = path.join(__dirname, 'computer-id.key');

// Function to get or create the computerId
function getComputerId() {
    if (fs.existsSync(keyFilePath)) {
        // Read the computerId from the file
        const computerId = fs.readFileSync(keyFilePath, 'utf8').trim();
        if (computerId) {
            console.log(`Loaded computerId from file: ${computerId}`);
            return computerId;
        }
    }

    // Generate a new computerId if the file doesn't exist or is empty
    const newComputerId = uuidv4();
    fs.writeFileSync(keyFilePath, newComputerId, 'utf8');
    console.log(`Generated new computerId and saved to file: ${newComputerId}`);
    return newComputerId;
}
// Retrieve the computerId
const computerId = getComputerId();
console.log(`Computer ID: ${computerId}`);


// Check if the system is in offline mode
const isOffline = process.env.DB_MODE === 'offline';

// Models to sync
const modelsToSync = [
    { name: 'Food', model: require('../models/food') },
    { name: 'Category', model: require('../models/category') },
    { name: 'Customer', model: require('../models/costemer') },
    { name: 'CounterSchema', model: require('../models/CounterSchema') },
    { name: 'Delevery', model: require('../models/delevery') },
    { name: 'Devices', model: require('../models/devices') },
    { name: 'Discount', model: require('../models/discount') },
    { name: 'Invoice', model: require('../models/invoice') },
    { name: 'Setting', model: require('../models/pagesetting') },
    { name: 'PaymentType', model: require('../models/paymentType') },
    { name: 'PurchasesInvoice', model: require('../models/purchasesInvoice') },
    { name: 'Storge', model: require('../models/storge') },
    { name: 'Supplier', model: require('../models/Supplier') },
    { name: 'SystemSetting', model: require('../models/systemSetting') },
    { name: 'table', model: require('../models/table') },
    { name: 'user', model: require('../models/user') },
];

// Function to check and update models
async function ensureComputerId() {
    if (!isOffline) {
        console.log('System is not in offline mode. Skipping computerId check.');
        return;
    }

    console.log('Checking for missing computerId in offline mode...');

    for (const { name, model } of modelsToSync) {
        try {
            // Find documents without computerId
            const documentsWithoutComputerId = await model.find({ computerId: { $exists: false } });

            if (documentsWithoutComputerId.length > 0) {
                console.log(`Found ${documentsWithoutComputerId.length} documents without computerId in ${name}. Updating...`);

                // Update each document with the local computerId
                await model.updateMany(
                    { computerId: { $exists: false } },
                    { $set: { computerId } }
                );

                console.log(`Updated missing computerId in ${name}`);
            } else {
                console.log(`All documents in ${name} already have a computerId.`);
            }
        } catch (error) {
            console.error(`Error checking or updating ${name}:`, error);
        }
    }

    console.log('ComputerId check and update completed.');
}

// Connect to the database
mongoose
    .connect(process.env.DB_STRING_OFFLINE, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(async () => {
        console.log('Database connected.');
        await ensureComputerId(); // Run the check on server startup
    })
    .catch((error) => {
        console.error('Database connection error:', error);
    });

mongoose.connection.on('disconnected', () => {
    console.log('Database connection lost.');
});

mongoose.connection.on('error', (error) => {
    console.error('Database error:', error);
});
