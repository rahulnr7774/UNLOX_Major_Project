import { useEffect, useState } from 'react'
import { ArrowLeft, CreditCard, Download, Package, Receipt, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import CheckoutForm from '../../components/payments/CheckoutForm'
import InvoiceView from '../../components/payments/InvoiceView'

function formatDate(value) {
	return value ? new Date(value).toLocaleString() : 'Not recorded'
}

export default function Payment() {
	const navigate = useNavigate()
	const [client, setClient] = useState(null)
	const [payments, setPayments] = useState([])
	const [packages, setPackages] = useState([])
	const [selectedPayment, setSelectedPayment] = useState(null)
	const [selectedPackage, setSelectedPackage] = useState(null)
	const [loading, setLoading] = useState(true)
	const [checkoutLoading, setCheckoutLoading] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		axiosInstance.get('/clients/portal')
			.then(({ data }) => {
				setClient(data.client)
				setPayments(data.payments || [])
				setPackages(data.packages || [])
			})
			.catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load payment history.'))
			.finally(() => setLoading(false))
	}, [])

	async function payForPackage() {
		if (!selectedPackage) return
		setCheckoutLoading(true)
		setError('')
		try {
			const { data } = await axiosInstance.post(`/client-booking/packages/${selectedPackage._id}/orders`)
			if (!window.Razorpay || !import.meta.env.VITE_RAZORPAY_KEY_ID) {
				throw new Error('Razorpay is not configured.')
			}
			const checkout = new window.Razorpay({
				key: import.meta.env.VITE_RAZORPAY_KEY_ID,
				amount: data.order.amount,
				currency: data.order.currency,
				name: 'Unfazed',
				description: selectedPackage.name,
				order_id: data.order.id,
				prefill: { name: client?.name || '', email: client?.email || '', contact: client?.phone || '' },
				handler: async (result) => {
					try {
						await axiosInstance.post('/client-booking/packages/verify', {
							payment_id: data.payment._id,
							razorpay_order_id: data.order.id,
							razorpay_payment_id: result.razorpay_payment_id,
							razorpay_signature: result.razorpay_signature,
							payment_method: 'razorpay'
						})
						setSelectedPackage(null)
						const response = await axiosInstance.get('/clients/portal')
						setPayments(response.data.payments || [])
					} catch (requestError) {
						setError(requestError.response?.data?.message || 'Payment verification failed.')
					} finally {
						setCheckoutLoading(false)
					}
				},
				modal: { ondismiss: () => setCheckoutLoading(false) },
				theme: { color: '#10B981' }
			})
			checkout.open()
		} catch (requestError) {
			setError(requestError.response?.data?.message || requestError.message || 'Unable to start payment.')
			setCheckoutLoading(false)
		}
	}

	if (loading) return <main className="py-12 text-sm text-[#64748B]">Loading payment history...</main>

	return (
		<main className="min-h-screen bg-[#FAFAF9] text-[#1E293B]">
			<div className="mx-auto max-w-6xl">
				<button onClick={() => navigate('/client-portal')} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#64748B] hover:text-[#1E293B]">
					<ArrowLeft size={16} /> Back to dashboard
				</button>
				<header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-600">Payments</p>
						<h1 className="mt-2 font-display text-4xl font-semibold">Payment history</h1>
						<p className="mt-2 text-sm text-[#64748B]">View receipts and purchase another care package securely.</p>
					</div>
					{packages.length > 0 && <button onClick={() => setSelectedPackage(packages[0])} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600"><Package size={17} /> Buy a package</button>}
				</header>

				{error && <p className="mb-6 rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

				<section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
					<div className="flex items-center gap-3"><Receipt size={21} className="text-emerald-500" /><h2 className="font-display text-2xl font-semibold">Transactions</h2></div>
					<div className="mt-6 space-y-3">
						{payments.map((payment) => (
							<div key={payment._id} className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between">
								<div><p className="font-semibold">{payment.package_id?.name || (payment.session_id ? 'Therapy session' : 'Payment')}</p><p className="mt-1 text-xs text-[#64748B]">{formatDate(payment.paid_at || payment.createdAt)} · {payment.payment_method || 'Razorpay'}</p></div>
								<div className="flex items-center justify-between gap-5 sm:justify-end"><div className="text-right"><p className="font-display text-lg font-semibold">INR {payment.amount}</p><p className={`text-xs font-bold capitalize ${payment.status === 'paid' ? 'text-emerald-600' : payment.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>{payment.status}</p></div><button onClick={() => setSelectedPayment(payment)} className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] px-4 py-2 text-xs font-bold hover:border-emerald-500 hover:text-emerald-600"><Receipt size={14} /> Receipt</button></div>
							</div>
						))}
						{!payments.length && <p className="rounded-2xl border border-dashed border-[#E2E8F0] p-6 text-sm text-[#64748B]">No payments yet.</p>}
					</div>
				</section>

				{packages.length > 0 && <section className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8"><div className="flex items-center gap-3"><CreditCard size={21} className="text-emerald-600" /><h2 className="font-display text-2xl font-semibold">Available packages</h2></div><div className="mt-5 grid gap-4 md:grid-cols-3">{packages.map((packageRecord) => <div key={packageRecord._id} className="rounded-2xl bg-white p-5"><h3 className="font-display text-lg font-semibold">{packageRecord.name}</h3><p className="mt-1 text-sm text-[#64748B]">{packageRecord.session_count} sessions · {packageRecord.expiry_days} days</p><p className="mt-4 font-display text-2xl font-semibold">INR {packageRecord.total_price}</p><button onClick={() => setSelectedPackage(packageRecord)} className="mt-4 w-full rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600">Buy package</button></div>)}</div></section>}
			</div>

			{selectedPayment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/40 p-5"><div className="w-full max-w-lg rounded-[28px] bg-[#FAFAF9] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Receipt</p><h2 className="mt-2 font-display text-2xl font-semibold">Payment receipt</h2></div><button onClick={() => setSelectedPayment(null)} aria-label="Close receipt"><X size={20} /></button></div><div className="mt-6"><InvoiceView payment={selectedPayment} /></div><button onClick={() => window.print()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] px-4 py-2 text-sm font-bold"><Download size={15} /> Print receipt</button></div></div>}
			{selectedPackage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/40 p-5"><div className="w-full max-w-lg rounded-[28px] bg-[#FAFAF9] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Secure checkout</p><h2 className="mt-2 font-display text-2xl font-semibold">Confirm package</h2></div><button onClick={() => setSelectedPackage(null)} aria-label="Close checkout"><X size={20} /></button></div><div className="mt-6"><CheckoutForm client={client} packageRecord={selectedPackage} onPay={payForPackage} loading={checkoutLoading} /></div></div></div>}
		</main>
	)
}