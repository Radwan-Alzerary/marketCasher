const router = require("express").Router();
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;

router.use("/admin", require("./users"));
router.use("/", require("./routes"));
router.use("/food", require("./food"));
router.use("/cashier", require("./cashier"));
router.use("/table", require("./table"));
router.use("/storge",isfulladmin, ensureAuthenticated, require("./storge"));
router.use("/delevery", require("./delevery"));
router.use("/purchases",isfulladmin, ensureAuthenticated, require("./purchases"));
router.use("/invoice", require("./invoice"));
router.use("/dashboard",isfulladmin, ensureAuthenticated, require("./dashboard"));
router.use("/setting",isfulladmin, ensureAuthenticated, require("./setting"));

module.exports = router;
