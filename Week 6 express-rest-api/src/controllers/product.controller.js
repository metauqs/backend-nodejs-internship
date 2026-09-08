const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');


const listProducts = asyncHandler(async (req, res) => {
  const products = productService.getAll(req.query);
  res.status(200).json({ success: true, count: products.length, data: products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = productService.getById(req.params.id);
  res.status(200).json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = productService.create(req.body);
  res.status(201).json({ success: true, data: product });
});

const replaceProduct = asyncHandler(async (req, res) => {
  const product = productService.replace(req.params.id, req.body);
  res.status(200).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = productService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  productService.remove(req.params.id);
  res.status(204).send();
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  replaceProduct,
  updateProduct,
  deleteProduct,
};
