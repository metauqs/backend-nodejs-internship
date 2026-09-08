const Joi = require('joi');

const idParam = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'id must be a valid UUID',
  }),
});

const createProduct = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  price: Joi.number().positive().precision(2).required(),
  quantity: Joi.number().integer().min(0).required(),
  category: Joi.string().trim().min(2).max(50).optional(),
});

// PUT: full replace, all fields required except category
const replaceProduct = createProduct;

// PATCH: partial update, at least one field required
const updateProduct = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  price: Joi.number().positive().precision(2),
  quantity: Joi.number().integer().min(0),
  category: Joi.string().trim().min(2).max(50),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided to update' });

const listQuery = Joi.object({
  category: Joi.string().trim().min(1).max(50).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
});

module.exports = { idParam, createProduct, replaceProduct, updateProduct, listQuery };
