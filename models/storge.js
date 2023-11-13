const mongoose = require('mongoose');
const storgeSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    
}, {
    timestamps: true
});
const storge = mongoose.model('storge', storgeSchema);

module.exports = storge;
