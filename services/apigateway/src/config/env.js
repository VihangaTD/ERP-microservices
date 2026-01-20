require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  authServiceUrl: process.env.AUTH_SERVICE_URL,
  productServiceUrl: process.env.PRODUCT_SERVICE_URL,
};
