const router = require('express').Router();
router.use('/admin', require('./users'));
router.use('/', require('./routes'));
router.use('/food', require('./food'));
router.use('/cashier', require('./cashier'));
router.use('/table', require('./table'));
router.use('/storge', require('./storge'));
router.use('/delevery', require('./delevery'));
router.use('/purchases', require('./purchases'));
router.use('/invoice', require('./invoice'));
router.use('/dashboard', require('./dashboard'));
router.use('/setting', require('./setting'));

module.exports = router;
