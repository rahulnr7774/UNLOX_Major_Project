const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Client = require('../models/Client');

async function getAnalytics(req, res) {
  const therapist_id = req.therapist._id;
  const [revenue, sessions, clients, monthlyRevenue] = await Promise.all([
    Payment.aggregate([{ $match: { therapist_id, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' }, net: { $sum: '$net_amount' }, count: { $sum: 1 } } }]),
    Session.aggregate([{ $match: { therapist_id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Client.countDocuments({ therapist_id, status: 'active' }),
    Payment.aggregate([{ $match: { therapist_id, status: 'paid' } }, { $group: { _id: { year: { $year: '$paid_at' }, month: { $month: '$paid_at' } }, total: { $sum: '$net_amount' } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }])
  ]);
  return res.status(200).json({ revenue: revenue[0] || { total: 0, net: 0, count: 0 }, sessions, clients, monthlyRevenue });
}

module.exports = { getAnalytics };
