import { useEffect, useState } from 'react'
import {
  PackagePlus,
  Save,
  Package,
  Clock,
  IndianRupee,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Edit2,
  Trash2,
} from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import PageBackButton from '../../components/common/PageBackButton'

const presets = {
  3: { name: 'Starter package', expiry_days: 45 },
  5: { name: 'Steady support', expiry_days: 75 },
  7: { name: 'Deep support', expiry_days: 100 },
}

const initialForm = {
  name: '',
  session_count: 3,
  per_session_rate: 1500,
  total_price: 4500,
  expiry_days: 45,
  description: '',
}

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function loadPackages() {
    try {
      const { data } = await axiosInstance.get('/packages')
      setPackages(data.packages || [])
    } catch (error) {
      setMessage('Unable to load packages.')
    }
  }

  useEffect(() => {
    loadPackages()
  }, [])

  function choosePreset(count) {
    setForm((current) => ({
      ...current,
      session_count: count,
      name: presets[count].name,
      expiry_days: presets[count].expiry_days,
      total_price: Number(current.per_session_rate) * count,
    }))
  }

  function updateSessionCount(value) {
    const count = Math.max(1, Math.min(50, Number(value) || 1))

    setForm((current) => ({
      ...current,
      session_count: count,
      total_price: Number(current.per_session_rate) * count,
      ...(presets[count] || {}),
    }))
  }

  async function createPackage(event) {
    event.preventDefault()

    setSaving(true)
    setMessage('')

    try {
      await axiosInstance.post('/packages', form)

      setMessage('✓ Package created successfully.')
      setForm(initialForm)
      setShowForm(false)

      await loadPackages()

      setTimeout(() => setMessage(''), 4000)
    } catch (error) {
      setMessage(
        error.response?.data?.message || '✗ Unable to create package.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="relative mx-auto max-w-[1440px] overflow-hidden px-5 py-8 sm:px-8 lg:px-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-40 top-16 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-[600px] h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />

      <div className="relative space-y-10">
        <PageBackButton to="/dashboard" label="Back to dashboard" />

        {/* Header */}
        <header className="animate-[fadeSlideDown_.6s_ease-out]">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-violet-600">
                <Sparkles size={13} />
                Offers & packages
              </div>

              <h1 className="font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B] sm:text-5xl">
                Packages
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
                Create flexible therapy packages that make it easier for
                clients to commit to their care journey.
              </p>
            </div>

            {/* Package count */}
            <div className="group flex items-center gap-3 rounded-2xl border border-violet-100 bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/50">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Package size={21} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Active packages
                </p>

                <p className="mt-0.5 text-xl font-bold text-[#1E293B]">
                  {packages.length}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Message */}
        {message && (
          <div className="flex animate-[fadeSlideDown_.4s_ease-out] items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-semibold text-violet-700 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white">
              <Check size={15} />
            </div>
            <span>{message}</span>
          </div>
        )}

        {/* EXISTING PACKAGES – Full width grid first */}
        {packages.length > 0 && (
          <div className="animate-[fadeSlideUp_.6s_.1s_both]">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[.15em] text-violet-500">
                Your offers
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1E293B] sm:text-3xl">
                Existing packages
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                {packages.length} package{packages.length !== 1 ? 's' : ''} available for clients to purchase.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {packages.map((item, index) => (
                <article
                  key={item._id}
                  style={{
                    animationDelay: `${index * 80 + 200}ms`,
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:z-10 hover:scale-[1.02] hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/50 opacity-0 animate-[fadeSlideUp_.5s_ease-out_forwards]"
                >
                  {/* Top accent */}
                  <div className="h-1 w-full bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600 opacity-70 transition-opacity group-hover:opacity-100" />

                  <div className="flex flex-col p-5 h-full">
                    {/* Header with icon */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 text-violet-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Package size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-semibold text-[#1E293B] line-clamp-2">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {item.session_count} sessions
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                      <p className="text-xs font-bold text-violet-500 uppercase tracking-wider">
                        Package value
                      </p>
                      <p className="text-lg font-bold text-[#1E293B] mt-1">
                        ₹{Number(item.total_price).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-violet-600 mt-2">
                        ₹{Number(item.per_session_rate).toLocaleString('en-IN')}/session
                      </p>
                    </div>

                    {/* Validity */}
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                      <Clock size={13} className="text-violet-500" />
                      {item.expiry_days} day validity
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-[#64748B] line-clamp-2 mb-4 flex-1">
                        {item.description}
                      </p>
                    )}

                    {/* Status badge */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-600">
                        <Check size={10} />
                        Available
                      </span>
                      <div className="flex items-center gap-1">            
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* CREATE PACKAGE FORM OR TOGGLE */}
        <div className="animate-[fadeSlideUp_.6s_.2s_both]">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="group relative w-full overflow-hidden rounded-[30px] border border-dashed border-slate-300 bg-white/50 p-8 text-center shadow-sm transition-all duration-300 hover:border-violet-400 hover:bg-violet-50/30 hover:shadow-md sm:p-12"
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <PackagePlus size={28} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-[#1E293B]">
                    Create a new package
                  </h3>
                  <p className="mt-2 text-sm text-[#64748B]">
                    Add another package for your clients
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-bold text-violet-600">
                  <Sparkles size={13} />
                  Quick & easy setup
                </div>
              </div>
            </button>
          ) : (
            <form
              onSubmit={createPackage}
              className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600" />

              <div className="p-6 sm:p-8">
                {/* Form heading */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200 transition-all duration-300 group-hover:scale-105 group-hover:shadow-violet-300">
                      <PackagePlus size={22} />
                    </div>

                    <div>
                      <h2 className="font-display text-2xl font-semibold text-[#1E293B]">
                        New package
                      </h2>

                      <p className="mt-1 text-sm text-[#64748B]">
                        Build a package your clients will love.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#1E293B]"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Presets */}
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[#64748B]">
                      Quick presets
                    </p>

                    <span className="text-xs text-slate-400">
                      or create your own
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[3, 5, 7].map((count) => {
                      const active = form.session_count === count

                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => choosePreset(count)}
                          className={`group/preset relative overflow-hidden rounded-xl border px-3 py-3 text-center transition-all duration-300 ${
                            active
                              ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm shadow-violet-100'
                              : 'border-slate-200 bg-white text-[#64748B] hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-600'
                          }`}
                        >
                          {active && (
                            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white">
                              <Check size={10} />
                            </span>
                          )}

                          <span className="block text-lg font-bold">
                            {count}
                          </span>

                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            sessions
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom count */}
                  <label className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-[#F8FAFC] px-4 py-3 transition-all duration-300 hover:border-violet-300 hover:bg-violet-50/30">
                    <span className="text-sm font-semibold text-[#64748B]">
                      Custom sessions
                    </span>

                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={form.session_count}
                      onChange={(event) =>
                        updateSessionCount(event.target.value)
                      }
                      className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-bold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                  </label>
                </div>

                {/* Form grid – 2 columns */}
                <div className="grid gap-6 mb-8 md:grid-cols-2">
                  {/* Left column */}
                  <div className="space-y-5">
                    <label className="block">
                      <span className="text-sm font-bold text-[#1E293B]">
                        Package name
                      </span>

                      <input
                        required
                        value={form.name}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            name: event.target.value,
                          })
                        }
                        placeholder="e.g. 5 Session Wellness Plan"
                        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label className="block">
                      <span className="flex items-center gap-1.5 text-sm font-bold text-[#1E293B]">
                        <IndianRupee size={14} className="text-violet-500" />
                        Per-session rate
                      </span>

                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-violet-500">
                          ₹
                        </span>

                        <input
                          type="number"
                          min="1"
                          value={form.per_session_rate}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              per_session_rate: event.target.value,
                              total_price:
                                Number(event.target.value) *
                                form.session_count,
                            })
                          }
                          className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 text-sm font-semibold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="flex items-center gap-1.5 text-sm font-bold text-[#1E293B]">
                        <Clock size={14} className="text-violet-500" />
                        Expires after days
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={form.expiry_days}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            expiry_days: event.target.value,
                          })
                        }
                        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-semibold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />
                    </label>
                  </div>

                  {/* Right column */}
                  <div className="flex flex-col gap-5">
                    <label className="block">
                      <span className="text-sm font-bold text-[#1E293B]">
                        Total price
                      </span>

                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-violet-500">
                          ₹
                        </span>

                        <input
                          type="number"
                          min="1"
                          value={form.total_price}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              total_price: event.target.value,
                            })
                          }
                          className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 text-sm font-semibold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                        />
                      </div>
                    </label>

                    {/* Price summary – sticky at bottom */}
                    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4 mt-auto">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-violet-500">
                            Package value
                          </p>

                          <p className="mt-1 text-2xl font-bold text-[#1E293B]">
                            ₹
                            {Number(form.total_price || 0).toLocaleString(
                              'en-IN'
                            )}
                          </p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-500 shadow-sm">
                          <IndianRupee size={20} />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-violet-600">
                        <Check size={13} />
                        {form.session_count} sessions

                        <span className="text-violet-300">•</span>

                        {form.expiry_days} days validity
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <label className="block mb-7">
                  <span className="text-sm font-bold text-[#1E293B]">
                    Description
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    placeholder="Describe what's included in this package..."
                    className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm leading-6 text-[#1E293B] outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </label>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-full border border-slate-200 px-6 py-3.5 text-sm font-bold text-[#1E293B] transition-all duration-300 hover:bg-slate-50 hover:border-slate-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="group/button flex-1 relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-600 hover:to-purple-700 hover:shadow-xl hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-700 group-hover/button:translate-x-full" />

                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save package

                        <ArrowRight
                          size={15}
                          className="transition-transform duration-300 group-hover/button:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Empty state */}
        {packages.length === 0 && !showForm && (
          <div className="group relative overflow-hidden rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm transition-all duration-300 hover:border-violet-300 hover:bg-violet-50/20 sm:p-14 animate-[fadeSlideUp_.6s_.3s_both]">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-100/40 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-violet-100">
                <Package size={28} />
              </div>

              <h3 className="mt-5 font-display text-xl font-semibold text-[#1E293B]">
                No packages yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748B]">
                Create your first package to give clients a convenient
                way to purchase multiple sessions together.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-bold text-violet-600">
                <Sparkles size={13} />
                Start with a preset
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeSlideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}