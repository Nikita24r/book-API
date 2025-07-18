const createError = require('http-errors');
const mongoose = require('mongoose');
const Model = require('../Models/Link.Model');
const ModelName = 'Link';

module.exports = {
  // Create
  create: async (req, res, next) => {
    try {
      const data = req.body;
      data.created_by = req.user?._id || null;
      data.updated_by = req.user?._id || null;
      data.created_at = Date.now();
      data.updated_at = Date.now();
      data.is_active = true;

      const newData = new Model(data);
      const result = await newData.save();

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Get by ID
  get: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError.BadRequest('Invalid ID');
      }

      const result = await Model.findById(id);
      if (!result) {
        throw createError.NotFound(`${ModelName} not found`);
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // List (with filtering & pagination)
  list: async (req, res, next) => {
    try {
      const { title, is_active = 'true', page = 1, limit = 20, sort = '+title' } = req.query;

      const _page = parseInt(page);
      const _limit = parseInt(limit);
      const _skip = (_page - 1) * _limit;
      const _sortField = sort.replace(/^[-+]/, '');
      const _sortOrder = sort.startsWith('-') ? -1 : 1;

      const query = {
        is_active: is_active === 'true'
      };

      if (title) {
        query.title = new RegExp(title, 'i');
      }

      const result = await Model.find(query)
        .sort({ [_sortField]: _sortOrder })
        .skip(_skip)
        .limit(_limit);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Update
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError.BadRequest('Invalid ID');
      }

      data.updated_by = req.user?._id || null;
      data.updated_at = Date.now();

      const result = await Model.updateOne({ _id: id }, { $set: data });

      res.json({ success: true, result });
    } catch (error) {
      next(error);
    }
  },

  // Soft Delete
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError.BadRequest('Invalid ID');
      }

      const result = await Model.updateOne(
        { _id: id },
        {
          $set: {
            is_active: false,
            deleted_at: Date.now(),
            updated_by: req.user?._id || null
          }
        }
      );

      res.json({ success: true, message: `${ModelName} soft-deleted`, result });
    } catch (error) {
      next(error);
    }
  },

  // Restore
  restore: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError.BadRequest('Invalid ID');
      }

      const existing = await Model.findById(id);
      if (!existing) {
        throw createError.NotFound(`${ModelName} not found`);
      }

      if (existing.is_active) {
        throw createError.Conflict(`${ModelName} is already active`);
      }

      const result = await Model.updateOne(
        { _id: id },
        {
          $set: {
            is_active: true,
            restored_at: Date.now(),
            updated_by: req.user?._id || null
          }
        }
      );

      res.json({ success: true, message: `${ModelName} restored`, result });
    } catch (error) {
      next(error);
    }
  }
};
