const router = require("express").Router();

const Invoice = require("../models/invoice");
const SystemSetting = require("../models/systemSetting");
const User = require("../models/user");



// Helper function to group data by view type
function groupDataByViewType(data, viewType) {
    const groupedData = {};

    data.forEach(invoice => {
        let key;
        switch (viewType) {
            case 'year':
                key = invoice.progressdata.getFullYear().toString();
                break;
            case 'month':
                key = `${invoice.progressdata.getFullYear()}-${(invoice.progressdata.getMonth() + 1).toString().padStart(2, '0')}`;
                break;
            default:
                key = invoice.progressdata.toISOString().split('T')[0];
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
        const { startDate, endDate, viewType = 'day' } = req.query;
        let query = {
            deleted: false, type: { $in: ["مكتمل", "توصيل"] }
        };

        if (startDate && endDate) {
            query.progressdata = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const invoices = await Invoice.find(query).sort('-progressdata',);
        const groupedData = groupDataByViewType(invoices, viewType);

        const allDates = await Invoice.distinct('progressdata', { deleted: false });

        const user = await User.findById(req.user);
        const systemSetting = await SystemSetting.findOne();


        res.render('report', {
            invoiceData: groupedData,
            allDates: allDates.map(date => date.toISOString().split('T')[0]),
            currentViewType: viewType,
            currentStartDate: startDate || '',
            currentEndDate: endDate || '',
            role: user.role, systemSetting
        });
    } catch (error) {
        console.error('Error fetching invoice data:', error);
        res.status(500).send('Error fetching invoice data');
    }
});
module.exports = router;
