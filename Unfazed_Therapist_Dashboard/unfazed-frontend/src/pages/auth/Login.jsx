import { useEffect, useState } from 'react'
import { ArrowRight, HeartHandshake, LockKeyhole, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

const headlines = [
  'Care works better when your practice does too.',
  'Return to the work that matters.',
  'Create space for meaningful conversations.',
  'Keep every session grounded and human.',
]

export default function Login() {
  const [role, setRole] = useState('therapist')
  const [headlineIndex, setHeadlineIndex] = useState(0)
  const [form, setForm] = useState({ email: 'testT1@gmail.com', password: 'testpass' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeadlineIndex((current) => (current + 1) % headlines.length)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [])

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosInstance.post('/auth/login', form)
      localStorage.setItem('unfazed_token', data.token)
      const account = data.client ? { ...data.client, role: 'client' } : { ...data.therapist, role: 'therapist' }
      login(account)
      navigate(account.role === 'client' ? '/client-portal' : '/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      role={role}
      setRole={setRole}
      headline={headlines[headlineIndex]}
      headlineIndex={headlineIndex}
      title="Welcome back"
      subtitle="Make room for the work that matters."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field icon={Mail} label="Email address" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <Field icon={LockKeyhole} label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
        {error && <p className="rounded-xl bg-[#fae2d9] px-4 py-3 text-sm font-medium text-[#9a4932]">{error}</p>}
        <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-white hover:bg-moss disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={17} />
        </button>
        <p className="text-center text-sm text-ink/55">Don't have an account? <Link to="/register" className="font-bold text-moss hover:text-ink">Create one</Link></p>
      </form>
    </AuthLayout>
  )
}

function Field({ icon: Icon, label, type, value, onChange }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><span className="relative block"><Icon size={17} className="absolute left-4 top-3.5 text-ink/35" /><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-ink/10 bg-cream pl-11 pr-4 text-sm outline-none focus:border-moss" /></span></label>
}

function AuthLayout({ role, setRole, headline, headlineIndex, title, subtitle, children }) {
  return <main className="min-h-screen bg-cream px-5 py-8 sm:px-8"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(31,41,36,.08)] lg:grid-cols-[.9fr_1.1fr]"><div className="soft-grid hidden bg-sage p-10 lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss font-display text-lg font-bold text-white">u</span><span className="font-display text-xl font-semibold">unfazed</span></div><div><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-moss"><HeartHandshake /></div><h2 key={headlineIndex} aria-live="polite" className="auth-headline max-w-sm font-display text-4xl font-semibold leading-tight">{headline}</h2></div><p className="text-xs font-semibold uppercase tracking-[.16em] text-moss">Private by design · Built for care</p></div><div className="p-6 sm:p-12 lg:p-16"><div className="mb-10 flex items-center gap-3 lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss font-display text-lg font-bold text-white">u</span><span className="font-display text-xl font-semibold">unfazed</span></div><div className="mx-auto max-w-md"><div className="mb-8"><p className="mb-3 text-sm font-semibold uppercase tracking-[.16em] text-moss">{role === 'therapist' ? 'Therapist workspace' : 'Client portal'}</p><h1 className="font-display text-4xl font-semibold tracking-[-.04em]">{title}</h1><p className="mt-3 text-sm leading-6 text-ink/55">{subtitle}</p></div><div className="mb-8 grid grid-cols-2 rounded-xl bg-cream p-1"><button type="button" onClick={() => setRole('therapist')} className={`rounded-lg py-2.5 text-sm font-bold ${role === 'therapist' ? 'bg-white text-ink shadow-sm' : 'text-ink/45'}`}>Therapist</button><button type="button" onClick={() => setRole('client')} className={`rounded-lg py-2.5 text-sm font-bold ${role === 'client' ? 'bg-white text-ink shadow-sm' : 'text-ink/45'}`}>Client</button></div>{children}</div></div></div></main>
}
