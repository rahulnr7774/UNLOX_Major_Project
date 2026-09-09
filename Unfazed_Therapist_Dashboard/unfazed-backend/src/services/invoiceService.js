const Payment = require('../models/Payment');
const { sendInvoice } = require('./emailServices');

function buildInvoiceData(payment) {
  const total = Number(payment.amount || 0);
  const taxableAmount = total / 1.18;
  const gst = total - taxableAmount;
  return {
    invoiceNumber: payment.invoice_number || `UF-${payment._id}`,
    amount: total,
    subtotal: taxableAmount,
    taxableAmount,
    cgst: gst / 2,
    sgst: gst / 2,
    currency: payment.currency,
    issuedAt: payment.createdAt
  };
}

async function generateAndEmailInvoice(paymentId) {
  const payment = await Payment.findById(paymentId).populate('client_id', 'name email').populate('therapist_id', 'name').populate('package_id', 'name');
  if (!payment || payment.status !== 'paid' || payment.invoice_sent_at || !payment.client_id?.email) return payment;
  const invoice = buildInvoiceData(payment);
  await sendInvoice({
    recipient: payment.client_id.email,
    invoiceData: {
      ...invoice,
      companyName: 'UNFAZED',
      clientName: payment.client_id.name,
      clientEmail: payment.client_id.email,
      therapistName: payment.therapist_id?.name,
      description: payment.package_id?.name || (payment.package_id ? 'Therapy package' : 'Therapy session'),
      invoiceDate: invoice.issuedAt,
      dueDate: invoice.issuedAt,
      status: payment.status,
      currency: payment.currency || 'INR'
    }
  });
  payment.invoice_number = invoice.invoiceNumber;
  payment.invoice_sent_at = new Date();
  await payment.save();
  return payment;
}

module.exports = { buildInvoiceData, generateAndEmailInvoice };
