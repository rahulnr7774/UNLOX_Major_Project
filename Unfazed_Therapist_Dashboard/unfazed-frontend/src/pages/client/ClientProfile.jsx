import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Leaf,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import { isValidEmail, isValidPassword, isValidPhone } from '../../utils/validation'

const requiredFields = [
  'name',
  'email',
  'phone',
  'date_of_birth',
  'gender',
  'presenting_concern',
  'history',
]

function isComplete(profile) {
  return requiredFields.every((field) =>
    Boolean(String(profile[field] || '').trim())
  )
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
    history: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [mustChangePassword, setMustChangePassword] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 50)

    axiosInstance
      .get('/clients/portal')
      .then(({ data }) => {
        setForm({
          name: data.client.name || '',
          email: data.client.email || '',
          phone: data.client.phone || '',
          date_of_birth: data.client.date_of_birth
            ? data.client.date_of_birth.slice(0, 10)
            : '',
          gender: data.client.gender || '',
          presenting_concern: data.client.presenting_concern || '',
          history: data.client.history || '',
          current_password: '',
          new_password: '',
          confirm_password: '',
        })
        setMustChangePassword(Boolean(data.client.must_change_password))
      })
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ||
            'Unable to load your profile.'
        )
      )
      .finally(() => setLoading(false))

    return () => window.clearTimeout(timer)
  }, [])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (error) setError('')
  }

  async function submit(event) {
    event.preventDefault()

    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!isValidPhone(form.phone)) {
      setError('Phone number must contain exactly 10 digits.')
      return
    }
    if (mustChangePassword && !isValidPassword(form.new_password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number and special character.')
      return
    }
    if (mustChangePassword && form.new_password !== form.confirm_password) {
      setError('Your new passwords do not match.')
      return
    }

    if (!isComplete(form) || (mustChangePassword && (!form.current_password || !form.new_password || !form.confirm_password))) {
      setError(
        'Please complete every field before continuing to your portal.'
      )
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data } = await axiosInstance.patch(
        '/clients/profile',
        form
      )

      updateUser({
        ...data.client,
        role: 'client',
      })

      navigate('/client-portal', {
        replace: true,
      })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to save your profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  const completion = useMemo(() => {
    const completed = requiredFields.filter((field) =>
      Boolean(String(form[field] || '').trim())
    ).length

    return Math.round((completed / requiredFields.length) * 100)
  }, [form, mustChangePassword])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF9] text-sm text-[#64748B]">
        Loading your profile...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F8FAF9] px-4 py-6 text-[#1E293B] sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/client-portal')}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#64748B] transition-colors duration-150 hover:text-[#1E293B]"
        >
          <ArrowLeft size={16} />
          Back to portal
        </button>

        <div
          className={`grid overflow-hidden rounded-[28px] border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-opacity duration-300 ${
            mounted ? 'opacity-100' : 'opacity-0'
          } lg:grid-cols-[280px_1fr]`}
        >
          {/* Left panel */}
          <aside className="relative hidden overflow-hidden bg-[#F0FDF4] p-7 lg:block">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-100/70" />
            <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-emerald-100/50" />

            <div className="relative flex h-full flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                <Leaf size={23} />
              </div>

              <div className="mt-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Client onboarding
                </p>

                <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[#1E293B]">
                  A little about you
                </h1>

                <p className="mt-4 text-sm leading-6 text-[#64748B]">
                  These details help your therapist understand your needs
                  and prepare for your sessions.
                </p>
              </div>

              <div className="mt-auto pt-10">
                <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Profile completion
                    </span>

                    <span className="text-sm font-bold text-emerald-600">
                      {completion}%
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${completion}%` }}
                    />
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#64748B]">
                    Your information is used to personalize your care
                    experience.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Form */}
          <section className="p-5 sm:p-8 lg:p-10">
            {/* Mobile header */}
            <div className="mb-8 flex items-start gap-4 lg:hidden">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Leaf size={22} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Client profile
                </p>

                <h1 className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
                  Complete your profile
                </h1>

                <p className="mt-1.5 text-sm leading-5 text-[#64748B]">
                  Tell us a little about yourself before continuing.
                </p>
              </div>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                    Your information
                  </p>

                  <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#1E293B]">
                    Complete your profile
                  </h2>

                  <p className="mt-2 text-sm text-[#64748B]">
                    Please provide accurate information to help us support
                    you better.
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <UserRound size={19} />
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="mt-8">
              {/* Basic information */}
              <div>
                <SectionHeading
                  number="01"
                  title="Basic information"
                  description="Your contact and personal details"
                />

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    icon={UserRound}
                    value={form.name}
                    onChange={(value) => updateField('name', value)}
                    placeholder="Enter your full name"
                  />

                  <Field
                    label="Email address"
                    icon={Mail}
                    type="email"
                    value={form.email}
                    onChange={(value) => updateField('email', value)}
                    placeholder="you@example.com"
                  />

                  <Field
                    label="Phone number"
                    icon={Phone}
                    value={form.phone}
                    onChange={(value) => updateField('phone', value)}
                    placeholder="Enter your phone number"
                  />

                  <Field
                    label="Date of birth"
                    icon={CalendarDays}
                    type="date"
                    value={form.date_of_birth}
                    onChange={(value) =>
                      updateField('date_of_birth', value)
                    }
                  />

                  <SelectField
                    label="Gender"
                    value={form.gender}
                    onChange={(value) => updateField('gender', value)}
                  />
                </div>
              </div>

              {/* Concerns */}
              <div className="mt-9 border-t border-[#E2E8F0] pt-8">
                <SectionHeading
                  number="02"
                  title="Your wellbeing"
                  description="Help us understand what brings you here"
                />

                <div className="mt-5 space-y-5">
                  <TextField
                    label="Presenting concern"
                    value={form.presenting_concern}
                    onChange={(value) =>
                      updateField('presenting_concern', value)
                    }
                    placeholder="What would you like support with?"
                    hint="You can briefly describe what you are currently experiencing."
                  />

                  <TextField
                    label="Relevant history"
                    value={form.history}
                    onChange={(value) =>
                      updateField('history', value)
                    }
                    placeholder="Share any history that may help your therapist understand your needs."
                    hint="Include anything you feel would be helpful for your therapist to know."
                  />
                </div>
              </div>

              {mustChangePassword && (
                <div className="mt-9 border-t border-[#E2E8F0] pt-8">
                  <SectionHeading
                    number="03"
                    title="Secure your account"
                    description="Replace the temporary password from your email"
                  />

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Temporary password"
                      icon={LockKeyhole}
                      type="password"
                      value={form.current_password}
                      onChange={(value) => updateField('current_password', value)}
                      placeholder="Enter the password from your email"
                    />
                    <Field
                      label="New password"
                      icon={LockKeyhole}
                      type="password"
                      value={form.new_password}
                      onChange={(value) => updateField('new_password', value)}
                      placeholder="At least 8 characters"
                    />
                    <Field
                      label="Confirm new password"
                      icon={LockKeyhole}
                      type="password"
                      value={form.confirm_password}
                      onChange={(value) => updateField('confirm_password', value)}
                      placeholder="Repeat your new password"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit */}
              <div className="mt-8 border-t border-[#E2E8F0] pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-[#94A3B8]">
                    Please make sure all information is accurate before
                    continuing.
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 text-sm font-bold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      'Saving profile...'
                    ) : (
                      <>
                        Save and continue
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}

function SectionHeading({ number, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-600">
        {number}
      </span>

      <div>
        <h3 className="text-sm font-bold text-[#1E293B]">
          {title}
        </h3>

        <p className="mt-0.5 text-xs text-[#94A3B8]">
          {description}
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#334155]">
        {label}
      </span>

      <span className="relative block">
        <Icon
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
        />

        <input
          required
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#FAFAF9] pl-11 pr-4 text-sm text-[#1E293B] outline-none placeholder:text-[#A8B1BC] transition-colors duration-150 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
        />
      </span>
    </label>
  )
}

function SelectField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#334155]">
        {label}
      </span>

      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-[#E2E8F0] bg-[#FAFAF9] px-4 text-sm text-[#1E293B] outline-none transition-colors duration-150 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
      >
        <option value="">Select gender</option>
        <option value="female">Female</option>
        <option value="male">Male</option>
        <option value="non-binary">Non-binary</option>
        <option value="prefer-not-to-say">Prefer not to say</option>
      </select>
    </label>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#334155]">
        {label}
      </span>

      <textarea
        required
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-[#E2E8F0] bg-[#FAFAF9] px-4 py-3 text-sm leading-6 text-[#1E293B] outline-none placeholder:text-[#A8B1BC] transition-colors duration-150 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
      />

      {hint && (
        <p className="mt-2 text-[11px] leading-5 text-[#94A3B8]">
          {hint}
        </p>
      )}
    </label>
  )
}