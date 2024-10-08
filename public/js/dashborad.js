function getMonthNamesLastMonths(datestart, monthnum) {
    const today = new Date(datestart);
    const monthNames = [];
    for (let i = monthnum; i > 0; i--) {
        const month = new Date(today);
        month.setMonth(today.getMonth() - i);
        const monthNum = month.getMonth() + 1;
        const monthName = getMonthName(monthNum);
        monthNames.push(monthName);
    }
    return monthNames;
}

function getMonthName(monthNum) {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    return months[monthNum]; // Subtracting 1 to convert month number to zero-based index
}


function getDayName(dayNum) {
    const days = ['احد', 'اثنين', 'ثلاثاء', 'اربعاء', 'خميس', 'جمعة', 'سبت'];
    return days[dayNum];
}


function getDayNamesLastDays(startfrom,daynum) {
    const today = new Date(startfrom);
    const dayNames = [];

    for (let i = daynum; i > 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        const dayNum = day.getDay();
        const dayName = getDayName(dayNum);
        dayNames.push(dayName);
    }
    return dayNames;
}

function generateDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return dates;
}

// Function to generate an array of months between two dates (inclusive)
function generateMonthRange(startDate, endDate) {
    const months = [];
    let currentDate = new Date(startDate);
    currentDate.setUTCDate(1); // Set the date to the first day of the month
    while (currentDate <= endDate) {
        months.push(new Date(currentDate));
        currentDate.setUTCMonth(currentDate.getUTCMonth() + 1); // Move to the next month
    }
    return months;
}

function getDailyDataForDate(date, data) {
    const result = { invoiceCount: 0, foodCount: 0, foodCost: 0, sellprice: 0, profit: 0 };
    for (const year of data.year) {

        // Iterate through the months in the year
        for (const month of year.month) {
            // Check if the month is within the date range
            const monthDate = new Date(Date.UTC(year.yearnum, month.monthnum - 1)); // Use UTC method
            if (monthDate.getUTCFullYear() === date.getUTCFullYear() && monthDate.getUTCMonth() === date.getUTCMonth()) {
                // Iterate through the days in the month
                for (const day of month.day) {
                    // Check if the day is within the date range
                    if (day.daynum === date.getUTCDate()) { // Use UTC method
                        result.invoiceCount = day.invoiceCount || 0;
                        result.foodCount = day.foodCount || 0;
                        result.foodCost = day.foodcost || 0;
                        result.sellprice = day.sellprice || 0;
                        result.profit = day.profit || 0;
                        return result;
                    }
                }
            }
        }
    }

    return result;
}

// Function to get aggregated monthly data for a specific month
function getMonthlyDataForMonth(month, data) {
    const nextMonth = new Date(month);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1); // Set to the first day of the next month
    nextMonth.setUTCDate(nextMonth.getUTCDate() - 1); // Set to the last day of the current month
    const monthData = {
        startDate: month.toISOString().slice(0, 10), // Format date as "YYYY-MM-DD"
        endDate: nextMonth.toISOString().slice(0, 10), // Format date as "YYYY-MM-DD"
        ...getDailyDataForDate(month, data), // Get data for the first day of the month
    };

    // Calculate totals for the month
    monthData.totalInvoiceCount = 0;
    monthData.totalFoodCount = 0;
    monthData.totalFoodCost = 0;
    monthData.totalSellprice = 0;
    monthData.totalProfit = 0;

    for (let date = new Date(month); date <= nextMonth; date.setUTCDate(date.getUTCDate() + 1)) {
        const dataForDate = getDailyDataForDate(date, data);
        monthData.totalInvoiceCount += dataForDate.invoiceCount;
        monthData.totalFoodCount += dataForDate.foodCount;
        monthData.totalFoodCost += dataForDate.foodCost;
        monthData.totalSellprice += dataForDate.sellprice;
        monthData.totalProfit += dataForDate.profit;
    }

    return monthData;
}

function calculateDaysDifference(startDate, endDate) {
    const oneDay = 24 * 60 * 60 * 1000; // عدد الميلي ثانية في يوم واحد
  
    const startDateObj = new Date(startDate); // تحويل تاريخ البداية إلى كائن تاريخ
    const endDateObj = new Date(endDate); // تحويل تاريخ النهاية إلى كائن تاريخ
  
    // حساب فرق الوقت بين تاريخي البداية والنهاية بالأيام
    const diffDays = Math.round((endDateObj - startDateObj) / oneDay);
  
    return diffDays;
  }
  