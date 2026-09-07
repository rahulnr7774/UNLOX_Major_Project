const crypto = require('crypto');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const razorpay = require('../config/razorpay');
const { buildInvoiceData } = require('../services/invoiceService');

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
  return res.status(200).json({ payment, invoice: buildInvoiceData(payment) });
}

async function listPayments(req, res) {
  const payments = await Payment.find({ therapist_id: req.therapist._id }).populate('client_id', 'name email').sort({ createdAt: -1 });
  return res.status(200).json({ payments });
}

module.exports = { createOrder, verifyPayment, listPayments };
