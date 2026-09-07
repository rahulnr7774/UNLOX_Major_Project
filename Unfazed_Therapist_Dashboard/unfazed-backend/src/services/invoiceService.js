function buildInvoiceData(payment) {
  return {
    invoiceNumber: `UF-${payment._id}`,
    amount: payment.amount,
    currency: payment.currency,
    issuedAt: payment.createdAt
  };
}

module.exports = { buildInvoiceData };
