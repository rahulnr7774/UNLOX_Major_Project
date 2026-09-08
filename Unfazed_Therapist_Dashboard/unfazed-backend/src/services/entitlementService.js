const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');

async function canAccess(therapistId, featureKey) {
  const therapist = await Therapist.findById(therapistId).select('subscription_tier');
  if (!therapist) return false;

  const tier = await SubscriptionTierConfig.findOne({ tier_name: therapist.subscription_tier, active: true });
  if (!tier) return false;
  if (featureKey === 'active_clients') {
    const cap = tier.caps?.active_clients;
    if (cap === null || cap === undefined) return true;
    return (await Client.countDocuments({ therapist_id: therapistId, status: 'active' })) < cap;
  }
  return tier.feature_flags?.[featureKey] === true;
}

module.exports = { canAccess };
