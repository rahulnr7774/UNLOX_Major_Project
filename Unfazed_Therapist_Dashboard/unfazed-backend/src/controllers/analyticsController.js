const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Client = require('../models/Client');
const { canAccess } = require('../services/entitlementService');

function periodConfig(period) {
  const now = new Date();
  if (period === 'year') {
    return { format: '%Y', start: new Date(now.getFullYear() - 4, 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
  }
  if (period === 'month') {
    return { format: '%Y-%m', start: new Date(now.getFullYear(), now.getMonth() - 11, 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { format: '%Y-%m-%d', start, end };
}

async function getAnalytics(req, res) {
  const therapist_id = req.therapist._id;
  const advanced = await canAccess(therapist_id, 'advanced_analytics');
  const period = ['week', 'month', 'year'].includes(req.query.period) ? req.query.period : 'month';
  const config = periodConfig(period);
  const [revenue, sessions, activeClients, revenueTrend, sessionBuckets, paymentBuckets] = await Promise.all([
    Payment.aggregate([{ $match: { therapist_id, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' }, net: { $sum: '$net_amount' }, count: { $sum: 1 } } }]),
    Session.aggregate([{ $match: { therapist_id } }, { $group: { _id: null, total: { $sum: 1 }, noShows: { $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] } } } }, { $project: { _id: 0, total: 1, noShows: 1, noShowRate: { $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$noShows', '$total'] }, 100] }, 0] } } }]),
    Client.aggregate([{ $match: { therapist_id, status: 'active' } }, { $count: 'count' }]),
    Payment.aggregate([{ $match: { therapist_id, status: 'paid', paid_at: { $ne: null } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paid_at' } }, revenue: { $sum: '$net_amount' }, payments: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Session.aggregate([
      { $match: { therapist_id, starts_at: { $gte: config.start, $lt: config.end } } },
      { $group: { _id: { bucket: { $dateToString: { format: config.format, date: '$starts_at' } }, status: '$status' }, count: { $sum: 1 }, clients: { $addToSet: '$client_id' } } },
      { $sort: { '_id.bucket': 1 } }
    ]),
    Payment.aggregate([
      { $match: { therapist_id, status: 'paid', paid_at: { $gte: config.start, $lt: config.end } } },
      { $group: { _id: { $dateToString: { format: config.format, date: '$paid_at' } }, revenue: { $sum: '$net_amount' }, payments: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  const buckets = new Map();
  sessionBuckets.forEach((item) => {
    const bucket = item._id.bucket;
    const current = buckets.get(bucket) || { _id: bucket, bookedSessions: 0, successfulSessions: 0, clientsVisited: new Set(), noShows: 0, cancelledSessions: 0, revenue: 0, payments: 0 };
    if (!['cancelled', 'no_show'].includes(item._id.status)) current.bookedSessions += item.count;
    if (item._id.status === 'completed') current.successfulSessions += item.count;
    if (item._id.status === 'no_show') current.noShows += item.count;
    if (item._id.status === 'cancelled') current.cancelledSessions += item.count;
    item.clients.forEach((clientId) => { if (item._id.status === 'completed') current.clientsVisited.add(String(clientId)); });
    buckets.set(bucket, current);
  });
  paymentBuckets.forEach((item) => {
    const current = buckets.get(item._id) || { _id: item._id, bookedSessions: 0, successfulSessions: 0, clientsVisited: new Set(), noShows: 0, cancelledSessions: 0, revenue: 0, payments: 0 };
    current.revenue = item.revenue;
    current.payments = item.payments;
    buckets.set(item._id, current);
  });
  const timeline = [...buckets.values()].sort((left, right) => left._id.localeCompare(right._id)).map((item) => ({ ...item, clientsVisited: item.clientsVisited.size }));

  return res.status(200).json({
    revenue: revenue[0] || { total: 0, net: 0, count: 0 },
    activeClients: activeClients[0]?.count || 0,
    noShowRate: sessions[0]?.noShowRate || 0,
    revenueTrend,
    period,
    timeline,
    advancedAnalytics: advanced
  });
}

module.exports = { getAnalytics };
