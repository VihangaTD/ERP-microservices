const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const errorMiddleware = require('./middleware/error');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/services', async (req, res) => {
  const axios = require('axios');
  
  const services = {
    authService: process.env.AUTH_SERVICE_URL,
    productService: process.env.PRODUCT_SERVICE_URL
  };

  const healthChecks = {};

  for (const [name, url] of Object.entries(services)) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      healthChecks[name] = {
        status: 'healthy',
        url,
        response: response.data
      };
    } catch (error) {
      healthChecks[name] = {
        status: 'unhealthy',
        url,
        error: error.message
      };
    }
  }

  const allHealthy = Object.values(healthChecks).every(check => check.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    gateway: 'healthy',
    services: healthChecks,
    timestamp: new Date().toISOString()
  });
});



app.use(authRoutes);
app.use(productRoutes);


app.use(errorMiddleware);

module.exports = app;