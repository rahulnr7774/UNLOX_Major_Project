export default function InvoiceView({ payment }) {
	const amount = Number(payment.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: payment.currency || 'INR' })
	return <div className="rounded-2xl bg-white p-5 text-sm">
		<div className="flex justify-between gap-4"><span>Invoice total</span><strong>{amount}</strong></div>
		<div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-ink/60">
			<p><strong className="text-ink">Receipt:</strong> {payment.invoice_number || `UF-${payment._id}`}</p>
			<p><strong className="text-ink">Order:</strong> {payment.gateway_transaction_id}</p>
			<p><strong className="text-ink">Status:</strong> <span className="capitalize">{payment.status}</span></p>
		</div>
	</div>
}