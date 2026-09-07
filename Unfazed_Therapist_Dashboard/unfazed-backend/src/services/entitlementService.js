const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Therapist = require('../models/Therapist');

async function canAccess(therapistId, featureKey) {
  const therapist = await Therapist.findById(therapistId).select('subscription_tier');
  if (!therapist) return false;

  const tier = await SubscriptionTierConfig.findOne({ tier_name: therapist.subscription_tier, active: true });
  return Boolean(tier && tier.feature_flags && tier.feature_flags[featureKey] === true);
}

module.exports = { canAccess };
