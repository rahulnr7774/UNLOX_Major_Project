import { useEffect, useState } from 'react'
import { ArrowRight, Check, CircleUserRound, Plus, X, User, FileText, Tag, Languages } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import specializationOptions from '../../data/specializations.json'

const requiredFields = ['name', 'bio', 'specializations', 'languages']

function isComplete(profile) {
	return requiredFields.every((field) => {
		const value = profile[field]
		return Array.isArray(value) ? value.some((item) => item.trim()) : Boolean(value?.trim())
	})
}

function addPendingValues(values, pendingValue) {
	return [...values, ...pendingValue.split(',').map((item) => item.trim()).filter(Boolean)]
}

export default function TherapistProfile() {
	const { user, updateUser } = useAuth()
	const navigate = useNavigate()
	const [form, setForm] = useState({ name: '', bio: '', specializations: [], languages: [] })
	const [specialization, setSpecialization] = useState('')
	const [language, setLanguage] = useState('')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		axiosInstance.get('/therapists/profile')
			.then(({ data }) => setForm({
				name: data.therapist.name || '',
				bio: data.therapist.bio || '',
				specializations: data.therapist.specializations || [],
				languages: data.therapist.languages || []
			}))
			.catch(() => setError('Unable to load your profile.'))
			.finally(() => setLoading(false))
	}, [])

	function addValue(field, value, clear) {
		const normalized = value.trim()
		if (!normalized || form[field].includes(normalized)) return
		setForm((current) => ({ ...current, [field]: [...current[field], normalized] }))
		clear('')
	}

	function removeValue(field, value) {
		setForm((current) => ({ ...current, [field]: current[field].filter((item) => item !== value) }))
	}

	async function submit(event) {
		event.preventDefault()
		const profile = {
			...form,
			specializations: specialization && specialization !== 'Other'
				? [...form.specializations, specialization]
				: form.specializations,
			languages: addPendingValues(form.languages, language)
		}
		if (specialization === 'Other' && language.trim()) {
			profile.specializations = addPendingValues(profile.specializations, language)
		}
		if (!isComplete(profile)) {
			setError('Please complete every profile field before continuing.')
			return
		}
		setSaving(true)
		setError('')
		try {
			const { data } = await axiosInstance.patch('/therapists/profile', profile)
			updateUser({ ...user, ...data.therapist })
			navigate('/dashboard', { replace: true })
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'Unable to save your profile.')
		} finally {
			setSaving(false)
		}
	}

	if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-sm text-[#64748B]">Loading your profile...</main>

	return (
		<main className="min-h-screen bg-[#F8FAFC] px-5 py-10 sm:px-8">
			<div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
				<div className="mb-8 flex items-start gap-4">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
						<CircleUserRound size={25} />
					</div>
					<div>
						<p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">Therapist profile</p>
						<h1 className="mt-2 font-display text-3xl font-semibold text-[#1E293B]">Complete your profile</h1>
						<p className="mt-2 text-sm leading-6 text-[#64748B]">
							Add a few details so clients can understand your practice before you continue.
						</p>
					</div>
				</div>

				<form onSubmit={submit} className="space-y-6">
					<Field
						label="Name"
						value={form.name}
						onChange={(value) => setForm({ ...form, name: value })}
						icon={<User size={16} className="text-[#64748B]" />}
					/>

					<label className="block">
						<span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
							<FileText size={16} className="text-violet-500" /> Bio
						</span>
						<textarea
							required
							rows="5"
							value={form.bio}
							onChange={(event) => setForm({ ...form, bio: event.target.value })}
							className="w-full resize-y rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
							placeholder="Tell clients about your approach and experience"
						/>
					</label>

					<TagField
						label="Specializations"
						values={form.specializations}
						value={specialization}
						setValue={setSpecialization}
						onAdd={() => addValue('specializations', specialization, setSpecialization)}
						onRemove={(value) => removeValue('specializations', value)}
						placeholder="e.g. Anxiety"
						icon={<Tag size={16} className="text-violet-500" />}
						options={specializationOptions}
					/>

					<TagField
						label="Languages"
						values={form.languages}
						value={language}
						setValue={setLanguage}
						onAdd={() => addValue('languages', language, setLanguage)}
						onRemove={(value) => removeValue('languages', value)}
						placeholder="e.g. English"
						icon={<Languages size={16} className="text-violet-500" />}
					/>

					{error && (
						<p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
							{error}
						</p>
					)}

					<button
						disabled={saving}
						className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-5 text-sm font-bold text-white transition-colors hover:bg-violet-600 disabled:opacity-60"
					>
						{saving ? 'Saving profile...' : 'Save and continue'}
						{saving ? <Check size={17} /> : <ArrowRight size={17} />}
					</button>
				</form>
			</div>
		</main>
	)
}

function Field({ label, value, onChange, icon }) {
	return (
		<label className="block">
			<span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
				{icon}
				{label}
			</span>
			<input
				required
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
			/>
		</label>
	)
}

function TagField({ label, values, value, setValue, onAdd, onRemove, placeholder, icon, options }) {
	const isSpecialization = label === 'Specializations'
	return (
		<div>
			<span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
				{icon}
				{label}
			</span>
			{isSpecialization ? (
				<div className="flex gap-2">
					<select
						value={value === 'Other' ? 'Other' : value}
						onChange={(event) => setValue(event.target.value)}
						className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
					>
						<option value="">Select a specialization</option>
						{options.map((option) => (
							<option key={option} value={option}>{option}</option>
						))}
						<option value="Other">Other</option>
					</select>
					{value === 'Other' && (
						<input
							value={value}
							onChange={(event) => setValue(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault()
									onAdd()
								}
							}}
							className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
							placeholder="Enter your specialization"
						/>
					)}
					<button
						type="button"
						onClick={onAdd}
						aria-label={`Add ${label.toLowerCase()}`}
						className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors hover:bg-violet-500 hover:text-white"
					>
						<Plus size={18} />
					</button>
				</div>
			) : (
				<div className="flex gap-2">
					<input
						value={value}
						onChange={(event) => setValue(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault()
								onAdd()
							}
						}}
						className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
						placeholder={placeholder}
					/>
					<button
						type="button"
						onClick={onAdd}
						aria-label={`Add ${label.toLowerCase()}`}
						className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors hover:bg-violet-500 hover:text-white"
					>
						<Plus size={18} />
					</button>
				</div>
			)}
			<div className="mt-3 flex flex-wrap gap-2">
				{values.map((item) => (
					<span key={item} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-sm text-violet-700">
						{item}
						<button type="button" onClick={() => onRemove(item)} aria-label={`Remove ${item}`}>
							<X size={14} className="hover:text-red-500" />
						</button>
					</span>
				))}
			</div>
		</div>
	)
}