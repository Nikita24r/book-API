const createError = require('http-errors')
const Model = require('../Models/Link.Model') // Make sure this model is created
const mongoose = require('mongoose')
const ModelName = 'Link'

module.exports = {
  create: async (req, res, next) => {
    try {
      const data = req.body
      data.created_by = req.user ? req.user._id : 'unauth'
      data.updated_by = req.user ? req.user._id : 'unauth'
      data.created_at = Date.now()
      data.is_active = true

      const newData = new Model(data)
      const result = await newData.save()
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  get: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id) throw createError.BadRequest('Invalid Parameters')

      const result = await Model.findById(mongoose.Types.ObjectId(id))
      if (!result) throw createError.NotFound(`No ${ModelName} Found`)
      
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  },

  list: async (req, res, next) => {
    try {
      const { title, is_active, page, limit, sort } = req.query
      const _page = page ? parseInt(page) : 1
      const _limit = limit ? parseInt(limit) : 20
      const _skip = (_page - 1) * _limit
      const _sort = sort || '+title'

      const query = {}
      if (title) query.title = new RegExp(title, 'i')
      query.is_active = is_active !== undefined ? is_active === 'true' : true

      const result = await Model.aggregate([
        { $match: query },
        { $sort: { title: _sort.startsWith('-') ? -1 : 1 } },
        { $skip: _skip },
        { $limit: _limit }
      ])
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params
      const data = req.body
      if (!id || !data) throw createError.BadRequest('Invalid Parameters')

      data.updated_at = Date.now()
      const result = await Model.updateOne(
        { _id: mongoose.Types.ObjectId(id) },
        { $set: data }
      )
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id) throw createError.BadRequest('Invalid Parameters')

      const deleted_at = Date.now()
      const result = await Model.updateOne(
        { _id: mongoose.Types.ObjectId(id) },
        { $set: { is_active: false, deleted_at } }
      )
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  restore: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id) throw createError.BadRequest('Invalid Parameters')

      const dataToBeRestored = await Model.findOne(
        { _id: mongoose.Types.ObjectId(id) },
        { title: 1 }
      ).lean()

      if (!dataToBeRestored) throw createError.NotFound(`${ModelName} Not Found`)

      const existing = await Model.findOne({
        title: dataToBeRestored.title,
        is_active: true
      }).lean()

      if (existing) throw createError.Conflict(`${ModelName} already exists`)

      const restored_at = Date.now()
      const result = await Model.updateOne(
        { _id: mongoose.Types.ObjectId(id) },
        { $set: { is_active: true, restored_at } }
      )
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
}
