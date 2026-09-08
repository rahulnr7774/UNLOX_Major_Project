const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Client = require('../models/Client');
const { canAccess } = require('../services/entitlementService');

async function getAnalytics(req, res) {
  const therapist_id = req.therapist._id;
  const advanced = await canAccess(therapist_id, 'advanced_analytics');
  const [revenue, sessions, activeClients, revenueTrend] = await Promise.all([
    Payment.aggregate([{ $match: { therapist_id, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' }, net: { $sum: '$net_amount' }, count: { $sum: 1 } } }]),
    Session.aggregate([{ $match: { therapist_id } }, { $group: { _id: null, total: { $sum: 1 }, noShows: { $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] } } } }, { $project: { _id: 0, total: 1, noShows: 1, noShowRate: { $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$noShows', '$total'] }, 100] }, 0] } } }]),
    Client.aggregate([{ $match: { therapist_id, status: 'active' } }, { $count: 'count' }]),
    Payment.aggregate([{ $match: { therapist_id, status: 'paid', paid_at: { $ne: null } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paid_at' } }, revenue: { $sum: '$net_amount' }, payments: { $sum: 1 } } }, { $sort: { _id: 1 } }])
  ]);
  return res.status(200).json({ revenue: revenue[0] || { total: 0, net: 0, count: 0 }, activeClients: activeClients[0]?.count || 0, noShowRate: sessions[0]?.noShowRate || 0, revenueTrend, advancedAnalytics: advanced });
}

module.exports = { getAnalytics };
