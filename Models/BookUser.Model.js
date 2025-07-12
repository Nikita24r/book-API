const mongoose = require('mongoose');

const BookUserSchema = mongoose.Schema({
    name: { type: String, required:true },
    age: { type: Number, required:true },
    contact: { type: Number, required:true },
    city: { type: String, required:true },
    email: { type: String, required:true },
    is_active: { type: Boolean, default: true, index: true },
    },
    {
        timestamps: true,
    });

module.exports = mongoose.model('book-user', BookUserSchema);