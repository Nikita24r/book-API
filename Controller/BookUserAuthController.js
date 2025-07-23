const createError = require('http-errors');
const BookUser = require('../Models/BookUser.Model');
const {
  signAccessToken,
  signRefreshToken
} = require('../helpers/jwt_helpers');

module.exports = {

  register: async (req, res, next) => {
    try {
      const { name, age, contact, city, email, password } = req.body;

      if (!name || !age || !contact || !city || !email || !password) {
        throw createError.BadRequest('All fields are required');
      }

      const existing = await BookUser.findOne({ email });
      if (existing) throw createError.Conflict('Email already registered');

      const newUser = new BookUser({
        name,
        age,
        contact,
        city,
        email,
        password,
        created_by: 'self',
        updated_by: 'self'
      });

      const savedUser = await newUser.save();

      // const accessToken = await signAccessToken(savedUser._id);
      // const refreshToken = await signRefreshToken(savedUser._id);

      res.status(201).send({
        success: true,
        message: 'User registered successfully',
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email
        }
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw createError.BadRequest('Email and password are required');
      }

      const user = await BookUser.findOne({ email, is_active: true }).select('+password');
      if (!user) throw createError.NotFound('User not found');

      console.log(user._id.toString());

      const isMatch = await user.isValidPassword(password);
      if (!isMatch) throw createError.Unauthorized('Invalid credentials');

      const accessToken = await signAccessToken(user._id.toString());
      const refreshToken = await signRefreshToken(user._id.toString());

      res.send({
        success: true,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      throw createError.BadRequest('Email and new password are required');
    }

    const user = await BookUser.findOne({ email, is_active: true });
    if (!user) {
      throw createError.NotFound('User not found');
    }

    // Hash the new password
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.updated_at = Date.now();
    user.updated_by = 'self';

    await user.save();

    res.send({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
}

};
