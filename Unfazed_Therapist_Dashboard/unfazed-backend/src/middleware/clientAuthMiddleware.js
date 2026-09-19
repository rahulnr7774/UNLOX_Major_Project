const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

async function authenticateClient(req, res, next, allowPending = false) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'client') return res.status(403).json({ message: 'Client access required' });

    req.client = await Client.findById(payload.id).select('-password_hash');
    if (!req.client) return res.status(401).json({ message: 'Client account not found' });
    if (!allowPending && req.client.approval_status === 'pending') return res.status(403).json({ message: 'Therapist has not approved your access yet.', approvalPending: true });
    next();
  } catch (error) {
    next(error.name === 'JsonWebTokenError' ? Object.assign(new Error('Invalid token'), { statusCode: 401 }) : error);
  }
}

function protectClient(req, res, next) {
  return authenticateClient(req, res, next);
}

function protectClientStatus(req, res, next) {
  return authenticateClient(req, res, next, true);
}

module.exports = { protectClient, protectClientStatus };