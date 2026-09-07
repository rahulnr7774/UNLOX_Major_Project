const SessionNote = require('../models/SessionNote');
const Client = require('../models/Client');
const Session = require('../models/Session');
const { sendNotification } = require('../services/notificationService');

async function listNotes(req, res) {
  const filter = { therapist_id: req.therapist._id };
  if (req.query.client_id) filter.client_id = req.query.client_id;
  if (req.query.type) filter.type = req.query.type;
  const notes = await SessionNote.find(filter).populate('client_id', 'name').populate('session_id').sort({ updatedAt: -1 });
  return res.status(200).json({ notes });
}

async function createNote(req, res) {
  const { client_id, session_id, content, type, format } = req.body;
  if (!client_id || !session_id || !content || !type) return res.status(400).json({ message: 'client_id, session_id, content and type are required' });
  const [client, session] = await Promise.all([
    Client.exists({ _id: client_id, therapist_id: req.therapist._id }),
    Session.exists({ _id: session_id, client_id, therapist_id: req.therapist._id })
  ]);
  if (!client || !session) return res.status(404).json({ message: 'Client or session not found' });

  const note = await SessionNote.create({ therapist_id: req.therapist._id, client_id, session_id, content, type, format });
  if (type === 'shared') {
    const recipient = await Client.findById(client_id).select('email');
    if (recipient?.email) await sendNotification({ channel: 'email', recipient: recipient.email, subject: 'A note was shared with you', message: 'Your therapist shared a session note.' });
  }
  return res.status(201).json({ note });
}

async function updateNote(req, res) {
  const allowedFields = ['content', 'type', 'format'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
  const note = await SessionNote.findOneAndUpdate({ _id: req.params.id, therapist_id: req.therapist._id }, updates, { new: true, runValidators: true });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  return res.status(200).json({ note });
}

module.exports = { listNotes, createNote, updateNote };
