const User = require("../models/user");


exports.userlogin = (req,res,next) => {
    if(req.isAuthenticated()) {
        console.log(req.user)
    return next();
    }
    req.flash('error_msg' , 'please login to view this resource');
    res.redirect('/admin/login');
    }
    
exports.isfulladmin = async(req,res,next) => {
    try{
        user=await User.findById(req.user.id)
        console.log(user.id)
        if(user.role == "full"){
        return next();    
        }
        else{
        res.redirect('/admin/dashboard');
        }
    }catch(err){
        console.error(err);
        res.render('login')
    }
}
    
exports.iscoadmin =async (req,res,next) => {
    try{
        user=await User.findById(req.user.id)
        console.log(user.id)
        if(user.role == "assistant" || user.role == "full" ){
        return next();    
        }
        else{
        res.redirect('/admin/dashboard');
        }
    }catch(err){
        console.error(err);
        res.render('login')
    }
}

exports.iswrieradmin =async (req,res,next) => {
    try{
        user=await User.findById(req.user.id)
        console.log(user.id)
        if(user.role == "Writer" || user.role == "assistant" || user.role == "full" ){
        return next();    
        }
        else{
        res.redirect('/admin/dashboard');
        }
    }catch(err){
        console.error(err);
        res.render('login')
    }
}

exports.isfacebookadmin =async (req,res,next) => {
    try{
        user=await User.findById(req.user.id)
        console.log(user.id)
        if(user.role == "facebook" || user.role == "Writer" || user.role == "assistant" || user.role == "full"){
        return next();    
        }
        else{
        res.redirect('/admin/dashboard');
        }
    }catch(err){
        console.error(err);
        res.render('login')
    }
}

exports.isposteradmin =async (req,res,next) => {
    try{
        user=await User.findById(req.user.id)
        console.log(user.id)
        if(user.role == "poster" || user.role == "Writer" || user.role == "assistant" || user.role == "full"){
        return next();    
        }
        else{
        res.redirect('/admin/dashboard');
        }
    }catch(err){
        console.error(err);
        res.render('login')
    }
}