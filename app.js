const express = require("express");
const path = require("path");

const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const app = express();
const port = process.env.PORT || 3000;
app.use(compression());
app.use(morgan("dev"));
const passport = require("passport");

require("dotenv").config();
require("./config/database");
require("./config/passport")(passport);

require("./models/user");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const paymentType = require("./models/paymentType");
const storge = require("./models/storge");

// const Visitor = require('./models/visitor');

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

//use flash
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const defaultPayment = [{ name: "نقدي" }, { name: "اجل" }];

paymentType
  .countDocuments()
  .then((count) => {
    if (count === 0) {
      // Create default documents using a forEach loop
      defaultPayment.forEach((customerItem, index) => {
        const defaultpaymentType = new paymentType(customerItem);
        defaultpaymentType
          .save()
          .then(() => {
            console.log(`defaultpaymentType ${index + 1} created.`);
          })
          .catch((err) => {
            console.error(
              `Error creating defaultpaymentType ${index + 1}:`,
              err
            );
          });
      });
    }
  })
  .catch((err) => {
    console.error("Error checking Customer collection:", err);
  });

  const defaultStorges = [{ name: "معدات" }, { name: "منتجات" }];
  storge
  .countDocuments()
  .then((count) => {
    if (count === 0) {
      // Create default documents using a forEach loop
      defaultStorges.forEach((customerItem, index) => {
        const defaultStorge = new storge(customerItem);
        defaultStorge
          .save()
          .then(() => {
            console.log(`defaultStorge ${index + 1} created.`);
          })
          .catch((err) => {
            console.error(
              `Error creating defaultStorge ${index + 1}:`,
              err
            );
          });
      });
    }
  })
  .catch((err) => {
    console.error("Error checking Customer collection:", err);
  });


app.use(require("./routes"));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
