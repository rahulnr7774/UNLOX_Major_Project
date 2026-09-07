const crypto = require('crypto');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Therapist = require('../models/Therapist');
const Availability = require('../models/Availability');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const razorpay = require('../config/razorpay');
const { nextSessionCode } = require('../utils/sessionCode');

const allowedDurations = [30, 45, 60, 90];

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function atUtc(date, time) {
  return new Date(`${date}T${time}:00.000Z`);
}

function overlapsBlocked(availability, start, end) {
  return (availability.blocked_slots || []).some((slot) => start < new Date(slot.end) && end > new Date(slot.start));
}

function slotsForDate(availability, date, duration) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const override = (availability.overrides || []).find((item) => dateKey(item.date) === date);
  const ranges = override
    ? (override.available ? override.slots : [])
    : ((availability.weekly_schedule || []).find((item) => item.day === day && item.enabled)?.slots || []);
  const slots = [];
  const step = Number(duration) + Number(availability.buffer_time || 0);

  for (const range of ranges) {
    let start = atUtc(date, range.start);
    const rangeEnd = atUtc(date, range.end);
    while (start < rangeEnd) {
      const end = new Date(start.getTime() + Number(duration) * 60000);
      if (end > rangeEnd) break;
      if (start > new Date() && !overlapsBlocked(availability, start, end)) {
        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          displayTime: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
        });
      }
      start = new Date(start.getTime() + step * 60000);
    }
  }
  return slots;
}

async function listTherapists(req, res) {
  const filter = {};
  if (req.query.specialization?.trim()) {
    filter.specializations = { $regex: req.query.specialization.trim(), $options: 'i' };
  }
  const therapists = await Therapist.find(filter).select('name slug bio specializations languages session_rate');
  return res.status(200).json({ therapists });
}

async function listAvailability(req, res) {
  const duration = Number(req.query.duration || 60);
  const date = req.query.date;
  if (!date || !allowedDurations.includes(duration)) return res.status(400).json({ message: 'A valid date and duration are required' });

  const therapist = await Therapist.findById(req.params.therapistId).select('name session_rate specializations');
  if (!therapist) return res.status(404).json({ message: 'Therapist not found' });
  const availability = await Availability.findOne({ therapist_id: therapist._id });
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  const bookedSessions = await Session.find({
    therapist_id: therapist._id,
    status: { $in: ['scheduled', 'confirmed'] },
    starts_at: { $lt: dayEnd },
    ends_at: { $gt: dayStart }
  }).select('starts_at ends_at').lean();
  const slots = availability ? slotsForDate(availability, date, duration).filter((slot) => !bookedSessions.some((session) => new Date(slot.start) < new Date(session.ends_at) && new Date(slot.end) > new Date(session.starts_at))) : [];
  res.set('Cache-Control', 'no-store');
  return res.status(200).json({ therapist, date, duration, slots });
}

async function listPackages(req, res) {
  const packages = await Package.find({ therapist_id: req.client.therapist_id, active: true }).sort({ session_count: 1 });
  return res.status(200).json({ packages });
}

async function createPackageOrder(req, res) {
  const packageRecord = await Package.findOne({ _id: req.params.packageId, therapist_id: req.client.therapist_id, active: true });
  if (!packageRecord) return res.status(404).json({ message: 'Package not found' });
  const amount = Number(packageRecord.total_price);
  const order = razorpay
    ? await razorpay.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `uf_pkg_${Date.now()}` })
    : { id: `dev_order_${Date.now()}`, amount: Math.round(amount * 100), currency: 'INR' };
  const payment = await Payment.create({ therapist_id: packageRecord.therapist_id, client_id: req.client._id, package_id: packageRecord._id, gateway_transaction_id: order.id, amount, net_amount: amount, status: 'created' });
  return res.status(201).json({ order, payment, package: packageRecord });
}

async function createOrder(req, res) {
  const { therapist_id: therapistId, starts_at: startsAt, ends_at: endsAt, duration } = req.body;
  const durationNumber = Number(duration);
  const therapist = await Therapist.findById(therapistId).select('session_rate');
  if (!therapist || !startsAt || !endsAt || !allowedDurations.includes(durationNumber)) return res.status(400).json({ message: 'Valid therapist, slot and duration are required' });

  const availability = await Availability.findOne({ therapist_id: therapist._id });
  const requestedStart = new Date(startsAt).toISOString();
  const requestedEnd = new Date(endsAt).toISOString();
  const validSlot = availability && slotsForDate(availability, dateKey(startsAt), durationNumber).some((slot) => slot.start === requestedStart && slot.end === requestedEnd);
  if (!validSlot) return res.status(409).json({ message: 'That slot is no longer available' });
  if (await Session.exists({ therapist_id: therapist._id, status: { $in: ['scheduled', 'confirmed'] }, starts_at: { $lt: new Date(endsAt) }, ends_at: { $gt: new Date(startsAt) } })) return res.status(409).json({ message: 'That slot was just booked' });

  const amount = Number(therapist.session_rate || 1500);
  const order = razorpay
    ? await razorpay.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `uf_${Date.now()}` })
    : { id: `dev_order_${Date.now()}`, amount: Math.round(amount * 100), currency: 'INR' };
  const payment = await Payment.create({ therapist_id: therapist._id, client_id: req.client._id, gateway_transaction_id: order.id, amount, net_amount: amount, starts_at: new Date(startsAt), ends_at: new Date(endsAt), duration, status: 'created' });
  return res.status(201).json({ order, payment, amount });
}

