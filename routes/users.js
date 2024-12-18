//users.js in routes/users.js
const express = require('express');
const router = express.Router();
const User = require("../models/user");

const passport = require('passport');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');

uploadDir = 'public/img/webimage'
const bcrypt = require('bcrypt');

const MAX_SIZE = 500 * 1024; // 500 kilobytes

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/webimage/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage: storage });


router.get('/login', (req, res) => {
  res.render('login');
})
router.get('/register', (req, res) => {
  res.render('register')
})

// routes/users.js
const jwt = require('jsonwebtoken');

// Unified Login Route (Not Recommended Due to Complexity)
router.post('/login', (req, res, next) => {
  const isApiClient = req.headers['x-client-type'] === 'mobile';
  console.log(req.headers)
  passport.authenticate('local', { session: !isApiClient }, (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      return res.status(400).json({ message: info ? info.message : 'Login failed' });
    }

    if (isApiClient) {
      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, 'your_jwt_secret', { expiresIn: '9999h' });
      return res.json({ token });
    } else {
      // Establish session
      req.login(user, (err) => {
        if (err) { return next(err); }
        return res.redirect('/cashier');
      });
    }
  })(req, res, next);
});

//register post handle


router.post('/register', async (req, res) => {
  const { name, email, password, password2, role, serialNumber } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2 || !serialNumber) {
    errors.push({ msg: "Please fill in all fields" });
  }

  if (password !== password2) {
    errors.push({ msg: "Passwords don't match" });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  } else {
    try {
      // Token validation check
      const tokenResponse = await axios.post(`http://95.179.178.183:4000/checkToken`, {
        token: serialNumber,
      });
      if (!tokenResponse.data.valid) {
        return res.status(400).json({ msg: "التوكين غير صالح او منتهي الصلاحية" });
      }

      const user = await User.findOne({ email: email });

      if (user) {
        errors.push({ msg: 'Email already registered' });
        return res.status(409).json({ errors });
      }

      // Calculate future expiration date based on token validity
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + tokenResponse.data.dayNum);

      // Creating new user object with hashed password
      const newUser = new User({
        name,
        email,
        password,
        role: "full",
        expireDate: futureDate, // Added expireDate from the token response
      });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newUser.password, salt);
      newUser.password = hash;

      await newUser.save();

      req.flash('success_msg', 'You have now registered!');
      return res.redirect('/admin/login');
    } catch (err) {
      console.error("Error making POST request:", err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
  }
});

router.get('/verify-token', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ valid: false });
    } else {
      return res.status(200).json({ valid: true });
    }
  });
});


//logout
router.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});




module.exports = router;
