import { useEffect, useState } from 'react'
import { PackagePlus, Save } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'

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

  async function loadPackages() {
    const { data } = await axiosInstance.get('/packages')
    setPackages(data.packages || [])
  }

  useEffect(() => {
    let cancelled = false
    axiosInstance.get('/packages')
      .then(({ data }) => {
        if (!cancelled) setPackages(data.packages || [])
      })
      .catch(() => {
        if (!cancelled) setMessage('Unable to load packages.')
      })
    return () => { cancelled = true }
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
    try {
      await axiosInstance.post('/packages', form)
      setMessage('Package created.')
      setForm(initialForm)
      await loadPackages()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create package.')
    }
  }

  return (
    <section className="space-y-8">
      <header>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[.18em] text-moss">Offers</p>
        <h1 className="font-display text-3xl font-semibold">Packages</h1>
        <p className="mt-2 text-ink/60">Create packages clients can purchase before booking sessions.</p>
      </header>

      {message && <p className="rounded-xl bg-sage px-4 py-3 text-sm font-semibold text-moss">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={createPackage} className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <PackagePlus className="text-moss" />
            <h2 className="font-display text-2xl font-semibold">New package</h2>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
           
            <label className="flex items-center gap-2 text-sm font-semibold">
              Custom
              <input type="number" min="1" max="50" value={form.session_count} onChange={(event) => updateSessionCount(event.target.value)} className="h-10 w-20 rounded-xl border border-ink/10 px-2 text-center outline-none focus:border-moss" />
            </label>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">Name
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-ink/10 px-3 outline-none focus:border-moss" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Per-session rate
                <input type="number" min="1" value={form.per_session_rate} onChange={(event) => setForm({ ...form, per_session_rate: event.target.value, total_price: Number(event.target.value) * form.session_count })} className="mt-2 h-11 w-full rounded-xl border border-ink/10 px-3 outline-none focus:border-moss" />
              </label>
              <label className="block text-sm font-semibold">Total price
                <input type="number" min="1" value={form.total_price} onChange={(event) => setForm({ ...form, total_price: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-ink/10 px-3 outline-none focus:border-moss" />
              </label>
            </div>
            <label className="block text-sm font-semibold">Expires after days
              <input type="number" min="1" value={form.expiry_days} onChange={(event) => setForm({ ...form, expiry_days: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-ink/10 px-3 outline-none focus:border-moss" />
            </label>
            <label className="block text-sm font-semibold">Description
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-ink/10 p-3 outline-none focus:border-moss" />
            </label>
          </div>

          <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-moss"><Save size={16} /> Save package</button>
        </form>

        <div className="space-y-3">
          {packages.map((item) => (
            <div key={item._id} className="rounded-2xl border border-ink/10 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">{item.name}</h2>
                  <p className="mt-1 text-sm text-ink/55">{item.session_count} sessions · Expires in {item.expiry_days} days</p>
                </div>
                <strong className="text-moss">INR {item.total_price}</strong>
              </div>
              <p className="mt-3 text-sm text-ink/65">{item.description || 'Available for clients to purchase.'}</p>
            </div>
          ))}
          {!packages.length && <p className="rounded-2xl border border-dashed border-ink/15 p-5 text-sm text-ink/55">No packages created yet.</p>}
        </div>
      </div>
    </section>
  )
}
