module.exports = (err, req, res, next) => {
  console.error(err.message);

  res.status(err.status || 500).json({
    message: 'Something went wrong',
  });
};
