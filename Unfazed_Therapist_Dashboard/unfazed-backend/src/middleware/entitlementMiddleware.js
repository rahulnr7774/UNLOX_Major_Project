const entitlementService = require('../services/entitlementService');

function requireFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const allowed = await entitlementService.canAccess(req.therapist._id, featureKey);
      if (!allowed) return res.status(403).json({ message: 'This feature is not included in your subscription', featureKey });
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { requireFeature };
