const crypto = require('crypto');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const razorpay = require('../config/razorpay');
const { buildInvoiceData } = require('../services/invoiceService');
const { generateAndEmailInvoice } = require('../services/invoiceService');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const Session = require('../models/Session');
const { nextSessionCode } = require('../utils/sessionCode');
const { notifyBookingConfirmed } = require('../services/notificationService');

async function createOrder(req, res) {
  const { client_id, amount, session_id, client_package_id } = req.body;
  if (!client_id || !amount || Number(amount) <= 0) return res.status(400).json({ message: 'client_id and a positive amount are required' });
  if (!await Client.exists({ _id: client_id, therapist_id: req.therapist._id })) return res.status(404).json({ message: 'Client not found' });

  const gatewayOrder = razorpay
    ? await razorpay.orders.create({ amount: Math.round(Number(amount) * 100), currency: 'INR', receipt: `uf_${Date.now()}` })
    : { id: `dev_order_${Date.now()}`, amount: Math.round(Number(amount) * 100), currency: 'INR' };
  const payment = await Payment.create({ therapist_id: req.therapist._id, client_id, session_id, client_package_id, gateway_transaction_id: gatewayOrder.id, amount, net_amount: amount, status: 'created' });
  return res.status(201).json({ order: gatewayOrder, payment });
}

async function verifyPayment(req, res) {
  const { payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_method } = req.body;
  if (!payment_id || !razorpay_order_id || !razorpay_payment_id) return res.status(400).json({ message: 'Payment verification fields are required' });
  if (process.env.RAZORPAY_KEY_SECRET) {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ message: 'Payment signature is invalid' });
  }
  const payment = await Payment.findOneAndUpdate({ _id: payment_id, therapist_id: req.therapist._id, gateway_transaction_id: razorpay_order_id }, { status: 'paid', payment_method, paid_at: new Date() }, { new: true });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  generateAndEmailInvoice(payment._id).catch((error) => console.error('[invoice] failed:', error.message));
  return res.status(200).json({ payment, invoice: buildInvoiceData(payment) });
}

async function webhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !req.rawBody) return res.status(400).json({ message: 'Webhook signature configuration is missing' });
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  if (expected !== signature) return res.status(400).json({ message: 'Invalid webhook signature' });

  const payload = JSON.parse(req.rawBody.toString('utf8'));
  if (!['payment.captured', 'order.paid'].includes(payload.event)) return res.status(200).json({ received: true });
  const entity = payload.payload?.payment?.entity;
  const orderId = entity?.order_id || payload.payload?.order?.entity?.id;
  if (!orderId) return res.status(200).json({ received: true });
  const payment = await Payment.findOne({ gateway_transaction_id: orderId });
  if (!payment) return res.status(200).json({ received: true });
  if (payment.status === 'paid') return res.status(200).json({ received: true, alreadyProcessed: true });

  if (payment.package_id) {
    const packageRecord = await Package.findById(payment.package_id);
    if (packageRecord) {
      const clientPackage = await ClientPackage.create({ client_id: payment.client_id, therapist_id: payment.therapist_id, package_id: packageRecord._id, total_sessions: packageRecord.session_count, sessions_remaining: packageRecord.session_count, expires_at: new Date(Date.now() + packageRecord.expiry_days * 86400000), payment_id: payment._id });
      payment.client_package_id = clientPackage._id;
    }
  } else if (payment.starts_at && payment.ends_at) {
    const conflict = await Session.exists({ therapist_id: payment.therapist_id, status: { $in: ['scheduled', 'confirmed'] }, starts_at: { $lt: payment.ends_at }, ends_at: { $gt: payment.starts_at } });
    if (!conflict) {
      const session = await Session.create({ session_code: await nextSessionCode(), therapist_id: payment.therapist_id, client_id: payment.client_id, starts_at: payment.starts_at, ends_at: payment.ends_at, status: 'confirmed' });
      payment.session_id = session._id;
      notifyBookingConfirmed(session._id).catch((error) => console.error('[notification] booking confirmation failed:', error.message));
    }
  }
  payment.status = 'paid';
  payment.payment_method = 'razorpay_webhook';
  payment.paid_at = new Date();
  await payment.save();
  generateAndEmailInvoice(payment._id).catch((error) => console.error('[invoice] failed:', error.message));
  return res.status(200).json({ received: true });
}

async function listPayments(req, res) {
  const payments = await Payment.find({ therapist_id: req.therapist._id }).populate('client_id', 'name email').sort({ createdAt: -1 });
  return res.status(200).json({ payments });
}

module.exports = { createOrder, verifyPayment, webhook, listPayments };
