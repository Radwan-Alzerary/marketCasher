const router = require("express").Router();

const Invoice = require("../models/invoice");
const SystemSetting = require("../models/systemSetting");
const User = require("../models/user");
const Setting = require("../models/pagesetting");

function groupDataByViewType(data, viewType,offset = 0) {
    const groupedData = {};

    data.forEach(invoice => {
        let key;
        // Create a new Date instance for progressdata
        const progressDate = new Date(invoice.progressdata);
        // Subtract 2 hours
        progressDate.setHours(progressDate.getHours() - offset);

        switch (viewType) {
            case 'year':
                key = progressDate.getFullYear().toString();
                break;
            case 'month':
                key = `${progressDate.getFullYear()}-${(progressDate.getMonth() + 1).toString().padStart(2, '0')}`;
                break;
            default:
                key = progressDate.toISOString().split('T')[0];
        }

        if (!groupedData[key]) {
            groupedData[key] = {
                date: key,
                invoices: [],
                totalPrice: 0,
                totalCost: 0,
                totalProfit: 0,
                count: 0
            };
        }

        groupedData[key].invoices.push({
            number: invoice.number,
            price: Number(invoice.fullcost),
            cost: Number(invoice.foodcost),
            progressdata: Number(invoice.progressdata)
        });

        groupedData[key].totalPrice += Number(invoice.fullcost) || 0;
        groupedData[key].totalCost += Number(invoice.foodcost) || 0;
        groupedData[key].totalProfit += (Number(invoice.fullcost) - Number(invoice.foodcost)) || 0;
        groupedData[key].count += 1;
    });

    return Object.values(groupedData);
}


router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, viewType = 'day', type } = req.query;

        // Base query: deleted false and filter for the type(s)
        let query = {
            deleted: false
        };

        // If a specific type is provided, update the query
        if (type) {
            query.type = type;  // Use the provided type ("توصيل" or "مكتمل")
        } else {
            query.type = { $in: ["مكتمل", "توصيل"] };  // Default to both types
        }

        // Filter by date range if provided
        if (startDate && endDate) {
            query.progressdata = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Fetch invoices
        const invoices = await Invoice.find(query).sort('-progressdata');
        const setting = await Setting.findOne()

        const groupedData = groupDataByViewType(invoices, viewType, setting.closedTimeOffset);

        // Get all distinct progress dates
        const allDates = await Invoice.distinct('progressdata', { deleted: false });

        // Get user and system setting data
        const user = await User.findById(req.user);
        const systemSetting = await SystemSetting.findOne();

        // Render the report view, passing current type and other data
        res.render('report', {
            invoiceData: groupedData,
            allDates: allDates.map(date => date.toISOString().split('T')[0]),
            currentViewType: viewType,
            currentType: type || '',  // Pass the selected type
            currentStartDate: startDate || '',
            currentEndDate: endDate || '',
            role: user.role,
            systemSetting
        });
    } catch (error) {
        console.error('Error fetching invoice data:', error);
        res.status(500).send('Error fetching invoice data');
    }
});

module.exports = router;
