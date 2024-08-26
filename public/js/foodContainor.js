// Ensure this script is in the global scope
function toggleCategory(categoryId) {
    const contents = document.getElementById(`contents${categoryId}`);
    const arrow = document.getElementById(`openarrow${categoryId}`);
    if (contents.classList.contains('hidden')) {
        contents.classList.remove('hidden');
        arrow.style.transform = 'rotate(180deg)';
    } else {
        contents.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}
function deleteCategory(categoryId) {
    if (confirm("Are you sure you want to delete this category?")) {
        fetch(`/food/${categoryId}/removecatogary`, { method: 'DELETE' })
            .then(() => fetchCategoriesAndFoods())  // Refresh the categories after deletion
            .catch(error => console.error('Error deleting category:', error));
    }
}

function editCategory(categoryId) {
    fetch(`/food/${categoryId}`)
        .then(response => response.json())
        .then(data => {
            // Populate your form with the category data for editing
            // Show your modal or form here
        })
        .catch(error => console.error('Error fetching category:', error));
}

function editFood(foodId) {
    fetch(`/food/${foodId}`)
        .then(response => response.json())
        .then(data => {
            // Populate your form with the food data for editing
            // Show your modal or form here
        })
        .catch(error => console.error('Error fetching food data:', error));
}

function deleteFood(foodId) {
    if (confirm("Are you sure you want to delete this food item?")) {
        fetch(`/food/${foodId}/foodremove`, { method: 'DELETE' })
            .then(() => fetchCategoriesAndFoods())  // Refresh the categories after deletion
            .catch(error => console.error('Error deleting food:', error));
    }
}

function toggleFoodActive(foodId) {
    fetch(`/food/${foodId}/active`, { method: 'PATCH' })
        .then(() => fetchCategoriesAndFoods())  // Refresh the categories after toggling
        .catch(error => console.error('Error toggling food active state:', error));
}

// Call this function to fetch categories and render them
function fetchCategoriesAndFoods() {
    fetch('/food/categories')
        .then(response => response.json())
        .then(data => renderCategories(data))
        .catch(error => console.error('Error fetching categories:', error));
}

function renderCategories(data) {
    const container = document.querySelector('#categoryContainer');
    container.innerHTML = '';  // Clear existing content

    // Destructure the data object
    const { category, totalCost } = data;

    if (!category || category.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-700">لا يوجد اقسام مضافة</div>';
        return;
    }

    // Display total cost
    const totalCostDiv = document.createElement('div');
    totalCostDiv.className = 'w-full h-16 bg-white rounded-xl text-center text-lg font-bold mb-4';
    totalCostDiv.innerHTML = `
        <div>مجموع رأس المالي الحالي</div>
        <div id="fullCurrencyInStorage">${totalCost}</div>
    `;
    container.appendChild(totalCostDiv);

    category.forEach(cat => {
        const categoryDiv = document.createElement('div');
        categoryDiv.id = `${cat._id}`;
        categoryDiv.className = 'w-full px-5 py-2';

        // Category header
        categoryDiv.innerHTML = `
            <div>
                <div id="category${cat._id}" class="w-full h-12 bg-white rounded-xl flex justify-center items-center cursor-pointer hover:bg-zinc-200" onclick="toggleCategory('${cat._id}')">
                    <div class="flex gap-3 w-2/6 place-content-center">
                        <div id="deletcatacury${cat._id}" class="w-8 h-8 rounded-lg flex justify-center items-center hover:bg-red-200" onclick="deleteCategory('${cat._id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" class="fill-red-500" height="1em" viewBox="0 0 448 512">
                                <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                            </svg>
                        </div>
                        <div id="edit${cat._id}" class="w-8 h-8 flex justify-center items-center" onclick="editCategory('${cat._id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                                <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 10.7-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-10.7 32-32s-10.7-32-32-32H96z"/>
                            </svg>
                        </div>
                        <div class="w-8 h-8 flex justify-center items-center">
                            <svg id="openarrow${cat._id}" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                                <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="w-2/6 place-content-center text-center">${cat.foods.length}</div>
                    <div class="text-xl font-bold w-2/6 place-content-center text-center">
                        <a>${cat.name}</a>
                    </div>
                </div>
                <div id="contents${cat._id}" class="hidden transition-all py-2 px-2 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-x-8 overflow-y-scroll" style="height: 76vh"></div>
            </div>
        `;

        // Add food items to the category
        const contentsDiv = categoryDiv.querySelector(`#contents${cat._id}`);
        if (cat.foods && cat.foods.length > 0) {
            cat.foods.forEach(food => {
                const foodDiv = document.createElement('a');
                foodDiv.className = `group ${food.active ? '' : 'opacity-50'} text-center bg-white`;
                foodDiv.innerHTML = `
                    <div class="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-7">
                        <img src="${food.image.url}" alt="${food.name}" class="h-full w-full object-cover object-center group-hover:opacity-75" />
                    </div>
                    <h3 class="mt-4 text-sm text-gray-700">${food.name}</h3>
                    <p class="mt-1 text-lg font-medium text-gray-900">${food.price} IQD</p>
                    <div class="flex items-center justify-between">
                        <div id="editonefood${food._id}" class="cursor-pointer p-3 bg-green-200 hover:bg-green-400 w-1/3 flex items-center justify-center" onclick="editFood('${food._id}')">
                            <svg class="mx-auto" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                                <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z"/>
                            </svg>
                        </div>
                        <div id="unactive${food._id}" class="cursor-pointer p-3 bg-blue-200 hover:bg-blue-400 w-1/3 items-center justify-center" onclick="toggleFoodActive('${food._id}')">
                            <svg class="mx-auto" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                                <path d="M384 128c70.7 0 128 57.3 128 128s-57.3 128-128 128H192c-70.7 0-128-57.3-128-128s57.3-128 128-128H384zM576 256c0-106-86-192-192-192H192C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192zM192 352a96 96 0 1 0 0-192 96 96 0 1 0 0 192z"/>
                            </svg>
                        </div>
                        <div id="remove${food._id}" class="cursor-pointer p-3 bg-red-200 hover:bg-red-400 w-1/3 items-center justify-center" onclick="deleteFood('${food._id}')">
                            <svg class="mx-auto" id="remove56442dfsd13" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512">
                                <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                            </svg>
                        </div>
                    </div>
                `;
                contentsDiv.appendChild(foodDiv);
            });
        } else {
            const noFoodDiv = document.createElement('a');
            noFoodDiv.innerText = 'لا يوجد اطعمة مضافة';
            contentsDiv.appendChild(noFoodDiv);
        }

        container.appendChild(categoryDiv);
    });
}

// Initially fetch and render categories and foods
fetchCategoriesAndFoods();
