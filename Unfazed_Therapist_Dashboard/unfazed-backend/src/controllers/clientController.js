const Client = require('../models/Client');
const Session = require('../models/Session');
const { sendNotification } = require('../services/notificationService');
const { sendClientLoginAccess } = require('../services/emailServices');

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
  const clients = await Client.find(clientFilter(req)).sort({ updatedAt: -1 });
  return res.status(200).json({ clients });
}

async function createClient(req, res) {
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
  if (updates.consent?.accepted) updates.consent.timestamp = new Date();
  const client = await Client.findOneAndUpdate({ _id: req.params.id, therapist_id: req.therapist._id }, updates, { new: true, runValidators: true });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  return res.status(200).json({ client });
}

async function getClientSessions(req, res) {
  const ownsClient = await Client.exists({ _id: req.params.id, therapist_id: req.therapist._id });
  if (!ownsClient) return res.status(404).json({ message: 'Client not found' });
  const sessions = await Session.find({ client_id: req.params.id, therapist_id: req.therapist._id }).sort({ starts_at: -1 });
 console.log('Sessions:', sessions); // Debugging line
  return res.status(200).json({ sessions });
}

module.exports = { listClients, createClient, getClient, updateClient, getClientSessions };
