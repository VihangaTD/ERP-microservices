const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const StockManager = require('../utils/stockManager');
const { validationResult } = require('express-validator');

// Create product
exports.createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, sku, price, initialStock = 0, category } = req.body;
    const { user_id, company_id } = req.user;

    // Check if SKU already exists for this company
    const existingProduct = await Product.findOne({ sku, companyId: company_id });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists in your company'
      });
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      sku: sku.toUpperCase(),
      price,
      currentStock: initialStock,
      category,
      companyId: company_id,
      createdBy: user_id
    });

    if (initialStock > 0) {
      await StockLog.create({
        productId: product._id,
        companyId: company_id,
        changeType: 'initial',
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        reason: 'Initial stock',
        performedBy: user_id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// Get all products for company
exports.getProducts = async (req, res, next) => {
  try {
    const { company_id } = req.user;
    const { page = 1, limit = 10, search = '', category = '', isActive = 'true' } = req.query;

    const query = { companyId: company_id };
    
    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update stock
exports.updateStock = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId, quantity, changeType, reason } = req.body;
    const { user_id, company_id } = req.user;

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than zero'
      });
    }

    const result = await StockManager.updateStock(
      productId,
      quantity,
      changeType,
      user_id,
      company_id,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        productId: result.product._id,
        productName: result.product.name,
        sku: result.product.sku,
        previousStock: result.previousStock,
        newStock: result.newStock,
        change: result.change,
        changeType
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get stock history 
exports.getStockHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { company_id } = req.user;
    const { limit = 50 } = req.query;

    const history = await StockManager.getStockHistory(productId, company_id, parseInt(limit));

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};