const Payment = require('../models/Payment');
const { sendEmail } = require('./emailServices');

function buildInvoiceData(payment) {
  const total = Number(payment.amount || 0);
  const taxableAmount = total / 1.18;
  const gst = total - taxableAmount;
  return {
    invoiceNumber: payment.invoice_number || `UF-${payment._id}`,
    amount: total,
    taxableAmount,
    cgst: gst / 2,
    sgst: gst / 2,
    currency: payment.currency,
    issuedAt: payment.createdAt
  };
}

function pdfEscape(value) {
  return String(value).replace(/([\\()])/g, '\\$1');
}

function createInvoicePdf(invoice, payment) {
  const lines = [
    'UNFAZED',
    'GST TAX INVOICE',
    `Invoice: ${invoice.invoiceNumber}`,
    `Issued: ${new Date(invoice.issuedAt || Date.now()).toLocaleDateString('en-IN')}`,
    `Bill to: ${payment.client_id?.name || 'Client'}`,
    `Email: ${payment.client_id?.email || 'Not provided'}`,
    `Therapist: ${payment.therapist_id?.name || 'Unfazed therapist'}`,
    `Description: ${payment.package_id ? 'Therapy package' : 'Therapy session'}`,
    `Taxable value: INR ${invoice.taxableAmount.toFixed(2)}`,
    `CGST (9%): INR ${invoice.cgst.toFixed(2)}`,
    `SGST (9%): INR ${invoice.sgst.toFixed(2)}`,
    `Total: INR ${invoice.amount.toFixed(2)}`,
    `Payment status: ${payment.status}`
  ];
  const stream = ['BT', '/F1 12 Tf', '50 780 Td'];
  lines.forEach((line, index) => { if (index) stream.push('0 -28 Td'); stream.push(`(${pdfEscape(line)}) Tj`); });
  stream.push('ET');
  const content = stream.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = Buffer.byteLength(pdf, 'utf8'); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

async function generateAndEmailInvoice(paymentId) {
  const payment = await Payment.findById(paymentId).populate('client_id', 'name email').populate('therapist_id', 'name').populate('package_id', 'name');
  if (!payment || payment.status !== 'paid' || payment.invoice_sent_at || !payment.client_id?.email) return payment;
  const invoice = buildInvoiceData(payment);
  const pdf = createInvoicePdf(invoice, payment);
  await sendEmail({
    to: payment.client_id.email,
    subject: `Your Unfazed invoice ${invoice.invoiceNumber}`,
    text: `Your payment receipt is attached. Invoice ${invoice.invoiceNumber}. Total INR ${invoice.amount.toFixed(2)}.`,
    html: `<p>Hi ${payment.client_id.name || 'there'},</p><p>Your Unfazed payment invoice is attached.</p><p><strong>Total:</strong> INR ${invoice.amount.toFixed(2)}</p>`,
    attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf, contentType: 'application/pdf' }]
  });
  payment.invoice_number = invoice.invoiceNumber;
  payment.invoice_sent_at = new Date();
  await payment.save();
  return payment;
}

module.exports = { buildInvoiceData, generateAndEmailInvoice };
