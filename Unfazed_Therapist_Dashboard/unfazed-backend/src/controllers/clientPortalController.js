const ClientPackage = require('../models/ClientPackage');
const Session = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const Package = require('../models/Package');

async function getPortal(req, res) {
  const now = new Date();
  const sessionQuery = { client_id: req.client._id };
    const [sessions, sharedNotes, clientPackage, packages] = await Promise.all([
    Session.find(sessionQuery).sort({ starts_at: -1 }).populate('therapist_id', 'name'),
    SessionNote.find({ client_id: req.client._id, type: 'shared' }).sort({ createdAt: -1 }),
    ClientPackage.findOne({ client_id: req.client._id, status: 'active', expires_at: { $gte: now } })
      .sort({ expires_at: 1 }).populate('package_id', 'name'),
    Package.find({ therapist_id: req.client.therapist_id, active: true }).sort({ session_count: 1 })
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
    packages
  });
}

module.exports = { getPortal };