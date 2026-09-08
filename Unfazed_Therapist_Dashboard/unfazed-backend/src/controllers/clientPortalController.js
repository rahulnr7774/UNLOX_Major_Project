const ClientPackage = require('../models/ClientPackage');
const Client = require('../models/Client');
const Session = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const Package = require('../models/Package');
const Payment = require('../models/Payment');

async function getPortal(req, res) {
  const now = new Date();
  const sessionQuery = { client_id: req.client._id };
    const [sessions, sharedNotes, clientPackage, packages, payments] = await Promise.all([
    Session.find(sessionQuery).sort({ starts_at: -1 }).populate('therapist_id', 'name'),
    SessionNote.find({ client_id: req.client._id, type: 'shared' }).select('content format createdAt session_id').sort({ createdAt: -1 }),
    ClientPackage.findOne({ client_id: req.client._id, status: 'active', expires_at: { $gte: now } })
      .sort({ expires_at: 1 }).populate('package_id', 'name'),
    Package.find({ therapist_id: req.client.therapist_id, active: true }).sort({ session_count: 1 }),
    Payment.find({ client_id: req.client._id })
      .sort({ createdAt: -1 })
      .populate('package_id', 'name session_count expiry_days total_price')
      .populate('session_id', 'session_code starts_at ends_at')
      .populate('therapist_id', 'name')
  ]);

  const upcomingSession = sessions
    .filter((session) => session.starts_at >= now && !['cancelled', 'completed'].includes(session.status))
    .sort((first, second) => first.starts_at - second.starts_at)[0] || null;

  const formatSession = (session) => ({
    ...session.toObject(),
    therapist: session.therapist_id,
    duration: Math.round((session.ends_at - session.starts_at) / 60000)
  });

  return res.status(200).json({
    client: req.client,
    upcomingSession: upcomingSession ? formatSession(upcomingSession) : null,
    sessions: sessions.map(formatSession),
    sharedNotes,
    clientPackage: clientPackage ? { ...clientPackage.toObject(), package: clientPackage.package_id } : null,
    packages,
    payments
  });
}

async function updateProfile(req, res) {
  const allowedFields = ['name', 'email', 'phone', 'date_of_birth', 'gender', 'presenting_concern', 'history'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
  const client = await Client.findByIdAndUpdate(req.client._id, updates, { new: true, runValidators: true }).select('-password_hash');
  if (!client) return res.status(404).json({ message: 'Client account not found' });
  return res.status(200).json({ client });
}

module.exports = { getPortal, updateProfile };