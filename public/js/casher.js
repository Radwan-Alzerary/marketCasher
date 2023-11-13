


function newitem(food, invoiceid, newquantity) {
    console.log(newquantity)
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
    const priceDiv = document.createElement('div');
    priceDiv.classList.add('w-24', 'text-center');
    priceDiv.id = `price${food._id}`;
    priceDiv.textContent = `${food.price}`; // Replace `food.price` with the actual property that holds the price

    const removelement = document.createElement('div');
    removelement.classList.add('w-8', 'rounded-full', 'h-8', 'flex', 'justify-around', 'items-center', 'hover:bg-red-400')
    removelement.id = `removeinvoice{"invoiceid":"${invoiceid}","foodid":"${food._id}"}`

    // Create the food name element
    const foodNameDiv = document.createElement('div');
    foodNameDiv.classList.add('text-sm', 'w-24', 'text-center', 'font-bold');
    const foodNameLink = document.createElement('a');
    foodNameLink.textContent = food.name; // Replace `food.name` with the actual property that holds the food name
    foodNameDiv.appendChild(foodNameLink);

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

    invoiceDiv.appendChild(removelement);

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
    const receivesAmountValue =$(`#amontget`).val()
    const finalCostValue = $('#finalcost').text()
    $("#Received-amount").text(receivesAmountValue)
    if ((receivesAmountValue - finalCostValue) > 0) {
        $("#Remaining-amount").text(receivesAmountValue - finalCostValue)
    }else{
        $("#Remaining-amount").text(0)
    }


}
function amontgetchange() {
    const amountchagnge = $(`#amontget`).val()
    $('#ReceivedAmountInput').val(amountchagnge)
    const receivesAmountValue =$(`#amontget`).val()
    const finalCostValue = $('#finalcost').text()
    $("#Received-amount").text(receivesAmountValue)
    if ((receivesAmountValue - finalCostValue) > 0) {
        $("#Remaining-amount").text(receivesAmountValue - finalCostValue)
    }else{
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
    }else{
        $("#Remaining-amount").text(0)
    }

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
            console.log(data)
            $("#finalcost").text(data.finalprice);
            $("#totalprice").text(data.total);
            $("#totaldiscount").text(data.totaldiscount);
            $("#deleveryCostView").text(data.deleveryCost);

            const receivesAmountValue = $('#ReceivedAmountInput').val()
            const finalCostValue = $('#finalcost').text()

            $("#Received-amount").text(receivesAmountValue)
            if ((receivesAmountValue - finalCostValue) > 0) {
                $("#Remaining-amount").text(receivesAmountValue - finalCostValue)
            }else{
                $("#Remaining-amount").text(0)
            }
        
            $("#totalcost").text(data.totalcost);
        })
        .catch(error => {
            console.error('Error:', error);
            // Handle errors
        });
}
