// syncService.js

const axios = require('axios');
const Food = require('./models/food');
const Category = require('./models/category');
const Customer = require('./models/costemer');
const CounterSchema = require('./models/CounterSchema');
const Delevery = require('./models/delevery');
const Devices = require('./models/devices');
const Discount = require('./models/discount');
const Invoice = require('./models/invoice');
const PageSetting = require('./models/pagesetting');
const PaymentType = require('./models/paymentType');
const PurchasesInvoice = require('./models/purchasesInvoice');
const Storge = require('./models/storge');
const Supplier = require('./models/Supplier');
const SystemSetting = require('./models/systemSetting');
const Table = require('./models/table');
const User = require('./models/user');

// ... Import other models as needed ...

// List of models to sync
const modelsToSync = [
    { name: 'Food', model: Food },
    { name: 'Category', model: Category },
    { name: 'Customer', model: Customer },
    { name: 'CounterSchema', model: CounterSchema },
    { name: 'Delevery', model: Delevery },
    { name: 'Devices', model: Devices },
    { name: 'Discount', model: Discount },
    { name: 'Invoice', model: Invoice },
    { name: 'PageSetting', model: PageSetting },
    { name: 'PaymentType', model: PaymentType },
    { name: 'PurchasesInvoice', model: PurchasesInvoice },
    { name: 'Storge', model: Storge },
    { name: 'Supplier', model: Supplier },
    { name: 'SystemSetting', model: SystemSetting },
    { name: 'table', model: Table },
    { name: 'user', model: User },
];

async function syncUnsyncedData() {
    const systemSetting = await SystemSetting.findOne()
    for (const { name, model } of modelsToSync) {
        try {
            const unsyncedDocuments = await model.find({
                $or: [
                    { 'onlineSync.isOnlineSync': false }, // Check if isOnlineSync is false
                    { 'onlineSync': { $exists: false } }  // Check if onlineSync field does not exist
                ]
            });
            // console.log(`Found ${unsyncedDocuments.length} unsynced ${name} documents`);

            for (const doc of unsyncedDocuments) {
                try {
                    const response = await axios.post(
                        'http://localhost:3001/api/sync',
                        {
                            model: name,
                            data: doc,
                            systemId:systemSetting.specialId
                        }
                    );
                    if (response.status === 200) {
                        // Update isOnlineSync to true
                        // doc.onlineSync.isOnlineSync = false;
                        await doc.save();
                    }
                } catch (error) {
                    // console.error(`Failed to sync ${name} ${doc._id}:`, error.message);
                }
            }
        } catch (error) {
            console.error(`Error fetching unsynced ${name} documents:`, error.message);
        }
    }
}

module.exports = syncUnsyncedData;