async function verifyPayment(req, res) {
  const { payment_id: paymentId, razorpay_order_id: orderId, razorpay_payment_id: gatewayPaymentId, razorpay_signature: signature, payment_method: paymentMethod } = req.body;
  const payment = await Payment.findOne({ _id: paymentId, client_id: req.client._id, gateway_transaction_id: orderId });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  if (process.env.RAZORPAY_KEY_SECRET) {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${gatewayPaymentId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ message: 'Payment signature is invalid' });
  }

  if (payment.status !== 'paid') {
    if (payment.package_id) {
      const packageRecord = await Package.findById(payment.package_id);
      if (!packageRecord) return res.status(404).json({ message: 'Package not found' });
      const clientPackage = await ClientPackage.create({
        client_id: req.client._id,
        therapist_id: payment.therapist_id,
        package_id: packageRecord._id,
        total_sessions: packageRecord.session_count,
        sessions_remaining: packageRecord.session_count,
        expires_at: new Date(Date.now() + packageRecord.expiry_days * 86400000),
        payment_id: payment._id
      });
      payment.client_package_id = clientPackage._id;
      payment.status = 'paid';
      payment.payment_method = paymentMethod;
      payment.paid_at = new Date();
      await payment.save();
      return res.status(200).json({ payment, clientPackage });
    }
    const conflict = await Session.exists({ therapist_id: payment.therapist_id, status: { $in: ['scheduled', 'confirmed'] }, starts_at: { $lt: payment.ends_at }, ends_at: { $gt: payment.starts_at } });
    if (conflict) return res.status(409).json({ message: 'That slot was booked while payment was processing' });
    const session = await Session.create({ session_code: await nextSessionCode(), therapist_id: payment.therapist_id, client_id: payment.client_id, starts_at: payment.starts_at, ends_at: payment.ends_at, status: 'confirmed' });
    payment.session_id = session._id;
    payment.status = 'paid';
    payment.payment_method = paymentMethod;
    payment.paid_at = new Date();
    await payment.save();
  }
  return res.status(200).json({ payment, session: await Session.findById(payment.session_id) });
}

async function bookWithPackage(req, res) {
  const { package_id: packageId, therapist_id: therapistId, starts_at: startsAt, ends_at: endsAt } = req.body;
  const duration = Math.round((new Date(endsAt) - new Date(startsAt)) / 60000);
  const availability = await Availability.findOne({ therapist_id: therapistId });
  const validSlot = availability && slotsForDate(availability, dateKey(startsAt), duration).some((slot) => slot.start === new Date(startsAt).toISOString() && slot.end === new Date(endsAt).toISOString());
  if (!validSlot) return res.status(409).json({ message: 'That slot is no longer available' });
  const clientPackage = await ClientPackage.findOneAndUpdate(
    { _id: packageId, client_id: req.client._id, therapist_id: therapistId, status: 'active', sessions_remaining: { $gt: 0 }, expires_at: { $gte: new Date() } },
    { $inc: { sessions_remaining: -1, sessions_used: 1 } },
    { new: true }
  );
  if (!clientPackage) return res.status(409).json({ message: 'No active sessions remain in this package' });
  if (await Session.exists({ therapist_id: therapistId, status: { $in: ['scheduled', 'confirmed'] }, starts_at: { $lt: new Date(endsAt) }, ends_at: { $gt: new Date(startsAt) } })) {
    await ClientPackage.findByIdAndUpdate(clientPackage._id, { $inc: { sessions_remaining: 1, sessions_used: -1 } });
    return res.status(409).json({ message: 'That slot was just booked' });
  }
  const session = await Session.create({ session_code: await nextSessionCode(), therapist_id: therapistId, client_id: req.client._id, starts_at: startsAt, ends_at: endsAt, status: 'confirmed' });
  if (clientPackage.sessions_remaining === 0) await ClientPackage.findByIdAndUpdate(clientPackage._id, { status: 'completed' });
  return res.status(201).json({ session, clientPackage });
}

async function getSessionStatus(req, res) {
  const session = await Session.findOne({ _id: req.params.sessionId, client_id: req.client._id }).populate('therapist_id', 'name');
  if (!session) return res.status(404).json({ message: 'Session not found' });
  return res.status(200).json({ session, started: Boolean(session.started_at) });
}

module.exports = { listTherapists, listAvailability, listPackages, createPackageOrder, createOrder, verifyPayment, bookWithPackage, getSessionStatus };
