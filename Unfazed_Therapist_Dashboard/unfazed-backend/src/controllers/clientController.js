const Client = require('../models/Client');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const SessionNote = require('../models/SessionNote');
const { sendNotification } = require('../services/notificationService');
const { sendClientLoginAccess } = require('../services/emailServices');
const { canAccess } = require('../services/entitlementService');

function clientFilter(req) {
  const filter = { therapist_id: req.therapist._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const search = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: search }, { email: search }, { phone: search }];
  }
  return filter;
}

async function listClients(req, res) {
  const clients = await Client.find(clientFilter(req)).sort({ updatedAt: -1 }).lean();
  const clientIds = clients.map((client) => client._id);
  const lastSessions = await Session.aggregate([
    { $match: { therapist_id: req.therapist._id, client_id: { $in: clientIds } } },
    { $sort: { starts_at: -1 } },
    { $group: { _id: '$client_id', last_session: { $first: '$starts_at' } } }
  ]);
  const sessionDates = new Map(lastSessions.map((session) => [String(session._id), session.last_session]));
  clients.forEach((client) => { client.last_session = sessionDates.get(String(client._id)) || null; });
  return res.status(200).json({ clients });
}

async function createClient(req, res) {
  if (!await canAccess(req.therapist._id, 'active_clients')) return res.status(403).json({ message: 'Your active-client limit has been reached.', featureKey: 'active_clients', upgradeRequired: true });
  const client = await Client.create({ ...req.body, therapist_id: req.therapist._id });
  if (client.email) {
    await sendClientLoginAccess({
      recipient: client.email,
      clientName: client.name,
      therapistName: req.therapist.name,
      loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5174'}/login`
    });
  }
  return res.status(201).json({ client });
}

async function getClient(req, res) {
  const client = await Client.findOne({ _id: req.params.id, therapist_id: req.therapist._id });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  return res.status(200).json({ client });
}

async function updateClient(req, res) {
  const allowedFields = ['name', 'email', 'phone', 'date_of_birth', 'gender', 'presenting_concern', 'history', 'tags', 'status', 'intake', 'consent'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
  const current = await Client.findOne({ _id: req.params.id, therapist_id: req.therapist._id });
  if (!current) return res.status(404).json({ message: 'Client not found' });
  if (updates.consent?.accepted !== undefined) {
    const timestamp = new Date();
    updates.consent = { ...current.consent?.toObject?.() || current.consent || {}, ...updates.consent, timestamp };
    updates.$push = { consent_history: { accepted: Boolean(updates.consent.accepted), timestamp, source: 'intake' } };
  }
  const client = await Client.findOneAndUpdate({ _id: req.params.id, therapist_id: req.therapist._id }, updates, { new: true, runValidators: true });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  return res.status(200).json({ client });
}

async function getClientOverview(req, res) {
  const client = await Client.findOne({ _id: req.params.id, therapist_id: req.therapist._id }).lean();
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const [sessions, payments, notes] = await Promise.all([
    Session.find({ client_id: client._id, therapist_id: req.therapist._id }).sort({ starts_at: -1 }).lean(),
    Payment.find({ client_id: client._id, therapist_id: req.therapist._id }).sort({ createdAt: -1 }).lean(),
    SessionNote.find({ client_id: client._id, therapist_id: req.therapist._id }).populate('session_id', 'starts_at ends_at').sort({ updatedAt: -1 }).lean()
  ]);
  return res.status(200).json({ client, sessions, payments, notes });
}

async function getClientSessions(req, res) {
  const ownsClient = await Client.exists({ _id: req.params.id, therapist_id: req.therapist._id });
  if (!ownsClient) return res.status(404).json({ message: 'Client not found' });
  const sessions = await Session.find({ client_id: req.params.id, therapist_id: req.therapist._id }).sort({ starts_at: -1 });
 console.log('Sessions:', sessions); // Debugging line
  return res.status(200).json({ sessions });
}

module.exports = { listClients, createClient, getClient, updateClient, getClientSessions, getClientOverview };
