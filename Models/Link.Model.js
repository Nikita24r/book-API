const mongoose = require('mongoose')

const LinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  link: { type: String, required: true },
  is_active: { type: Boolean, default: true },
},
{
    timestamps: true,
});

module.exports = mongoose.model('Link', LinkSchema)
