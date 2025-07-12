const mongoose = require('mongoose');

const PoemSchema = mongoose.Schema({
    title: { type: String, required:true },
    image: { type: String, required:true },
    description: { type: String, required:true },
    category: { type: String, required:true },
    url: { type: String, required:true },
    is_active: { type: Boolean, default: true, index: true },
    },
    {
        timestamps: true,
    });

module.exports = mongoose.model('poem', PoemSchema);