import { ArrowLeft, ArrowRight, CalendarDays, Leaf, Mail, Phone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

const requiredFields = ['name', 'email', 'phone', 'date_of_birth', 'gender', 'presenting_concern', 'history']

function isComplete(profile) {
  return requiredFields.every((field) => Boolean(String(profile[field] || '').trim()))
}

export default function ClientProfile() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    presenting_concern: '',
    history: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance.get('/clients/portal')
      .then(({ data }) => setForm({
        name: data.client.name || '',
        email: data.client.email || '',
        phone: data.client.phone || '',
        date_of_birth: data.client.date_of_birth ? data.client.date_of_birth.slice(0, 10) : '',
        gender: data.client.gender || '',
        presenting_concern: data.client.presenting_concern || '',
        history: data.client.history || ''
      }))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your profile.'))
      .finally(() => setLoading(false))
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!isComplete(form)) {
      setError('Please complete every field before continuing to your portal.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data } = await axiosInstance.patch('/clients/profile', form)
      updateUser({ ...data.client, role: 'client' })
      navigate('/client-portal', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF9] text-sm text-[#64748B]">
      Loading your profile...
    </main>
  )

  return (
    <main className="min-h-screen bg-[#FAFAF9] px-5 py-8 text-[#1E293B] sm:px-8 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate('/client-portal')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#64748B] transition-colors hover:text-[#1E293B]"
        >
          <ArrowLeft size={16} /> Back to portal
        </button>

        <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5 border-b border-[#E2E8F0] pb-8 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <Leaf size={30} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Client profile</p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-[#1E293B]">Complete your profile</h1>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Add these details before entering your client portal.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Full name"
                icon={UserRound}
                value={form.name}
                onChange={(value) => updateField('name', value)}
              />
              <Field
                label="Email"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(value) => updateField('email', value)}
              />
              <Field
                label="Phone"
                icon={Phone}
                value={form.phone}
                onChange={(value) => updateField('phone', value)}
              />
              <Field
                label="Date of birth"
                icon={CalendarDays}
                type="date"
                value={form.date_of_birth}
                onChange={(value) => updateField('date_of_birth', value)}
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#1E293B]">Gender</span>
                <select
                  required
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                  className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#FAFAF9] px-4 text-sm text-[#1E293B] outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </label>
            </div>

            <TextField
              label="Presenting concern"
              value={form.presenting_concern}
              onChange={(value) => updateField('presenting_concern', value)}
              placeholder="What would you like support with?"
            />

            <TextField
              label="Relevant history"
              value={form.history}
              onChange={(value) => updateField('history', value)}
              placeholder="Share any history that may help your therapist understand your needs."
            />

            {error && (
              <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              disabled={saving}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
            >
              {saving ? 'Saving profile...' : 'Save and continue'}
              <ArrowRight size={17} />
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

function Field({ label, icon: Icon, type = 'text', value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#1E293B]">{label}</span>
      <span className="relative block">
        <Icon size={16} className="absolute left-4 top-3.5 text-[#64748B]" />
        <input
          required
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#FAFAF9] pl-11 pr-4 text-sm text-[#1E293B] outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
      </span>
    </label>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#1E293B]">{label}</span>
      <textarea
        required
        rows="4"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-[#E2E8F0] bg-[#FAFAF9] px-4 py-3 text-sm leading-6 text-[#1E293B] outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </label>
  )
}