const User = require("../models/user");


const jwt = require('jsonwebtoken');

exports.userlogin = (req, res, next) => {
    // Check for JWT token
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
        // Validate JWT token
        jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
            if (err) {
                console.log(err)
                req.flash('error_msg', 'Invalid token. Please log in.');
                return res.redirect('/admin/login');
            } else {

                req.user = decoded.id;

                return next(); // JWT is valid, continue to the next middleware
            }
        });
    } else {
        // If no JWT token, check for local passport authentication
        if (req.isAuthenticated()) {
            return next(); // User is authenticated via local passport, continue to the next middleware
        } else {
            req.flash('error_msg', 'Please login to view this resource');
            res.redirect('/admin/login');
        }
    }
};

exports.isfulladmin = async (req, res, next) => {
    try {
        user = await User.findById(req.user.id)
        if (user.role == "full" || user.role == "onlyPOS") {
            return next();
        }
        else {
            res.redirect('/');
        }
    } catch (err) {
        console.error(err);
        res.render('login')
    }
}

exports.isCashire = async (req, res, next) => {
    try {
        user = await User.findById(req.user.id)
        if (user.role == "cashire") {
            return next();
        }
        else {
            res.redirect('/');
        }
    } catch (err) {
        console.error(err);
        res.render('login')
    }
}
exports.isBuyer = async (req, res, next) => {
    try {
        user = await User.findById(req.user.id)
        if (user.role == "isBuyer") {
            return next();
        }
        else {
            res.redirect('/');
        }
    } catch (err) {
        console.error(err);
        res.render('login')
    }
}




