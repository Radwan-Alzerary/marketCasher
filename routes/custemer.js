const Customer = require("../models/costemer");
const SystemSetting = require("../models/systemSetting");
const User = require("../models/user");
const router = require("express").Router();

router.get("/getall", async (req, res) => {
  const custemer = await Customer.find();
  res.json(custemer);
});

router.get("/getbyname/:searchName", async (req, res) => {
  const searchName = req.params.searchName;
  try {
    const patients = await Customer.find({
      name: { $regex: searchName, $options: "i" },
    })
      .sort({ updatedAt: -1 }) // Sort by 'updatedAt' field in descending order
      .limit(10);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /customer/query?search=&sort=
router.get('/query', async (req, res) => {
  try {
    const { search, sort } = req.query;
    let query = {};

    if (search) {
      // Search by name or phoneNumber
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { phoneNumber2: { $regex: search, $options: 'i' } },
        ],
      };
    }

    let sortOption = {};
    if (sort) {
      sortOption[sort] = 1; // Ascending order
    }

    const customers = await Customer.find(query).sort(sortOption);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    const user = await User.findById(req.user);
    const systemSetting = await SystemSetting.findOne();

    res.render('customer/index', { customers,role: user.role, systemSetting });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET /customer/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /customer (Create new customer)
router.post('/', async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /customer/:id (Update customer)
router.put('/', async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.body.customerId,
      req.body,
      { new: true }
    );
    if (!updatedCustomer)
      return res.status(404).json({ error: 'Customer not found' });
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /customer/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer)
      return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;


