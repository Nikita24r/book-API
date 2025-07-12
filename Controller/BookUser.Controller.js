const createError = require('http-errors')
const Model = require('../Models/BookUser.Model.js')
const mongoose = require('mongoose')
const ModelName = 'book-user'

module.exports = {
  create: async (req, res, next) => {
    try {
      const data = req.body
      
      // Validate required fields
      if (!data.name || !data.age || !data.contact || !data.city || !data.email) {
        throw createError.BadRequest('Missing required fields: name, age, contact, city, email')
      }

      // Validate name
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw createError.BadRequest('Name is required');
      }

      // Validate that name contains only alphabets and spaces
      const nameRegex = /^[A-Za-z\s]+$/;
      if (!nameRegex.test(data.name.trim())) {
        throw createError.BadRequest('Name must contain only alphabets and spaces');
      }

      // Validate age is a number
      if (isNaN(data.age) || data.age < 1 || data.age > 150) {
        throw createError.BadRequest('Age must be a valid number between 1 and 150')
      }

      // Validate contact is a number
      const contactPattern = /^[0-9]{10}$/;
      if (!contactPattern.test(data.contact)) {
        throw createError.BadRequest('Contact must be a valid 10-digit number');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw createError.BadRequest('Please provide a valid email address')
      }

      // Check if email already exists
      const existingUser = await Model.findOne({ email: data.email, is_active: true })
      if (existingUser) {
        throw createError.Conflict('User with this email already exists')
      }

      // Set metadata (only if user is authenticated, otherwise set defaults)
      data.created_by = req.user ? req.user._id : 'app_user'
      data.updated_by = req.user ? req.user._id : 'app_user'
      data.created_at = Date.now()
      data.updated_at = Date.now()
      
      const newData = new Model(data)
      const result = await newData.save()
      
      // Return success response with user data
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: result
      })
    } catch (error) {
      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message)
        return next(createError.BadRequest(`Validation Error: ${validationErrors.join(', ')}`))
      }
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0]
        return next(createError.Conflict(`${field} already exists`))
      }
      
      next(error)
    }
  },

  get: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createError.BadRequest('Invalid or missing ID')
      }
      const result = await Model.findById(id)
      if (!result) {
        throw createError.NotFound(`No ${ModelName} Found`)
      }
      res.send({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  },

  list: async (req, res, next) => {
    try {
      const { name, page, limit, sort } = req.query
      const _page = page ? parseInt(page) : 1
      const _limit = limit ? parseInt(limit) : 20
      const _skip = (_page - 1) * _limit
      const _sort = sort ? sort : '+name'
      const query = {}

      if (name) {
        query.name = new RegExp(name, 'i')
      }
      query.is_active = true

      const result = await Model.aggregate([
        { $match: query },
        { $skip: _skip },
        { $limit: _limit },
        { $sort: { name: 1 } }
      ])

      // Get total count for pagination
      const total = await Model.countDocuments(query)

      res.json({
        success: true,
        data: result,
        pagination: {
          page: _page,
          limit: _limit,
          total: total,
          pages: Math.ceil(total / _limit)
        }
      })
    } catch (error) {
      next(error)
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params
      const data = req.body

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createError.BadRequest('Invalid or missing ID')
      }
      if (!data || Object.keys(data).length === 0) {
        throw createError.BadRequest('No update data provided')
      }

      // Validate fields if they are being updated
      if (data.age && (isNaN(data.age) || data.age < 1 || data.age > 150)) {
        throw createError.BadRequest('Age must be a valid number between 1 and 150')
      }

      if (data.contact && isNaN(data.contact)) {
        throw createError.BadRequest('Contact must be a valid number')
      }

      if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
          throw createError.BadRequest('Please provide a valid email address')
        }

        // Check if email already exists for other users
        const existingUser = await Model.findOne({ 
          email: data.email, 
          is_active: true, 
          _id: { $ne: id } 
        })
        if (existingUser) {
          throw createError.Conflict('User with this email already exists')
        }
      }

      data.updated_at = Date.now()
      data.updated_by = req.user ? req.user._id : 'app_user'
      
      const result = await Model.updateOne({ _id: id }, { $set: data })
      
      if (result.matchedCount === 0) {
        throw createError.NotFound(`No ${ModelName} found with ID: ${id}`)
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        result: result
      })
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0]
        return next(createError.Conflict(`${field} already exists`))
      }
      next(error)
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createError.BadRequest('Invalid or missing ID')
      }
      
      const deleted_at = Date.now()
      const deleted_by = req.user ? req.user._id : 'app_user'
      
      const result = await Model.updateOne(
        { _id: id }, 
        { 
          $set: { 
            is_active: false, 
            deleted_at,
            deleted_by,
            updated_at: deleted_at
          } 
        }
      )
      
      if (result.matchedCount === 0) {
        throw createError.NotFound(`No ${ModelName} found with ID: ${id}`)
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
        result: result
      })
    } catch (error) {
      next(error)
    }
  },

  restore: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createError.BadRequest('Invalid or missing ID')
      }
      
      const dataToBeRestored = await Model.findOne({ _id: id, is_active: false }).lean()
      if (!dataToBeRestored) {
        throw createError.NotFound(`${ModelName} Not Found or Already Active`)
      }
      
      const restored_at = Date.now()
      const restored_by = req.user ? req.user._id : 'app_user'
      
      const result = await Model.updateOne(
        { _id: id }, 
        { 
          $set: { 
            is_active: true, 
            restored_at,
            restored_by,
            updated_at: restored_at
          } 
        }
      )
      
      res.json({ 
        success: true, 
        message: `${ModelName} restored successfully`, 
        result 
      })
    } catch (error) {
      next(error)
    }
  }
}