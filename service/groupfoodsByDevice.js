// controllers/deviceController.js
const mongoose = require("mongoose");
const Devices = require("../models/devices");
const Food = require("../models/food");

/**
 * Groups foods based on device category roles.
 *
 * @param {Array<String>} foodIds - The IDs of the foods to be grouped.
 * @returns {Object} An object containing device-wise grouped foods.
 */
async function groupFoodsByCategory(foodIds) {
    try {
        // Validate and sanitize foodIds
        const validFoodIds = foodIds.map(food => food._id);
        console.log(validFoodIds)
        // const validFoodIds = foodIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

        if (validFoodIds.length === 0) {
            throw new Error("No valid food IDs provided.");
        }

        // Fetch all devices with their category roles
        const devices = await Devices.find({})
            .populate("categoryRole")
            .exec();

        if (!devices || devices.length === 0) {
            throw new Error("No devices found in the system.");
        }

        // Create a mapping from category ID to device
        const categoryToDeviceMap = {};

        devices.forEach((device) => {
            device.categoryRole.forEach((category) => {
                const categoryId = category._id.toString();
                if (!categoryToDeviceMap[categoryId]) {
                    categoryToDeviceMap[categoryId] = [];
                }
                categoryToDeviceMap[categoryId].push(device);
            });
        });

        // Fetch foods along with their categories
        const foods = await Food.find({ _id: { $in: validFoodIds } })
            .populate("category")
            .exec();

        // Initialize groups: deviceId => [foods]
        const groupedFoods = {};

        // Initialize device entries
        devices.forEach((device) => {
            groupedFoods[device._id] = {
                device: {
                    id: device._id,
                    name: device.name,
                    type: device.type,
                    // Add other device fields as needed
                },
                foods: [],
            };
        });

        // Initialize an 'Unassigned' group for foods that don't match any device category
        groupedFoods["Unassigned"] = {
            device: null,
            foods: [],
        };

        // Assign foods to devices based on category
        foods.forEach((food) => {
            const categoryId = food.category._id.toString();
            const devicesHandlingCategory = categoryToDeviceMap[categoryId];

            if (devicesHandlingCategory && devicesHandlingCategory.length > 0) {
                devicesHandlingCategory.forEach((device) => {
                    groupedFoods[device._id].foods.push(food);
                });
            } else {
                groupedFoods["Unassigned"].foods.push(food);
            }
        });

        // Optionally remove devices with no assigned foods
        for (const deviceId in groupedFoods) {
            if (deviceId !== "Unassigned" && groupedFoods[deviceId].foods.length === 0) {
                delete groupedFoods[deviceId];
            }
        }

        // Optionally remove 'Unassigned' group if it's empty
        if (groupedFoods["Unassigned"].foods.length === 0) {
            delete groupedFoods["Unassigned"];
        }
        console.log(groupedFoods)
        return groupedFoods;
    } catch (error) {
        console.error("Error grouping foods by category:", error.message);
        throw error;
    }
}

module.exports = { groupFoodsByCategory };
