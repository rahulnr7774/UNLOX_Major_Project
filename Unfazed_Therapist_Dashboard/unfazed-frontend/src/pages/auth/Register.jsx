import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, HeartHandshake } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import GoogleAuthButton from './GoogleAuthButton'
import { getPostLoginPath } from '../../utils/profileCompletion'
import { isValidEmail, isValidPassword, isValidPhone } from '../../utils/validation'

export default function Register() {
	const [role, setRole] = useState('therapist')
	const [headlineIndex, setHeadlineIndex] = useState(0)
	const [showPassword, setShowPassword] = useState(false)
	const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', presenting_concern: '' })
	const [state, setState] = useState({ loading: false, message: '', error: '' })
	const { login } = useAuth()
	const navigate = useNavigate()
	const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })
	const headlines = [
		'Build a practice that leaves room to breathe.',
		'Create space for better conversations.',
		'Help every session feel more intentional.',
		'Keep your care practice steady and human.',
	]
	const fields = role === 'therapist' ? [['name', 'Full name', 'text'], ['email', 'Email address', 'email'], ['password', 'Password (8+ characters)', 'password']] : [['name', 'Full name', 'text'], ['email', 'Email address', 'email'], ['password', 'Password (8+ characters)', 'password'], ['phone', 'Phone number', 'tel'], ['presenting_concern', 'What brings you here?', 'text']]

	useEffect(() => {
		const timer = window.setInterval(() => {
			setHeadlineIndex((current) => (current + 1) % headlines.length)
		}, 4000)

		return () => window.clearInterval(timer)
	}, [headlines.length])

	async function submit(event) {
		event.preventDefault()
		if (!isValidEmail(form.email)) {
			setState({ loading: false, error: 'Please enter a valid email address.', message: '' })
			return
		}
		if (!isValidPassword(form.password)) {
			setState({ loading: false, error: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character.', message: '' })
			return
		}
		if (role === 'client' && form.phone && !isValidPhone(form.phone)) {
			setState({ loading: false, error: 'Phone number must contain exactly 10 digits.', message: '' })
			return
		}
		setState({ loading: true, error: '', message: '' })
		try {
			if (role === 'client') {
				const { data } = await axiosInstance.post('/auth/register-client', form)
				localStorage.setItem('unfazed_token', data.token)
				const account = { ...data.client, role: 'client' }
				login(account)
				navigate(getPostLoginPath(account), { replace: true })
				return
			}
			const { data } = await axiosInstance.post('/auth/register', { name: form.name, email: form.email, password: form.password })
			localStorage.setItem('unfazed_token', data.token)
			const account = data.client ? { ...data.client, role: 'client' } : { ...data.therapist, role: 'therapist' }
			login(account)
			navigate(getPostLoginPath(account), { replace: true })
		} catch (requestError) {
			setState({ loading: false, error: requestError.response?.data?.message || 'Unable to create your account.', message: '' })
		}
	}

	async function signUpWithGoogle(credentialResponse) {
		setState({ loading: true, error: '', message: '' })
		try {
			const { data } = await axiosInstance.post('/auth/google', { credential: credentialResponse.credential, role })
			localStorage.setItem('unfazed_token', data.token)
			const account = data.client ? { ...data.client, role: 'client' } : { ...data.therapist, role: 'therapist' }
			login(account)
			navigate(getPostLoginPath(account), { replace: true })
		} catch (requestError) {
			setState({ loading: false, error: requestError.response?.data?.message || 'Unable to create your account with Google.', message: '' })
		}
	}

	 return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(31,41,36,.08)] lg:grid-cols-[.9fr_1.1fr]"><div className="soft-grid hidden bg-sage p-10 lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3"><Logo /><span className="font-display text-xl font-semibold">unfazed</span></div><div><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-moss"><HeartHandshake /></div><h2 key={headlineIndex} aria-live="polite" className="max-w-sm animate-[fadeSlideUp_.55s_ease-out] font-display text-4xl font-semibold leading-tight">{headlines[headlineIndex]}</h2></div><p className="text-xs font-semibold uppercase tracking-[.16em] text-moss">Private by design · Built for care</p></div><div className="p-6 sm:p-12 lg:p-16"><div className="mb-10 flex items-center gap-3 lg:hidden"><Logo /><span className="font-display text-xl font-semibold">unfazed</span></div><div className="mx-auto max-w-md"><p className="mb-3 text-sm font-semibold uppercase tracking-[.16em] text-moss">{role === 'therapist' ? 'Therapist workspace' : 'Client portal'}</p><h1 className="font-display text-4xl font-semibold tracking-[-.04em]">Create your space</h1><p className="mt-3 text-sm leading-6 text-ink/55">{role === 'therapist' ? 'Set up a calmer home for your practice.' : 'Your care journey starts with a conversation.'}</p><div className="my-8 grid grid-cols-2 rounded-xl bg-cream p-1"><RoleButton active={role === 'therapist'} onClick={() => setRole('therapist')}>Therapist</RoleButton><RoleButton active={role === 'client'} onClick={() => setRole('client')}>Client</RoleButton></div><form onSubmit={submit} className="space-y-4">{fields.map(([key, label, type]) => <label key={key} className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><span className="relative block"><input required={key !== 'presenting_concern'} type={key === 'password' && showPassword ? 'text' : type} value={form[key]} onChange={update(key)} minLength={key === 'password' ? 8 : undefined} className="h-12 w-full rounded-xl border border-ink/10 bg-cream px-4 pr-12 text-sm outline-none focus:border-moss" />{key === 'password' && <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 rounded-md p-1 text-ink/40 hover:text-moss">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}</span></label>)}{state.error && <p className="rounded-xl bg-[#fae2d9] px-4 py-3 text-sm font-medium text-[#9a4932]">{state.error}</p>}{state.message && <p className="rounded-xl bg-sage px-4 py-3 text-sm font-medium text-moss">{state.message}</p>}<button disabled={state.loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-white hover:bg-moss disabled:opacity-60">{state.loading ? 'Creating...' : role === 'therapist' ? 'Create therapist account' : 'Request client access'} <ArrowRight size={17} /></button><div className="flex items-center gap-3 py-1 text-xs font-semibold uppercase tracking-[.14em] text-ink/35"><span className="h-px flex-1 bg-ink/10" />or<span className="h-px flex-1 bg-ink/10" /></div><GoogleAuthButton disabled={state.loading} onSuccess={signUpWithGoogle} onError={() => setState({ loading: false, error: 'Unable to create your account with Google.', message: '' })} /><p className="text-center text-sm text-ink/55">Already have an account? <Link to="/login" className="font-bold text-moss hover:text-ink">Sign in</Link></p></form></div></div></div></main>
}

function Logo() { return <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss font-display text-lg font-bold text-white">u</span> }
function RoleButton({ active, onClick, children }) { return <button type="button" onClick={onClick} className={`rounded-lg py-2.5 text-sm font-bold ${active ? 'bg-white text-ink shadow-sm' : 'text-ink/45'}`}>{children}</button> }