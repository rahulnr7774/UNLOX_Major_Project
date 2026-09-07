const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const { sendClientLoginAccess } = require('../services/emailServices');

function createTemporaryPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

async function createLead(req, res) {
  const { name, email, phone, presenting_concern } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

  const lead = await Lead.create({ name, email, phone, presenting_concern, status: 'new' });
  return res.status(201).json({ lead });
}

async function listLeads(req, res) {
  const leads = await Lead.find({
    status: 'new',
    $or: [{ therapist_id: req.therapist._id }, { therapist_id: null }]
  }).sort({ createdAt: -1 });
  return res.status(200).json({ leads });
}

async function acceptLead(req, res) {
  const lead = await Lead.findOne({ _id: req.params.id, status: 'new', $or: [{ therapist_id: req.therapist._id }, { therapist_id: null }] });
  if (!lead) return res.status(404).json({ message: 'Pending client request not found' });
  if (!lead.email) return res.status(400).json({ message: 'A client email is required before access can be granted' });

  const temporaryPassword = createTemporaryPassword();
  const client = await Client.create({
    therapist_id: req.therapist._id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    presenting_concern: lead.presenting_concern,
    password_hash: await bcrypt.hash(temporaryPassword, 12)
  });

  try {
    await sendClientLoginAccess({
      recipient: client.email,
      clientName: client.name,
      therapistName: req.therapist.name,
      password: temporaryPassword,
      loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5174'}/login`
    });
  } catch (error) {
    await Client.findByIdAndDelete(client._id);
    throw error;
  }

  lead.therapist_id = req.therapist._id;
  lead.status = 'converted';
  lead.converted_client_id = client._id;
  await lead.save();

  return res.status(200).json({ client, lead });
}

module.exports = { createLead, listLeads, acceptLead };