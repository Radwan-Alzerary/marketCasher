


function newitem(food, invoiceid, newquantity, newPrice) {
    // Create the main invoice div
    const invoiceFoodDiv = document.getElementById('invoicefood');
    const invoiceDiv = document.createElement('div');
    invoiceDiv.id = `${food._id}`
    invoiceDiv.classList.add('w-full', 'my-1', 'h-12', 'bg-slate-50', 'flex', 'justify-around', 'items-center', 'cursor-pointer', 'hover:bg-zinc-200');

    // Create the inner content of the invoice div
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('flex', 'justify-center', 'items-center', 'text-sm', 'font-semibold');

    // Create the SVG element
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.classList.add('opacity-50');
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('height', '1em');
    svgElement.setAttribute('viewBox', '0 0 448 512');

    // Create the path element inside the SVG
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', 'M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z');

    // Create the price element
    const priceDiv = document.createElement('input');
    priceDiv.setAttribute('type', 'number');

    priceDiv.classList.add('w-24', 'text-center', 'border-0');
    priceDiv.setAttribute('oninput', `onPriceChange(event)`);
    priceDiv.setAttribute('id', `price${food._id}`);
    priceDiv.value = Number(newPrice); // Replace `food.price` with the actual property that holds the price



    const removelement = document.createElement('div');
    removelement.classList.add('w-8', 'rounded-full', 'h-8', 'flex', 'justify-around', 'items-center', 'hover:bg-red-400')
    removelement.id = `removeinvoice{"invoiceid":"${invoiceid}","foodid":"${food._id}"}`


    
    // Create the food name element
    const foodNameDiv = document.createElement('div');
    foodNameDiv.classList.add('text-sm', 'w-24', 'text-center', 'font-bold');
    const foodNameLink = document.createElement('a');
    foodNameLink.textContent = food.name; // Replace `food.name` with the actual property that holds the food name
    foodNameDiv.appendChild(foodNameLink);


    const svgElement2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement2.classList.add('opacity-50');
    svgElement2.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement2.setAttribute('height', '1em');
    svgElement2.setAttribute('viewBox', '0 0 448 512');

    const pathElement2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement2.setAttribute('d', 'M201 10.3c14.3-7.8 31.6-7.8 46 0L422.3 106c5.1 2.8 8.3 8.2 8.3 14s-3.2 11.2-8.3 14L231.7 238c-4.8 2.6-10.5 2.6-15.3 0L25.7 134c-5.1-2.8-8.3-8.2-8.3-14s3.2-11.2 8.3-14L201 10.3zM23.7 170l176 96c5.1 2.8 8.3 8.2 8.3 14v216c0 5.6-3 10.9-7.8 13.8s-10.9 3-15.8 .3L25 423.1C9.6 414.7 0 398.6 0 381V184c0-5.6 3-10.9 7.8-13.8s10.9-3 15.8-.3zm400.7 0c5-2.7 11-2.6 15.8 .3s7.8 8.1 7.8 13.8v197c0 17.6-9.6 33.7-25 42.1L263.7 510c-5 2.7-11 2.6-15.8-.3s-7.8-8.1-7.8-13.8V280c0-5.9 3.2-11.2 8.3-14l176-96z');

    svgElement2.appendChild(pathElement2);

    const sentencElement = document.createElement('div');
    sentencElement.classList.add('w-8', 'rounded-full', 'h-8', 'flex', 'justify-around', 'items-center', 'hover:bg-green-400')
    sentencElement.id = `sentencElement{"invoiceid":"${invoiceid}","foodid":"${food._id}"}`




    // Create the fieldset element
    const fieldset = document.createElement('fieldset');
    fieldset.setAttribute('data-quantity', '');
    fieldset.classList.add('w-24')
    // Create the "Down" button
    const decreaseButton = document.createElement('button');
    decreaseButton.setAttribute('type', 'button');
    decreaseButton.setAttribute('title', 'Down');
    decreaseButton.setAttribute('id', `decreaseQuantity${food._id}`);
    decreaseButton.setAttribute('class', 'sub');
    decreaseButton.textContent = '-';

    // Create the input element
    const input = document.createElement('input');
    input.setAttribute('type', 'number');
    input.setAttribute('type', 'number');
    input.setAttribute('oninput', `quantitychange(event)`);
    input.setAttribute('id', `quantity${food._id}`);
    input.setAttribute('pattern', '[0-9]+');
    input.value = Number(newquantity); // Replace 10 with the desired value

    // Create the "Up" button
    const increaseButton = document.createElement('button');
    increaseButton.setAttribute('type', 'button');
    increaseButton.setAttribute('title', 'Up');
    increaseButton.setAttribute('id', `increaseQuantity${food._id}`);
    increaseButton.setAttribute('class', 'add');
    increaseButton.textContent = '+';

    // Append the elements to the fieldset
    fieldset.appendChild(decreaseButton);
    fieldset.appendChild(input);
    fieldset.appendChild(increaseButton);

    // Create the quantity element
    const quantityDiv = document.createElement('input');
    quantityDiv.classList.add('mx-2', 'text-sm', 'font-bold');
    quantityDiv.id = `quantity${food._id}`
    quantityDiv.textContent = Number(newquantity); // Replace `food.quantity` with the actual property that holds the quantity
    // Append all the elements to their respective parents
    svgElement.appendChild(pathElement);
    removelement.appendChild(svgElement);
    sentencElement.appendChild(svgElement2);

    invoiceDiv.appendChild(removelement);
    invoiceDiv.appendChild(sentencElement);

    contentDiv.appendChild(priceDiv);
    invoiceDiv.appendChild(contentDiv);
    invoiceDiv.appendChild(foodNameDiv);
    invoiceDiv.appendChild(fieldset);

    // Append the invoice div to the main invoicefood div
    invoiceFoodDiv.appendChild(invoiceDiv);
}


