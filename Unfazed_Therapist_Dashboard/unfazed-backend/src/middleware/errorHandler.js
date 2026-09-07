function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ message: error.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };
