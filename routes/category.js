const router = require("express").Router();

const { default: mongoose } = require("mongoose");
const Category = require("../models/category");
const Devices = require("../models/devices");
const Food = require("../models/food");
const { groupFoodsByCategory } = require("../service/groupfoodsByDevice");


// Home Route - List all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('category/index', { categories });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// // Show Category with Comments
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send('Category not found');
        }
        res.render('category/category', { category });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// // Add a Comment
router.post('/:id/comments', async (req, res) => {
    try {
        const { text } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // If using subdocuments
        category.comments.push({ text });

        // If using array of strings, use:
        // category.comments.push(text);

        await category.save();
        res.status(201).json({ message: 'Comment added', comments: category.comments });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// // Delete a Comment
router.delete('/:id/comments/:commentId', async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // If using subdocuments
        // category.comments.id(commentId).remove();

        // If using array of strings, use:
        category.comments = category.comments.filter(comment => comment !== req.params.comment);

        await category.save();
        res.status(200).json({ message: 'Comment deleted', comments: category.comments });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /devices/groupFoods
router.post("/groupFoods", async (req, res) => {
    const { foodIds } = req.body; // Expecting an array of food IDs in the request body

    if (!Array.isArray(foodIds)) {
        return res.status(400).json({ error: "foodIds must be an array" });
    }

    try {
        const groupedFoods = await groupFoodsByCategory(foodIds);

        res.status(200).json({
            message: "Foods grouped successfully",
            data: groupedFoods,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /devices/:deviceId/groupFoods
router.post("/:deviceId/groupFoods", async (req, res) => {
    const { deviceId } = req.params;
    const { foodIds } = req.body;

    if (!Array.isArray(foodIds)) {
        return res.status(400).json({ error: "foodIds must be an array" });
    }

    try {
        const groupedFoods = await groupFoodsByDeviceCategory(deviceId, foodIds);
        res.status(200).json({
            message: "Foods grouped successfully",
            data: groupedFoods,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// GET /devices/:deviceId/groupFoods
router.get("/:deviceId/groupFoods", async (req, res) => {
    const { deviceId } = req.params;
    const { foodIds } = req.body;

    if (!Array.isArray(foodIds)) {
        return res.status(400).json({ error: "foodIds must be an array" });
    }

    try {
        const groupedFoods = await groupFoodsByDeviceCategory(deviceId, foodIds);
        res.status(200).json({
            message: "Foods grouped successfully",
            data: groupedFoods,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST route to get comments from Categories associated with given Food IDs
router.post('/getCategoryComments', async (req, res) => {
    try {
        const { foodIds } = req.body;
        const ids = foodIds.map(item => item.id._id)
        console.log(ids)
        // Validate the input
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(200).json({ message: 'Invalid or missing foodIds in request body.' });
        }

        // Ensure all provided IDs are valid ObjectIds
        const validFoodIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validFoodIds.length === 0) {
            return res.status(200).json({ message: 'No valid Food IDs provided.' });
        }

        const comments = await Food.aggregate([
            // Match foods with the provided IDs
            { $match: { _id: { $in: validFoodIds.map(id => new mongoose.Types.ObjectId(id)) } } },

            // Lookup to join with the Category collection
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },

            // Unwind the category array (converts it from an array to an object)
            { $unwind: '$category' },

            // Unwind the comments array in the category
            { $unwind: '$category.comments' },

            // Project the fields we need
            {
                $project: {
                    categoryId: '$category._id',
                    categoryName: '$category.name',
                    commentId: '$category.comments._id',
                    text: '$category.comments.text',
                    createdAt: '$category.comments.createdAt',
                    updatedAt: '$category.comments.updatedAt'
                }
            }
        ]);

        if (comments.length === 0) {
            console.log('No comments found for the associated Categories.')
            return res.status(200).json({ message: 'No comments found for the associated Categories.' });
        }

        // Respond with the collected comments
        const finalComment = transformComments(comments)
        console.log(finalComment)
          
        // console.log(allTexts)
        return res.status(200).json({ finalComment });

    } catch (error) {
        console.error('Error fetching category comments:', error);
        return res.status(200).json({ message: 'Internal server error.' });
    }
});
function transformComments(comments) {
    const groupedComments = comments.reduce((acc, comment) => {
        const id = comment._id.toString();
        if (!acc[id]) {
            acc[id] = {
                id: id,
                categoryId: comment.categoryId.toString(),
                categoryName: comment.categoryName,
                texts: []
            };
        }
        acc[id].texts.push({
            commentId: comment.commentId.toString(),
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
        });
        return acc;
    }, {});

    return Object.values(groupedComments);
}

// Example usage:
module.exports = router;
