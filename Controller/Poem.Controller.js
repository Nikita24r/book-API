const createError = require('http-errors')
const Model = require('../Models/Poem.Model.js')
const mongoose = require('mongoose')
const ModelName = 'poem'

module.exports = {

  create: async (req, res, next) => {
    try {
      const data = req.body
      const newData = new Model(data)
      const result = await newData.save()
      res.json(newData)
    } catch (error) {
      next(error)
    }
  },

  get: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id) {
        throw createError.BadRequest('Invalid Parameters')
      }
      const result = await Model.findById({ _id: new mongoose.Types.ObjectId(id) })
      if (!result) {
        throw createError.NotFound(`No ${ModelName} Found`)
      }
      res.send({
        success: true, data: result,
      })
      return
    } catch (error) {
      next(error)
    }
  },

  publicGet: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id) {
        throw createError.BadRequest('Invalid Parameters')
      }
      const result = await Model.findOne({ 
        _id: new mongoose.Types.ObjectId(id),
        is_active: true 
      })
      
      if (!result) {
        throw createError.NotFound(`No ${ModelName} Found`)
      }
      
      res.send({
        success: true, 
        data: result
      })
    } catch (error) {
      next(error)
    }
  },

  list: async (req, res, next) => {
    try {
      const { name, page, limit } = req.query
      const _page = page ? parseInt(page) : 1
      const _limit = limit ? parseInt(limit) : 20
      const _skip = (_page - 1) * _limit
      
      const query = { is_active: true };
      if (name) {
        query.title = new RegExp(name, 'i')
      }
      
      const result = await Model.find(query)
        .skip(_skip)
        .limit(_limit)
      
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  publicList: async (req, res, next) => {
    try {
      const { name, page, limit } = req.query
      const _page = page ? parseInt(page) : 1
      const _limit = limit ? parseInt(limit) : 20
      const _skip = (_page - 1) * _limit
      
      const query = { is_active: true };
      if (name) {
        query.title = new RegExp(name, 'i')
      }
      
      const result = await Model.find(query)
        .skip(_skip)
        .limit(_limit)
      
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params
      const data = req.body

      if (!id) {
        throw createError.BadRequest('Invalid Parameters')
      }
      if (!data) {
        throw createError.BadRequest('Invalid Parameters')
      }
      data.updated_at = Date.now()
      const result = await Model.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: data })
      res.json(result)
      return
    } catch (error) {
      next(error)
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id) {
        throw createError.BadRequest('Invalid Parameters')
      }
      const deleted_at = Date.now()
      const result = await Model.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { is_active: false, deleted_at } })
      res.json(result)
      return
    } catch (error) {
      next(error)
    }
  },

  restore: async (req, res, next) => {
    try {
      const { id } = req.params
      if (!id) {
        throw createError.BadRequest('Invalid Parameters')
      }
      const dataToBeDeleted = await Model.findOne({ _id: new mongoose.Types.ObjectId(id) }, { name: 1 }).lean()
      if (!dataToBeDeleted) {
        throw createError.NotFound(`${ModelName} Not Found`)
      }
      const dataExists = await Model.findOne({ name: dataToBeDeleted.name, is_active: false }).lean()
      if (dataExists) {
        throw createError.Conflict(`${ModelName} already exists`)
      }
      const restored_at = Date.now()
      const result = await Model.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: { is_active: false, restored_at } })
      res.json(result)
      return
    } catch (error) {
      next(error)
    }
  },
  
}