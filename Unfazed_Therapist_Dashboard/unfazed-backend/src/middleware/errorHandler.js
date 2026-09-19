function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (error.code === 11000 ? 409 : error.name === 'ValidationError' ? 400 : 500);
  if (statusCode >= 500) console.error(error);
  const message = statusCode >= 500
    ? 'Unable to complete this request right now. Please try again later.'
    : error.code === 11000
    ? 'That therapist profile slug is already in use. Please try another name.'
    : error.message || 'Internal server error';
  res.status(statusCode).json({ message });
}

module.exports = { notFound, errorHandler };
