const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

async function protectClient(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'client') return res.status(403).json({ message: 'Client access required' });

    req.client = await Client.findById(payload.id).select('-password_hash');
    if (!req.client) return res.status(401).json({ message: 'Client account not found' });
    next();
  } catch (error) {
    next(error.name === 'JsonWebTokenError' ? Object.assign(new Error('Invalid token'), { statusCode: 401 }) : error);
  }
}

module.exports = { protectClient };