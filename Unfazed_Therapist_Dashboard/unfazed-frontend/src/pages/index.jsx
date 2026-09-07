import { ArrowRight, HeartHandshake, Leaf, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
	const navigate = useNavigate()

	return <main className="min-h-screen bg-cream text-ink">
		<nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
			<div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-moss font-display text-xl font-bold text-white">u</span><span className="font-display text-xl font-semibold">unfazed</span></div>
			<button type="button" onClick={() => navigate('/login')} className="text-sm font-bold text-moss hover:text-ink">Sign in</button>
		</nav>
		<section className="soft-grid mx-auto grid max-w-6xl items-center gap-12 rounded-[32px] bg-sage px-6 py-16 sm:px-12 lg:grid-cols-[1.1fr_.9fr] lg:px-16 lg:py-24">
			<div><p className="mb-5 text-sm font-bold uppercase tracking-[.18em] text-moss">Practice management, with room to breathe</p><h1 className="max-w-2xl font-display text-5xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-7xl">A calmer way to care for people.</h1><p className="mt-6 max-w-xl text-base leading-7 text-ink/65 sm:text-lg">Unfazed brings your sessions, clients, notes, and practice rhythm into one thoughtful workspace.</p><button type="button" onClick={() => navigate('/login')} className="mt-9 inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-moss">Get started <ArrowRight size={18} /></button></div>
			<div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><div className="rounded-[28px] bg-white p-7 shadow-[0_20px_60px_rgba(31,41,36,.08)]"><HeartHandshake className="text-moss" size={28} /><h2 className="mt-8 font-display text-2xl font-semibold">Care, held gently.</h2><p className="mt-3 text-sm leading-6 text-ink/60">Keep the important details close without letting administration take over.</p></div><div className="rounded-[28px] bg-[#f8dfd3] p-7"><div className="flex items-center gap-3"><ShieldCheck className="text-coral" size={22} /><span className="text-sm font-bold">Private by design</span></div><p className="mt-4 text-sm leading-6 text-ink/60">A focused home for your work and your clients.</p></div></div>
		</section>
		<div className="mx-auto grid max-w-6xl gap-4 px-6 py-10 sm:grid-cols-3 sm:px-8"><Feature icon={Leaf} title="Your rhythm" text="See the shape of your practice at a glance." /><Feature icon={HeartHandshake} title="Human first" text="Make every client interaction feel considered." /><Feature icon={ShieldCheck} title="Clear and private" text="Keep sensitive work in one secure place." /></div>
	</main>
}

function Feature({ icon: Icon, title, text }) {
	return <div className="flex gap-4 rounded-2xl border border-ink/10 bg-white/60 p-5"><Icon className="mt-1 shrink-0 text-moss" size={20} /><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-ink/55">{text}</p></div></div>
}
