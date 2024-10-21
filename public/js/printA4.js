function printA4invoice(invoiceId, resivename, loction, phonenumber, ReceivedAmount, RemainingAmount, printingcount, Comments, deleveryCost, type) {
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
            const settingVal = await getSetting();
            const isoDate = data.invoicedate;
            const date = new Date(isoDate);
            const options = {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            };
            const formattedDate = date.toLocaleDateString("en-CA", options);

            const calculatePageTotal = (items) => {
                return items.reduce((total, item) => {
                    const price = item.foodPrice || item.id.price;
                    return total + (Number(price) * Number(item.quantity));
                }, 0);
            };

            const createItemsHTML = (items) => {
                return items.map((food, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="description">${food.id.name}</td>
                        <td>${food.foodPrice ? food.foodPrice : food.id.price}</td>
                        <td>${food.quantity} ${food.id.unit}</td>
                        <td>${Number(food.quantity) * Number(food.foodPrice ? food.foodPrice : food.id.price)}</td>
                    </tr>
                `).join('');
            };

            const splitItemsIntoPages = (items, itemsPerPage = 20) => {
                const pages = [];
                for (let i = 0; i < items.length; i += itemsPerPage) {
                    pages.push(items.slice(i, i + itemsPerPage));
                }
                return pages;
            };

            const pages = splitItemsIntoPages(data.food);

            const invoiceHTML = (pages) => {
                return pages.map((pageItems, pageIndex) => {
                    const pageTotal = calculatePageTotal(pageItems);

                    return `
                        <div class="invoice-container" style="position: relative; min-height: 297mm; padding-bottom: 60px;">
                            <!-- Header -->
                            <div class="header" style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <img id="companyLogo" src="${settingVal.shoplogo}" alt="شعار الشركة" style="width: 150px; height: auto;">
                                </div>
                                <div class="invoice-title" style="flex-grow: 1; text-align: center;">فاتورة مبيعات</div>
                                <div class="invoice-info" style="text-align: right;">
                                    <p>رقم الفاتورة: ${data.invoicenumber}</p>
                                    <p>تاريخ الإصدار: ${formattedDate}</p>
                                    <p>صفحة: ${pageIndex + 1}</p>
                                </div>
                            </div>
                    
                            <!-- Invoice Details -->
                            <div class="invoice-details">
                                <div class="bill-to">
                                    <div style="display: flex;">
                                        <h3 class="blue-text">إلى العميل:</h3>
                                        <h3>${resivename}</h3>
                                    </div>

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
                                        <th>#</th>
                                        <th>الوصف</th>
                                        <th>تكلفة الوحدة</th>
                                        <th>الكمية ${settingVal.amountUnit}</th>
                                        <th>المجموع</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${createItemsHTML(pageItems)}
                                </tbody>
                            </table>

                            <!-- Page Summary -->
                            <div class="summary">
                                <table>
                                    <tr>
                                        <td class="label">المجموع للصفحة:</td>
                                        <td>${pageTotal.toLocaleString()}</td>
                                    </tr>
                                    ${pageIndex === pages.length - 1 ? `
                                    <tr>
                                        <td class="label">المجموع الكلي:</td>
                                        <td>${data.fullcost}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">الخصم:</td>
                                        <td>${data.fulldiscont}</td>
                                    </tr>
                                    <tr>
                                        <td class="label grand-total">المجموع الكلي النهائي:</td>
                                        <td class="grand-total">${data.finalcost}</td>
                                    </tr>` : ''}
                                </table>
                            </div>

                            <!-- Footer Text (Repeat on every page) -->
                            <div class="footer-text" style="display: flex; width: 100%; justify-content: space-between; padding-top: 10px; border-top: 1px solid #ddd; position: absolute; bottom: 20px; left: 0; right: 0;">
                                <p style="width: 33%;">${settingVal.adress}</p>
                                <p style="width: 33%; text-align: center;">${settingVal.invoicefooter}</p>
                                <p style="width: 33%; text-align: right;">${settingVal.phonnumber}</p>
                            </div>
                        </div>
                    `;
                }).join('<div class="page-break"></div>');
            };

            const printWindow = window.open('', '', 'height=650,width=900');

            printWindow.document.write('<html><head><title>فاتورة مبيعات</title>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600&display=swap" rel="stylesheet">');
            printWindow.document.write(`
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Cairo', sans-serif; background-color: #f4f4f4; }
                    .invoice-container { width: 100%; max-width: 210mm; min-height: 297mm; padding: 20px; background-color: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); border: 1px solid #ddd; margin: 0 auto; position: relative; }
                    @media print { .invoice-container { width: 100%; height: auto; box-shadow: none; border: none; } .page-break { page-break-before: always; } button { display: none; } }
                    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 3px solid #00a9b0; }
                    .invoice-title { color: #00a9b0; font-size: 30px; font-weight: bold; margin-right: 10px; }
                    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                    table th, table td { border: 1px solid #ddd; padding: 2px; font-size: 10px; }
                    table th { background-color: #f0f0f0; color: #333; }
                    .summary { display: flex; justify-content: flex-start; margin-top: 10px; }
                    .summary table td { border: none; padding: 5px 0; }
                    .grand-total { font-size: 18px; font-weight: bold; color: #00a9b0; }
                    .footer-text { color: #00a9b0; font-weight: bold; text-align: center; border-top: 1px solid #ddd; padding: 10px 0; position: absolute; bottom: 20px; left: 20px; right: 20px; }
                    .page-break { display: none; }
                    @media print { .page-break { display: block; } }
                </style>
            `);
            printWindow.document.write('</head><body style="direction: rtl;">');
            printWindow.document.write(invoiceHTML(pages));
            printWindow.document.write('</body></html>');

            printWindow.document.close();
            const logo = printWindow.document.getElementById('companyLogo');

            if (logo) {
                logo.onload = () => {
                    printWindow.focus();
                    printWindow.print();
                };
            } else {
                printWindow.focus();
                printWindow.print();
            }

        })
        .catch((error) => {
            console.error(error);
        });
}
