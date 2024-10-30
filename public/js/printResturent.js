// utils/printInvoice.js

/**
 * Generates HTML for a group of foods.
 *
 * @param {String} shopName - The name of the shop.
 * @param {Object} data - The invoice data.
 * @param {Array<Object>} foods - The list of foods in the group.
 * @param {String} Comments - Any comments for the invoice.
 * @param {Array<Object>} foodData - Data about the foods.
 * @returns {String} - The HTML string.
 */
function generateHTML(shopName, data, foods, Comments, foodData) {
  const itemRows = [];
  foods.foods.forEach((dummyFood) => {
      const foodInvoice = foodData.find((food) => food.id._id === dummyFood._id);
      itemRows.push([
          `${dummyFood.name}`,
          `${foodInvoice.quantity}`,
          `${foodInvoice.foodPrice ? foodInvoice.foodPrice : foodInvoice.price}`,
          `${Number(foodInvoice.quantity) * Number(foodInvoice.foodPrice ? foodInvoice.foodPrice : dummyFood.price)}`,
          `${foodInvoice.comment || ""}`,
      ]);
  });

  let items = '';

  for (const item of itemRows) {
      items += `
          <tr>
              <td class="quantity">${item[1]}</td>
              <td class="name">${item[0]}</td>
          </tr>
          <tr>
              <td colspan="2" class="comment">${item[4]}</td>
          </tr>
      `;
  }

  let CommentField = '';
  if (Comments) {
      CommentField = `
          <div class="centerdiv" style="padding-top: 10px; text-align: center; font-size: 1.6rem;">
              الملاحظات : ${Comments}
          </div>
      `;
  }

  const invoicedateString = data.invoicedate;
  const invoicedate = new Date(invoicedateString);
  let hours = invoicedate.getHours() - 3;

  if (hours < 0) {
      hours += 24;
      invoicedate.setDate(invoicedate.getDate() - 1);
  }

  const day = invoicedate.getDate();
  const month = invoicedate.getMonth() + 1;
  const year = invoicedate.getFullYear();
  const minutes = invoicedate.getMinutes();
  const seconds = invoicedate.getSeconds();

  const dateyear = `${day}/${month}/${year}`;
  const dateclock = `${hours}:${minutes}:${seconds}`;

  return `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <style>
          * {
            font-size: 1.4rem;
            margin: 0px;
            font-family: 'Arial';
          }
          main {
            padding: 6px;
            width: 560px;
          }
          .dashed-line {
            border: none;
            height: 2px;
            background-image: repeating-linear-gradient(to right, black, black 8px, transparent 8px, transparent 16px);
          }
          .centerdiv {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
          }
          table {
            width: 100%;
          }
          th, td {
            text-align: center;
          }
          .comment {
            font-size: 1.2rem;
            color: black;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <main>
          <hr class="dashed-line">
          <div class="centerdiv">
            <a style="font-weight: bold; margin-top: 3px; margin-bottom: 3px;">
              ${shopName}
            </a>
          </div>
          <hr class="dashed-line">
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <div></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px;">
              <div>
                التاريخ : ${dateyear}
              </div>
              <div>
                رقم الطاولة : ${data.tableNumber}
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; margin-bottom: 4px;">
              <div>
                ر.الوصل : ${data.invoicenumber}
              </div>
              <div>
                الوقت : ${dateclock}
              </div>
            </div>
          </div>
          <table>
            <tr>
              <th>العدد</th>
              <th>المنتج</th>
            </tr>
            ${items}
          </table>
          ${CommentField}
          <hr class="dashed-line" style="margin-top: 20px;">
        </main>
      </body>
      </html>
  `;
}

  /**
   * Prints the invoice by fetching data and sending the generated HTML for printing.
   *
   * @param {String} tableId - The table ID.
   * @param {String} Comments - Comments for the invoice.
   * @param {String} deviceId - The device ID for printing.
   */
  async function printResturentInvoice(tableId, Comments, deviceId) {
    try {
      const baseURL = '';
  
      // Step 1: Fetch the invoice data from the server
      const response = await fetch(`${baseURL}/invoice/${tableId}/foodToResturentChecout`);
      const data = await response.json();
  
      // Step 2: Extract food IDs from the invoice data
      const foodIds = data.food.map((dummyFood) => dummyFood.id);
  
      // Step 3: Fetch grouped foods from the backend
      const groupResponse = await fetch(`${baseURL}/category/groupFoods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foodIds }),
      });
      
      const groupedFoods = await groupResponse.json();
  
      // Step 4: Iterate through each group and generate/send HTML
      for (const [category, foods] of Object.entries(groupedFoods.data)) {
        const htmlToPrint = generateHTML(data.setting.shopname, data, foods, Comments, data.food);
  
        // Send the HTML to the server for printing
        await fetch(`${baseURL}/invoice/printdummyinvoice/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            htmbody: htmlToPrint,
            category: category,
          }),
        });
      }
  
      // Handle 'Others' category separately if needed
      if (groupedFoods.data["Others"] && groupedFoods.data["Others"].length > 0) {
        const othersHTML = generateHTML(data.setting.shopname, data, groupedFoods.data["Others"], Comments, data.food);
        await fetch(`${baseURL}/invoice/printdummyinvoice/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            htmbody: othersHTML,
          }),
        });
      }
  
      return true;
    } catch (error) {
      console.error('Error:', error);
      // alert('Error: Failed to print the invoice.');
      throw error;
    }
  }
  