function addmoney(money) {


    oldgetamont = Number($("#amontget").val())
    moneyamont = Number($(`#orderamount`).val())
    $("#amontget").val(Number(money + oldgetamont))
    $("#amontleft").text(moneyamont - Number($("#amontget").val()))
    const amountchagnge = $(`#amontget`).val()
    $('#ReceivedAmountInput').val(amountchagnge)
    const receivesAmountValue = $(`#amontget`).val()
    const finalCostValue = $('#finalcost').text()
    $("#Received-amount").text(receivesAmountValue)
    if ((receivesAmountValue - finalCostValue) > 0) {
        $("#Remaining-amount").text(receivesAmountValue - finalCostValue)
    } else {
        $("#Remaining-amount").text(0)
    }


}
function amontgetchange() {
    const amountchagnge = $(`#amontget`).val()
    $('#ReceivedAmountInput').val(amountchagnge)
    const receivesAmountValue = $(`#amontget`).val()
    const finalCostValue = $('#finalcost').text()
    $("#Received-amount").text(receivesAmountValue)
    if ((receivesAmountValue - finalCostValue) > 0) {
        $("#Remaining-amount").text(receivesAmountValue - finalCostValue)
    } else {
        $("#Remaining-amount").text(0)
    }


    moneyamont = Number($(`#orderamount`).val())
    $("#amontleft").text(moneyamont - Number($("#amontget").val()))
}
function fullamontchange() {
    moneyamont = Number($(`#orderamount`).val())
    $("#amontleft").text(moneyamont - Number($("#amontget").val()))

}

$("#reloadfoods").on('click', (event) => {
    refrash()
})

$("#translateinvoice").on('click', (event) => {
    if (!$('#shadedbackground').hasClass('hidden')) {
        $('#shadedbackground').addClass('hidden');
        $('#editableform').addClass('hidden');
    } else {
        $(`#shadedbackground`).removeClass('hidden');
        $(`#editableform`).removeClass('hidden');
    }
})
$('#shadedbackground').on('click', (event) => {
    $('#shadedbackground').addClass('hidden');
    $('#moneybackform').addClass('hidden');
    $('#editableform').addClass('hidden');
    $('#printingsettingform').addClass('hidden');
    $("#amontleft").text("")

})

function showmoneyback() {
    if (!$('#shadedbackground').hasClass('hidden')) {
        $('#shadedbackground').addClass('hidden');
        $('#moneybackform').addClass('hidden');
    } else {
        orderamount = Number($('#finalcost').text())
        $(`#orderamount`).val(orderamount)
        $("#amontleft").text(orderamount)

        $(`#shadedbackground`).removeClass('hidden');
        $(`#moneybackform`).removeClass('hidden');
    }
}

function showprinterform() {
    if (!$('#shadedbackground').hasClass('hidden')) {
        $('#shadedbackground').addClass('hidden');
        $('#printingsettingform').addClass('hidden');
    } else {
        $(`#shadedbackground`).removeClass('hidden');
        $(`#printingsettingform`).removeClass('hidden');
    }
}


function ReceivedAmountInput() {
    const receivesAmountValue = $('#ReceivedAmountInput').val()
    const finalCostValue = $('#finalcost').text()
    $("#Received-amount").text(receivesAmountValue)
    if ((receivesAmountValue - finalCostValue) > 0) {
        $("#Remaining-amount").text(receivesAmountValue - finalCostValue)
    } else {
        $("#Remaining-amount").text(0)
    }
    const inputElement = event.target;

    // Retrieve the ID of the input element
    const inputId = inputElement.id;

    // Use the inputId as needed
    const amountReceived = $("#ReceivedAmountInput").val();
    const currentUrl = window.location.href;
    console.log("Current URL:", currentUrl);
    const url = new URL(currentUrl);
    const searchParams = new URLSearchParams(url.search);
    const tableId = searchParams.get("tableid");
    const invoiceId = $("#invoiceidelement").text();
    fetch("/invoice/changeReceivedAmount/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceId, amountReceived }),
    })
        .then((response) => response.json())
        .then((data) => {
            getprices(invoiceId);
            // $("#finalcost").text();
            // $("#totalprice").text();
        })
        .catch((error) => {
            console.error("Error:", error);
            // Handle errors
        });



}



function getprices(invoiceId) {
    fetch("/invoice/price/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoiceId })
    })
        .then(response => response.json())
        .then(data => {
            $("#finalcost").text(data.finalprice);
            $("#totalprice").text(data.total);
            $("#totaldiscount").text(data.totaldiscount);
            $("#deleveryCostView").text(data.deleveryCost);

            const receivesAmountValue = $('#ReceivedAmountInput').val()
            const finalCostValue = $('#finalcost').text()

            $("#Received-amount").text(receivesAmountValue)
            if ((receivesAmountValue - finalCostValue) > 0) {
                $("#Remaining-amount").text(receivesAmountValue - finalCostValue)
            } else {
                $("#Remaining-amount").text(0)
            }

            $("#totalcost").text(data.totalcost);
        })
        .catch(error => {
            console.error('Error:', error);
            // Handle errors
        });
}
