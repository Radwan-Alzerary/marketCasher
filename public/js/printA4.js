function printA4invoice(invoiceId,
    resivename,
    loction,
    phonenumber,
    ReceivedAmount,
    RemainingAmount,
    printingcount,
    Comments,
    deleveryCost,
    type) {
    // Invoice HTML content
    const invoiceData = {
        invoiceNumber: '1000-15088',
        issueDate: '12/06/2023',
        customer: {
            name: 'اسم العميل',
            streetAddress: 'عنوان الشارع',
            phoneNumber: 'رقم الهاتف'
        },
        items: [
            {
                description: 'تنظيف الستائر',
                unitCost: '60,000 د.ع',
                quantity: 3,
                total: '180,000 د.ع'
            },
            {
                description: 'تنظيف السجاد',
                unitCost: '40,000 د.ع',
                quantity: 2,
                total: '80,000 د.ع'
            }
        ],
        subTotal: '1,342,500 د.ع',
        discount: '-75,000 د.ع',
        grandTotal: '1,394,250 د.ع'
    };

    async function getSetting() {
        try {
            const response = await fetch(`/setting/getsetting`);
            const setting = await response.json();
            return setting;  // Return the setting data from the function
        } catch (error) {
            console.error(error);
            return null; // Return a default value in case of an error
        }
    }

    fetch(`/invoice/${invoiceId}/checout`)
        .then((response) => response.json())
        .then(async (data) => {

            const settingVal = await getSetting()
            console.log(await getSetting())
            const isoDate = data.invoicedate;
            const date = new Date(isoDate);

            // Format the date to a human-readable format with 12-hour AM/PM system
            const options = {
                year: "numeric",
                month: "2-digit",  // Ensures the month is always two digits
                day: "2-digit"     // Ensures the day is always two digits
            };
            
            const formattedDate = date.toLocaleDateString("en-CA", options); // "en-CA" gives the format YYYY/MM/DD


            const invoiceHTML = (invoiceData) => {
                const itemsHTML = data.food.map(food => `
                <tr>
                    <td class="description">${food.id.name}</td>
                    <td>${food.foodPrice ? food.foodPrice : food.id.price}</td>
                    <td>${food.quantity} ${food.id.unit}</td>
                    <td>${Number(food.quantity) * Number(food.foodPrice ? food.foodPrice : food.id.price)}</td>
                </tr>
            `).join('');

            return `
            <div class="invoice-container">
                <!-- Header -->
                <div class="header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <img src="${settingVal.shoplogo}" alt="شعار الشركة" style="width: 150px; height: auto;">
                    </div>
                    <div class="invoice-title" style="flex-grow: 1; text-align: center;">فاتورة مبيعات</div>
                    <div class="invoice-info" style="text-align: right;">
                        <p>رقم الفاتورة: ${data.invoicenumber}</p>
                        <p>تاريخ الإصدار: ${formattedDate}</p>
                    </div>
                </div>
        
                <!-- Invoice Details -->
                <div class="invoice-details">
                    <div class="bill-to">
                        <h3 class="blue-text">إلى العميل:</h3>
                        <p>${resivename}<br>
                        <div style="display: flex;">
                            <div>عنوان العميل:</div>
                            <div>${loction}</div>
                        </div>
        
                        <div style="display: flex;">
                            <div>رقم الهاتف:</div>
                            <div>${phonenumber}</div>
                        </div>
                        <br>
                    </div>
                </div>
        
                <!-- Table -->
                <table>
                    <thead>
                        <tr>
                            <th>الوصف</th>
                            <th>تكلفة الوحدة</th>
                            <th>الكمية ${settingVal.amountUnit}</th>
                            <th>المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
        
                <!-- Summary -->
                <div class="summary">
                    <table>
                        <tr>
                            <td class="label">المجموع:</td>
                            <td>${data.fullcost}</td>
                        </tr>
                        <tr>
                            <td class="label">الخصم:</td>
                            <td>${data.fulldiscont}</td>
                        </tr>
                        <tr>
                            <td class="label grand-total">المجموع الكلي:</td>
                            <td class="grand-total">${data.finalcost}</td>
                        </tr>
                    </table>
                </div>
        
                <!-- Footer Text -->
                <div class="footer-text" style="display: flex; width: 100%;">
                    <p style="width: 33%;">${settingVal.adress}</p>
                    <p style="width: 33%;">${settingVal.invoicefooter}</p>
                    <p style="width: 33%;">${settingVal.phonnumber}</p>
                </div>
            </div>
        `;
                    };

            const printWindow = window.open('', '', 'height=650,width=900');

            printWindow.document.write('<html><head><title>فاتورة مبيعات</title>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600&display=swap" rel="stylesheet">');
            printWindow.document.write(`
                <style>
                    /* General Styling */
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Cairo', sans-serif; background-color: #f4f4f4; }
                    .invoice-container { width: 100%; max-width: 210mm; padding: 20px; background-color: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); border: 1px solid #ddd; margin: 0 auto; }
                    @media print { .invoice-container { width: 100%; height: auto; box-shadow: none; border: none; page-break-inside: avoid; } button { display: none; } }
                    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 3px solid #00a9b0; }
                    .header img { width: 70px; }
                    .header .invoice-title { color: #00a9b0; font-size: 30px; font-weight: bold; margin-right: 10px; }
                    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                    table th, table td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
                    table th { background-color: #f0f0f0; color: #333; }
                    table td.description { text-align: right; }
                    .summary { display: flex; justify-content: flex-start; }
                    .summary table td { border: none; padding: 5px 0; }
                    .grand-total { font-size: 18px; font-weight: bold; color: #00a9b0; }
                    .footer-text { color: #00a9b0; font-weight: bold; text-align: center; margin-top: 10px; position: absolute; bottom: 0; }
                </style>
            `);
            printWindow.document.write('</head><body style="direction: rtl;">');
            printWindow.document.write(invoiceHTML(invoiceData)); // Execute function to get the HTML
            printWindow.document.write('</body></html>');

            printWindow.document.close();
            printWindow.focus();
            printWindow.print();

        })
        .catch((error) => {
            console.error(error);
        });


}

