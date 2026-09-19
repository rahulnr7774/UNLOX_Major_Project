const ClientPackage = require('../models/ClientPackage');
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const Session = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const Package = require('../models/Package');
const Payment = require('../models/Payment');
const fs = require('fs');
const pdfGenerator = require('../utils/pdfGenerator');
const { buildInvoiceData } = require('../services/invoiceService');
const { isValidEmail, isValidPhone, isValidPassword } = require('../utils/validation');

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

async function getApprovalStatus(req, res) {
  return res.status(200).json({ client: req.client });
}

async function updateProfile(req, res) {
  const allowedFields = ['name', 'email', 'phone', 'date_of_birth', 'gender', 'presenting_concern', 'history'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
  if (updates.email && !isValidEmail(updates.email)) return res.status(400).json({ message: 'Please enter a valid email address' });
  if (updates.phone && !isValidPhone(updates.phone)) return res.status(400).json({ message: 'Phone number must contain exactly 10 digits' });
  const clientRecord = await Client.findById(req.client._id).select('+password_hash');
  if (!clientRecord) return res.status(404).json({ message: 'Client account not found' });

  if (clientRecord.must_change_password) {
    const { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ message: 'Enter your temporary password and choose a new password.' });
    if (!isValidPassword(newPassword)) return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character.' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'Your new passwords do not match.' });
    if (!await bcrypt.compare(currentPassword, clientRecord.password_hash)) return res.status(400).json({ message: 'The temporary password is incorrect.' });
    clientRecord.password_hash = await bcrypt.hash(newPassword, 12);
    clientRecord.must_change_password = false;
  }

  Object.assign(clientRecord, updates);
  await clientRecord.save();
  const client = clientRecord.toObject();
  delete client.password_hash;
  if (!client) return res.status(404).json({ message: 'Client account not found' });
  return res.status(200).json({ client });
}

async function downloadReceipt(req, res) {
  const payment = await Payment.findOne({ _id: req.params.paymentId, client_id: req.client._id })
    .populate('client_id', 'name email')
    .populate('therapist_id', 'name')
    .populate('package_id', 'name');
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  if (payment.status !== 'paid') return res.status(403).json({ message: 'Complete payment before downloading the receipt' });

  const invoice = buildInvoiceData(payment);
  const pdfPath = await pdfGenerator.generateInvoice({
    ...invoice,
    companyName: 'UNFAZED',
    clientName: payment.client_id?.name,
    clientEmail: payment.client_id?.email,
    therapistName: payment.therapist_id?.name,
    description: payment.package_id?.name || (payment.package_id ? 'Therapy package' : 'Therapy session'),
    invoiceDate: invoice.issuedAt,
    dueDate: invoice.issuedAt,
    status: payment.status,
    currency: payment.currency || 'INR'
  });
  const pdf = fs.readFileSync(pdfPath);
  fs.unlinkSync(pdfPath);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    'Content-Length': pdf.length
  });
  return res.send(pdf);
}

module.exports = { getPortal, getApprovalStatus, updateProfile, downloadReceipt };