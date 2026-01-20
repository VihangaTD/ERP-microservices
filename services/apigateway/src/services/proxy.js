const axios = require('axios');

const proxyRequest = async (req, res, serviceUrl) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${serviceUrl}${req.originalUrl}`,
      headers: {
        authorization: req.headers.authorization || '',
      },
      data: req.body,
      params: req.query,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Service error',
      });
    }

    res.status(500).json({ message: 'Service unavailable' });
  }
};

module.exports = proxyRequest;
