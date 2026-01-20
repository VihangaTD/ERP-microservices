const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Product routes
router.post('/', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('price').isNumeric().withMessage('Price must be a number').custom(value => value >= 0).withMessage('Price cannot be negative'),
  body('initialStock').optional().isInt({ min: 0 }).withMessage('Initial stock must be non-negative')
], productController.createProduct);

router.get('/', productController.getProducts);

// Stock routes
router.post('/update', [
  body('productId').trim().notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('changeType').isIn(['increase', 'decrease']).withMessage('Change type must be increase or decrease'),
  body('reason').optional().trim()
], productController.updateStock);

// Stock history
router.get('/:productId/history', productController.getStockHistory);

module.exports = router;