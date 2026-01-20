const Product = require('../models/Product');
const StockLog = require('../models/StockLog');

class StockManager {

  static async updateStock(productId, quantity, changeType, userId, companyId, reason = '') {
    const session = await Product.startSession();
    session.startTransaction();

    try {
      // Get current product with lock
      const product = await Product.findById(productId).session(session);
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.companyId !== companyId) {
        throw new Error('Unauthorized: Product belongs to different company');
      }

      const previousStock = product.currentStock;
      let newStock;

      if (changeType === 'increase') {
        newStock = previousStock + quantity;
      } else if (changeType === 'decrease') {
        newStock = previousStock - quantity;
        
        if (newStock < 0) {
          throw new Error('Insufficient stock: Cannot reduce stock below zero');
        }
      } else {
        throw new Error('Invalid change type');
      }

      // Update product stock
      product.currentStock = newStock;
      await product.save({ session });

      // Create stock log entry
      await StockLog.create([{
        productId: product._id,
        companyId,
        changeType,
        quantity,
        previousStock,
        newStock,
        reason,
        performedBy: userId
      }], { session });

      await session.commitTransaction();
      
      return {
        product,
        previousStock,
        newStock,
        change: quantity
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  //Get stock history for a product
   
  static async getStockHistory(productId, companyId, limit = 50) {
    const logs = await StockLog.find({ 
      productId, 
      companyId 
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return logs;
  }
}

module.exports = StockManager;