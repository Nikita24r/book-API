const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BookUserSchema = mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  contact: { type: Number, required: true },
  city: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  is_active: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
});

// Password hash middleware
BookUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Add password check method
BookUserSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('book-user', BookUserSchema);
