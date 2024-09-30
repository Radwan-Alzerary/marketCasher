const router = require("express").Router();
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;

router.use("/admin", require("./users"));
router.use("/", require("./routes"));
router.use("/food",ensureAuthenticated, require("./food"));
router.use("/cashier",ensureAuthenticated, require("./cashier"));
router.use("/table", ensureAuthenticated, require("./table"));
router.use("/storge",ensureAuthenticated, require("./storge"));
router.use("/delevery",ensureAuthenticated, require("./delevery"));
router.use("/purchases", ensureAuthenticated, require("./purchases"));
router.use("/invoice",ensureAuthenticated, require("./invoice"));
router.use("/dashboard",ensureAuthenticated, require("./dashboard"));
router.use("/custemer", ensureAuthenticated, require("./custemer"));
router.use("/debt", ensureAuthenticated, require("./debt"));
router.use("/setting", ensureAuthenticated, require("./setting"));
router.use("/devices",ensureAuthenticated, require("./devices"));

module.exports = router;
