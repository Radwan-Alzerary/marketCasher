const router = require('express').Router();
const Category = require("../models/category");
const Food = require("../models/food");
const Table = require("../models/table");

router.get('/', async (req, res) => {
    const category = await Category.find().populate("foods");
    const table = await Table.find().sort({ number: 1 }); // Sort the tables by number in ascending order
    console.log(category)
    res.render('cashier-table', { category, table });
})

router.get('/menu/', async (req, res) => {
    let tableid = req.query.tableid || '_id';
    // const table = await Table.findById(tableid).populate("invoice");
    const table = await Table.find();
    const category = await Category.find().populate("foods");
    console.log(category)
    res.render('cashier-food', { category,table ,tableid});
})


module.exports = router;
