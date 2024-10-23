function printinvoice(
  invoiceId,
  resivename,
  loction,
  phonenumber,
  ReceivedAmount,
  RemainingAmount,
  printingcount,
  Comments,
  deleveryCost,
  type
) {
  if (deleveryCost) {
  } else {
    deleveryCost = 0;
  }
  // alert(printingcount)
  fetch(`/invoice/${invoiceId}/checout`)
    .then((response) => response.json())
    .then((data) => {
      let remainingValue = "";
      let remainingString = "";
      console.log(data.systemSetting.type)
      if (ReceivedAmount != 0 && RemainingAmount != 0) {
        remainingValue = `
                    <div style="margin-top: 3px;">
                    <a>${ReceivedAmount}</a>
                    </div>
                    <div style="margin-top: 3px;">
                    <a>${RemainingAmount}</a>
                    </div>
                `;
        remainingString = `
                <div style="margin-top: 3px;">
                <a style="margin-right: 20px;">المبلغ المستلم</a>
                 </div>
                 <div style="margin-top: 3px;">
                 <a style="margin-right: 20px;">المبلغ المرجع</a>
                  </div>
                `;
      }
      // Create the item rows (<tr>) with their cells (<td>)
      // console.log()
      console.log(deleveryCost);
      const itemRows = [];
      data.food.forEach((food) => {
        itemRows.push([
          `${food.id.name}`,
          `${food.quantity}`,
          `${food.foodPrice ? food.foodPrice : food.id.price}`,
          `${Number(food.quantity) * Number(food.foodPrice ? food.foodPrice : food.id.price)}`,
        ]);
      });
      var items = "";

      for (const item of itemRows) {
        items += `
                <tr>
                <td class="description">${item[2]}</td>
                <td class="quantity">${item[1]}</td>
                <td class="price">${item[0]}</td>
                <td class="price">${item[3]}</td>
            </tr>
                `;
      }
      var deleveryinfo = "";
      if (loction && phonenumber) {
        deleveryinfo = `
                <div style:"text-align : right">
                <div class="footerpos" style = "text-align: right">
                <a>عنوان الطلبية : ${loction}</a>
            </div>
            <div class="footerpos" style = "text-align: right">
                <a>رقم الهاتف : ${phonenumber}</a>
            </div>
            </div>
            `;
      } else {
        deleveryinfo = "";
      }
      var deleveyCostView = "";
      var deleveyCostHeader = "";
      if (type == "delevery") {
        deleveyCostView = `
        <div style="margin-top: 3px;">
        <a>${deleveryCost}</a>
    </div>
`;
        deleveyCostHeader = `          
  <div style="margin-top: 3px;">
 <a style="margin-right: 20px;">سعر التوصيل</a>
</div>
`;
      }

      var resivername = "";
      if (resivename) {
        resivername = `
                <div style="text-align: right;">
                اسم العميل : ${resivename}
            </div>
`;
      }

      var CommentField = "";
      if (Comments) {
        CommentField = `
                <div class="centerdiv" style="padding-top: 10px;text-align: center; font-size:1.6rem"">
                الملاحضات : ${Comments}</div>
                `;
      } else {
        CommentField = "";
      }
      // console.log(items)
      const invoicedateString = data.invoicedate;
      const invoicedate = new Date(invoicedateString);

      // Get the hours, then adjust for the 3-hour difference
      let hours = invoicedate.getHours() - 3;

      // Handle wrapping around when the result is negative
      if (hours < 0) {
        hours += 24; // Wrap around to the previous day

        // Subtract one day from the date
        invoicedate.setDate(invoicedate.getDate() - 1);
      }

      const day = invoicedate.getDate();
      const month = invoicedate.getMonth() + 1; // Adding 1 to get the actual month
      const year = invoicedate.getFullYear();
      const minutes = invoicedate.getMinutes();
      const seconds = invoicedate.getSeconds();

      // Create a formatted string
      const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      const dateyear = `${day}/${month}/${year}`;
      const dateclock = `${hours}:${minutes}:${seconds}`;
      console.log("tableNum", data.tableNumber);
      console.log("systemType", data.systemSetting.type !== "cashire")

      if (data.systemSetting.type !== "cashire") {
        if (data.tableNumber < 100) {
          tablenum = `
      <div style="margin-left: 27px;">
      طاولة رقم ${data.tableNumber}
      </div>
      `;
        } else {
          tablenum = `
      <div style="margin-left: 27px;">
      التوصيل
      </div>
      `;
        }
      } else {
        if (data.tableNumber < 100) {
          tablenum = `
      <div style="margin-left: 27px;">
      </div>
      `;
        } else {
          tablenum = `
      <div style="margin-left: 27px;">
      التوصيل
      </div>
      `;
        }

      }

      const htmltoprint2 = `
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
            /* Set the desired height for the dashed line */
            background-image: repeating-linear-gradient(to right, black, black 8px, transparent 8px, transparent 16px);
        }

        .centerdiv {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        table,
        th,
        td {
            border: 1px solid black;
            border-collapse: collapse;
        }
        table {
            width: 100%;
        }

        th,
        td {
            text-align: center;
        }
    </style>
</head>

<body>
    <main>
        <hr class="dashed-line">
        <div class="centerdiv">
            <a style="font-weight: bold; margin-top: 3px; margin-bottom: 3px;">
                ${data.setting.shopname}
            </a>
        </div>
        <hr class="dashed-line">
        <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between;">
                <div>
                </div>
                ${resivername}

            </div>
            <div style="display: flex; justify-content: space-between;margin-top: 6px;">
            ${tablenum}
                <div>
                    التاريخ : ${dateyear}
                </div>

            </div>
            <div style="display: flex;justify-content: space-between;margin-top: 4px;margin-bottom: 4px;">
                <div>
                    ر.الوصل : ${data.invoicenumber}
                </div>
                <div>
                    الوقت : ${dateclock}
                </div>

            </div>
                        <div style="display: flex;justify-content: space-between;margin-top: 4px;margin-bottom: 4px;">
                <div>
                    المحاسب: ${data.user ? data.user.name : ""}
                </div>

            </div>

        </div>
        <table style="width:100%">
            <tr>
                <th>السعر</th>
                <th>العدد</th>
                <th>المنتج</th>
                <th>الاجمالي</th>
            </tr>
            ${items}
        </table>

        <div style="display: flex;justify-content: end;margin-top: 10px;">
            <div style="text-align: right;">
                <div>
                    <a style="margin-right: 20px;">اجمالي الفاتورة</a>
                </div>
                <div style="margin-top: 3px;">
                    <a style="margin-right: 20px;">اجمالي الخصومات</a>
                </div>
                ${deleveyCostHeader}
                <div style="margin-top: 7px;font-weight: bold;">
                    <a style="margin-right: 20px;">د.ع المجموع</a>
                </div>
                ${remainingString}

            </div>
            <div style="text-align: center;">
                <div>
                    <a>${data.fullcost}</a>
                </div>
                <div style="margin-top: 3px;">
                    <a>${data.fulldiscont}</a>
                </div>
${deleveyCostView}
                <div style="margin-top: 3px;font-weight: bold; border: 2px solid black;padding: 2px;">
                    <a>${data.finalcost}</a>
                </div>
                ${remainingValue}


            </div>

        </div>
        <hr class="dashed-line" style="margin-top: 20px;">
        <div style="text-align: right;">
        <div style="margin-top: 4px;text-align: right;">
            العنوان : ${data.setting.adress}
        </div>
        <div style="margin-top: 4px;text-align: right;">
             الهاتف : ${data.setting.phonnumber}
        </div>
    </div>
    ${CommentField}

        <div class="centerdiv" style="padding-top: 10px;text-align: center; font-size:1.8rem">
            ${data.setting.invoicefooter}
        </div>
        ${deleveryinfo}

        </main>
</body>
</html>
            
            `;
      // console.log(htmltoprint)

      if (type === "cashire") {
        fetch("/invoice/printinvoice/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            htmbody: htmltoprint2,
            printingcount: printingcount,
            tableNumber: data.tableNumber
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            // console.log(data)
          })
          .catch((error) => {
            console.error("Error:", error);
            // Handle errors
          });

      } else if (type === "resturent") {
        fetch("/invoice/printresturentinvoice/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            htmbody: htmltoprint2,
            printingcount: printingcount,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            // console.log(data)
          })
          .catch((error) => {
            console.error("Error:", error);
            // Handle errors
          });


      } else if (type === "delevery") {
        fetch("/invoice/printdeleveryinvoice/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            htmbody: htmltoprint2,
            printingcount: printingcount,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            // console.log(data)
          })
          .catch((error) => {
            console.error("Error:", error);
            // Handle errors
          });

      }

    })
    .catch((error) => {
      console.error(error);
    });
}
