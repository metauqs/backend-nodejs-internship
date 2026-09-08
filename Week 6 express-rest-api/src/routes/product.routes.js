const express = require('express');
const controller = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const {
  idParam,
  createProduct,
  replaceProduct,
  updateProduct,
  listQuery,
} = require('../validations/product.validation');

const router = express.Router();

router
  .route('/')
  .get(validate({ query: listQuery }), controller.listProducts)
  .post(validate({ body: createProduct }), controller.createProduct);

router
  .route('/:id')
  .get(validate({ params: idParam }), controller.getProduct)
  .put(validate({ params: idParam, body: replaceProduct }), controller.replaceProduct)
  .patch(validate({ params: idParam, body: updateProduct }), controller.updateProduct)
  .delete(validate({ params: idParam }), controller.deleteProduct);

module.exports = router;
