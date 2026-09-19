const Client = require('../models/Client');
const Lead = require('../models/Lead');
const { sendClientApprovalNotification } = require('../services/emailServices');
const { markInAppApprovalNotification } = require('../services/notificationService');
const { isValidEmail, isValidPhone } = require('../utils/validation');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createLead(req, res) {
  const { name, email, phone, presenting_concern } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
  if (!isValidEmail(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
  if (phone && !isValidPhone(phone)) return res.status(400).json({ message: 'Phone number must contain exactly 10 digits' });

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const existingLead = await Lead.findOne({
    $or: [
      { email: normalizedEmail },
      { name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' } }
    ]
  }).select('_id');

  if (existingLead) {
    return res.status(409).json({ message: 'A lead with this name or email already exists. Please use a different name or email.' });
  }

  const lead = await Lead.create({ name: normalizedName, email: normalizedEmail, phone, presenting_concern, status: 'new' });
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

  const client = await Client.findOne({
    _id: lead.converted_client_id,
    email: lead.email,
    approval_status: 'pending'
  });
  if (!client) return res.status(404).json({ message: 'The client account for this request was not found' });

  client.therapist_id = req.therapist._id;
  client.approval_status = 'approved';
  await client.save();
  await markInAppApprovalNotification(client, req.therapist.name);

  lead.therapist_id = req.therapist._id;
  lead.status = 'converted';
  lead.converted_client_id = client._id;
  await lead.save();

  try {
    await sendClientApprovalNotification({
      recipient: client.email,
      clientName: client.name,
      therapistName: req.therapist.name,
      loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5174'}/login`
    });
  } catch (error) {
    console.error(`[email] approval notification failed for ${client.email}: ${error.message}`);
  }

  return res.status(200).json({ client, lead });
}

module.exports = { createLead, listLeads, acceptLead };