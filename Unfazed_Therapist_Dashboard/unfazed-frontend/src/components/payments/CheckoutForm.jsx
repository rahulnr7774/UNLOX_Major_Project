export default function CheckoutForm({ client, packageRecord, onPay, loading }) {
	return <form onSubmit={(event) => { event.preventDefault(); onPay() }} className="space-y-4">
		<div className="grid gap-3 sm:grid-cols-2">
			<div className="rounded-xl bg-cream p-3 text-sm"><span className="block text-xs text-ink/50">Name</span><strong>{client?.name || 'Client'}</strong></div>
			<div className="rounded-xl bg-cream p-3 text-sm"><span className="block text-xs text-ink/50">Email</span><strong>{client?.email || 'Not provided'}</strong></div>
		</div>
		<div className="rounded-xl border border-ink/10 p-4 text-sm">
			<p className="font-bold">{packageRecord.name}</p>
			<p className="mt-1 text-ink/55">{packageRecord.session_count} sessions · Valid for {packageRecord.expiry_days} days</p>
			<p className="mt-3 font-display text-2xl font-semibold">INR {packageRecord.total_price}</p>
		</div>
		<p className="text-xs leading-5 text-ink/50">You will complete payment securely in Razorpay. Your package activates after payment verification.</p>
		<button type="submit" disabled={loading} className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-moss disabled:opacity-50">
			{loading ? 'Opening payment...' : 'Pay securely with Razorpay'}
		</button>
	</form>
}