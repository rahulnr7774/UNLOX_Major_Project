import { useEffect, useState } from 'react'
import {
	ArrowRight,
	CircleUserRound,
	ImagePlus,
	Plus,
	X,
	User,
	FileText,
	Tag,
	Languages,
	Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageBackButton from '../../components/common/PageBackButton'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import specializationOptions from '../../data/specializations.json'

const requiredFields = ['name', 'bio', 'specializations', 'languages']

const languageOptions = [
	'English',
	'Hindi',
	'Malayalam',
	'Tamil',
	'Telugu',
	'Kannada',
	'Bengali',
	'Marathi',
	'Urdu',
	'Other',
]

function isComplete(profile) {
	return requiredFields.every((field) => {
		const value = profile[field]
		return Array.isArray(value)
			? value.some((item) => item.trim())
			: Boolean(value?.trim())
	})
}

function addPendingValues(values, pendingValue) {
	return [
		...values,
		...pendingValue
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean),
	]
}

export default function TherapistProfile() {
	const { user, updateUser } = useAuth()
	const navigate = useNavigate()

	const [form, setForm] = useState({
		name: '',
		bio: '',
		profile_image: '',
		specializations: [],
		languages: [],
	})

	const [specialization, setSpecialization] = useState('')
	const [language, setLanguage] = useState('')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		axiosInstance
			.get('/therapists/profile')
			.then(({ data }) =>
				setForm({
					name: data.therapist.name || '',
					bio: data.therapist.bio || '',
					profile_image: data.therapist.profile_image || '',
					specializations: data.therapist.specializations || [],
					languages: data.therapist.languages || [],
				})
			)
			.catch(() => setError('Unable to load your profile.'))
			.finally(() => setLoading(false))
	}, [])

	function handleProfileImage(event) {
		const file = event.target.files?.[0]
		if (!file) return

		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			setError('Please choose a JPG, PNG or WebP image.')
			return
		}

		if (file.size > 2 * 1024 * 1024) {
			setError('Profile picture must be smaller than 2 MB.')
			return
		}

		const reader = new FileReader()
		reader.onload = () => {
			setForm((current) => ({
				...current,
				profile_image: reader.result,
			}))
			setError('')
		}
		reader.readAsDataURL(file)
	}

	function addValue(field, value, clear) {
		const normalized = value.trim()

		if (!normalized || form[field].includes(normalized)) return

		setForm((current) => ({
			...current,
			[field]: [...current[field], normalized],
		}))

		clear('')
	}

	function removeValue(field, value) {
		setForm((current) => ({
			...current,
			[field]: current[field].filter((item) => item !== value),
		}))
	}

	async function submit(event) {
		event.preventDefault()

		const profile = {
			...form,
			specializations:
				specialization && specialization !== 'Other'
					? [...form.specializations, specialization]
					: form.specializations,
			languages: addPendingValues(form.languages, language),
		}

		if (specialization === 'Other' && language.trim()) {
			profile.specializations = addPendingValues(
				profile.specializations,
				language
			)
		}

		if (!isComplete(profile)) {
			setError('Please complete every profile field before continuing.')
			return
		}

		setSaving(true)
		setError('')

		try {
			const { data } = await axiosInstance.patch(
				'/therapists/profile',
				profile
			)

			updateUser({ ...user, ...data.therapist })

			navigate('/dashboard', { replace: true })
		} catch (requestError) {
			setError(
				requestError.response?.data?.message ||
					'Unable to save your profile.'
			)
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] text-sm text-[#64748B]">
				{/* Background glow */}
				<div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-violet-200/30 blur-3xl" />

				<div className="relative flex flex-col items-center gap-4">
					<div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-500 shadow-lg shadow-violet-100">
						<CircleUserRound
							size={26}
							className="animate-pulse"
						/>

						<span className="absolute inset-0 animate-ping rounded-2xl border border-violet-300/50" />
					</div>

					<p className="animate-pulse">
						Loading your profile...
					</p>
				</div>
			</main>
		)
	}

	return (
		<main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] px-5 py-8 sm:px-8 sm:py-12">

			{/* =====================================================
			    BACKGROUND DECORATION
			===================================================== */}

			<div className="pointer-events-none absolute -right-40 -top-32 h-[420px] w-[420px] animate-[floatSlow_8s_ease-in-out_infinite] rounded-full bg-violet-200/30 blur-3xl" />

			<div className="pointer-events-none absolute -left-48 top-[45%] h-[380px] w-[380px] animate-[floatSlow_10s_ease-in-out_infinite_reverse] rounded-full bg-purple-200/20 blur-3xl" />

			<div className="pointer-events-none absolute bottom-[-180px] right-[20%] h-[360px] w-[360px] rounded-full bg-violet-100/30 blur-3xl" />

			{/* Decorative dots */}
			<div className="pointer-events-none absolute right-[12%] top-24 hidden h-24 w-24 opacity-30 sm:block">
				<div className="grid grid-cols-4 gap-3">
					{Array.from({ length: 16 }).map((_, index) => (
						<span
							key={index}
							className="h-1.5 w-1.5 rounded-full bg-violet-400"
						/>
					))}
				</div>
			</div>

			<div className="relative mx-auto max-w-3xl">

				{/* =====================================================
				    BACK BUTTON
				===================================================== */}

				<div className="animate-[fadeSlideDown_.5s_ease-out]">
					<PageBackButton
						to="/dashboard"
						label="Back to dashboard"
					/>
				</div>

				{/* =====================================================
				    MAIN CARD
				===================================================== */}

				<div className="mt-6 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-sm animate-[fadeSlideUp_.7s_ease-out]">

					{/* Top gradient */}
					<div className="h-1.5 w-full bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600" />

					<div className="p-6 sm:p-10">

						{/* =================================================
						    HEADER
						================================================= */}

						<div className="relative mb-10">

							<div className="flex items-start gap-4">

								{/* Animated icon */}
								<div className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200 transition-all duration-500 hover:scale-105 hover:rotate-3 hover:shadow-xl hover:shadow-violet-300">

									<CircleUserRound
										size={27}
										className="relative z-10"
									/>

									<div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
								</div>

								<div className="min-w-0">

									<div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-violet-600 animate-[fadeSlideDown_.5s_.15s_both]">
										<Sparkles size={11} />
										Therapist profile
									</div>

									<h1 className="font-display text-3xl font-semibold tracking-[-.035em] text-[#1E293B] sm:text-4xl">
										Complete your profile
									</h1>

									<p className="mt-2 max-w-xl text-sm leading-6 text-[#64748B]">
										Add a few details so clients can
										understand your practice before you
										continue.
									</p>

								</div>

							</div>

							{/* Header divider */}
							<div className="mt-8 h-px bg-gradient-to-r from-violet-100 via-slate-100 to-transparent" />

						</div>

						{/* =================================================
						    FORM
						================================================= */}

						<form onSubmit={submit} className="space-y-6">

							{/* Optional profile picture */}
							<div className="animate-[fadeSlideUp_.5s_.1s_both]">
								<div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] p-4">
									<div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-violet-100 text-violet-600">
										{form.profile_image ? (
											<img src={form.profile_image} alt="Profile preview" className="h-full w-full object-cover" />
										) : (
											<div className="flex h-full w-full items-center justify-center"><CircleUserRound size={28} /></div>
										)}
									</div>

									<div className="min-w-0 flex-1">
										<p className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]"><ImagePlus size={16} className="text-violet-500" /> Profile picture <span className="text-xs font-normal text-slate-400">Optional</span></p>
										<p className="mt-1 text-xs leading-5 text-[#64748B]">JPG, PNG or WebP, up to 2 MB. It will appear on your public profile.</p>
										<div className="mt-3 flex flex-wrap gap-2">
											<label className="inline-flex cursor-pointer items-center rounded-full bg-violet-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-600">
												Upload picture
												<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfileImage} className="sr-only" />
											</label>
											{form.profile_image && <button type="button" onClick={() => setForm((current) => ({ ...current, profile_image: '' }))} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white">Remove</button>}
										</div>
									</div>
								</div>
							</div>

							{/* Name */}
							<div className="animate-[fadeSlideUp_.5s_.15s_both]">
								<Field
									label="Name"
									value={form.name}
									onChange={(value) =>
										setForm({
											...form,
											name: value,
										})
									}
									icon={
										<User
											size={16}
											className="text-violet-500"
										/>
									}
								/>
							</div>

							{/* Bio */}
							<div className="animate-[fadeSlideUp_.5s_.25s_both]">
								<label className="group block">

									<span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
										<span className="transition-transform duration-300 group-focus-within:scale-110">
											<FileText
												size={16}
												className="text-violet-500"
											/>
										</span>

										Bio
									</span>

									<textarea
										required
										rows="5"
										value={form.bio}
										onChange={(event) =>
											setForm({
												...form,
												bio: event.target.value,
											})
										}
										className="w-full resize-y rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm leading-6 text-[#1E293B] outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-violet-200 hover:bg-violet-50/20 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
										placeholder="Tell clients about your approach and experience"
									/>

								</label>
							</div>

							{/* Specializations */}
							<div className="animate-[fadeSlideUp_.5s_.35s_both]">
								<TagField
									label="Specializations"
									values={form.specializations}
									value={specialization}
									setValue={setSpecialization}
									onSelect={(selected) =>
										addValue(
											'specializations',
											selected,
											setSpecialization
										)
									}
									onAdd={() =>
										addValue(
											'specializations',
											specialization,
											setSpecialization
										)
									}
									onRemove={(value) =>
										removeValue(
											'specializations',
											value
										)
									}
									placeholder="e.g. Anxiety"
									icon={
										<Tag
											size={16}
											className="text-violet-500"
										/>
									}
									options={specializationOptions}
								/>
							</div>

							{/* Languages */}
							<div className="animate-[fadeSlideUp_.5s_.45s_both]">
								<TagField
									label="Languages"
									values={form.languages}
									value={language}
									setValue={setLanguage}
									onAdd={() =>
										addValue(
											'languages',
											language,
											setLanguage
										)
									}
									onRemove={(value) =>
										removeValue(
											'languages',
											value
										)
									}
									placeholder="e.g. English"
									icon={
										<Languages
											size={16}
											className="text-violet-500"
										/>
									}
																	options={languageOptions}
																	onSelect={(selected) =>
																		addValue(
																			'languages',
																			selected,
																			setLanguage
																		)
																	}
								/>
							</div>

							{/* Error */}
							{error && (
								<div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700 animate-[shake_.4s_ease-out]">

									<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
										<X size={14} />
									</div>

									<span>{error}</span>

								</div>
							)}

							{/* =================================================
							    SAVE BUTTON
							================================================= */}

							<div className="pt-2 animate-[fadeSlideUp_.5s_.55s_both]">

								<button
									type="submit"
									disabled={saving}
									className="group/button relative flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:-translate-y-1 hover:from-violet-600 hover:to-purple-700 hover:shadow-xl hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
								>

									{/* Shine animation */}
									<span className="absolute inset-y-0 left-[-100%] w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover/button:left-[130%]" />

									{/* Button content */}
									<span className="relative z-10 flex items-center gap-2">

										{saving ? (
											<>
												<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
												Saving profile...
											</>
										) : (
											<>
												Save and continue

												<ArrowRight
													size={17}
													className="transition-transform duration-300 group-hover/button:translate-x-1"
												/>
											</>
										)}

									</span>

								</button>

								<p className="mt-3 text-center text-xs text-slate-400">
									Your profile information helps clients
									find the right therapist for their needs.
								</p>

							</div>

						</form>
					</div>
				</div>
			</div>

			{/* =====================================================
			    ANIMATIONS
			===================================================== */}

			<style>{`
				@keyframes fadeSlideUp {
					from {
						opacity: 0;
						transform: translateY(22px);
					}

					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes fadeSlideDown {
					from {
						opacity: 0;
						transform: translateY(-14px);
					}

					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes floatSlow {
					0%,
					100% {
						transform: translate3d(0, 0, 0) scale(1);
					}

					50% {
						transform: translate3d(0, -18px, 0) scale(1.04);
					}
				}

				@keyframes shake {
					0%,
					100% {
						transform: translateX(0);
					}

					25% {
						transform: translateX(-5px);
					}

					75% {
						transform: translateX(5px);
					}
				}
			`}</style>
		</main>
	)
}

function Field({ label, value, onChange, icon }) {
	return (
		<label className="group block">

			<span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1E293B]">

				<span className="transition-transform duration-300 group-focus-within:scale-110">
					{icon}
				</span>

				{label}
			</span>

			<div className="relative">

				<input
					required
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-violet-200 hover:bg-violet-50/20 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
				/>

				{/* Focus line */}
				<span className="pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-300 group-focus-within:w-[94%]" />

			</div>
		</label>
	)
}

function TagField({
	label,
	values,
	value,
	setValue,
	onSelect,
	onAdd,
	onRemove,
	placeholder,
	icon,
	options,
}) {
	const hasOptions = options?.length > 0

	return (
		<div className="group">

			<span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1E293B]">

				<span className="transition-transform duration-300 group-focus-within:scale-110 group-hover:scale-105">
					{icon}
				</span>

				{label}
			</span>

			{/* Input row */}
			<div className="flex gap-2">

				{hasOptions ? (
					<>
						<select
							value={
								value === 'Other'
									? 'Other'
									: value
							}
							onChange={(event) => {
								const selected = event.target.value
								setValue(selected)

								if (selected && selected !== 'Other') {
									onSelect?.(selected)
								}
							}}
							className="h-12 min-w-0 flex-1 cursor-pointer rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-all duration-300 hover:border-violet-200 hover:bg-violet-50/20 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
						>
							<option value="">
								Select a specialization
							</option>

							{options.map((option) => (
								<option
									key={option}
									value={option}
								>
									{option}
								</option>
							))}

							<option value="Other">
								Other
							</option>
						</select>

						{value === 'Other' && (
							<input
								value={value}
								onChange={(event) =>
									setValue(event.target.value)
								}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault()
										onAdd()
									}
								}}
								className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-all duration-300 hover:border-violet-200 hover:bg-violet-50/20 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
								placeholder="Enter your specialization"
							/>
						)}
					</>
				) : (
					<input
						value={value}
						onChange={(event) =>
							setValue(event.target.value)
						}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault()
								onAdd()
							}
						}}
						className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-violet-200 hover:bg-violet-50/20 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
						placeholder={placeholder}
					/>
				)}

				{/* Add button */}
				<button
					type="button"
					onClick={onAdd}
					aria-label={`Add ${label.toLowerCase()}`}
					className="group/add relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-violet-100 text-violet-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-500 hover:text-white hover:shadow-lg hover:shadow-violet-200 active:translate-y-0"
				>
					<span className="absolute inset-0 scale-0 rounded-xl bg-purple-600 transition-transform duration-300 group-hover/add:scale-100" />

					<Plus
						size={18}
						className="relative z-10 transition-transform duration-300 group-hover/add:rotate-90"
					/>
				</button>
			</div>

			{/* Tags */}
			{values.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-2">

					{values.map((item, index) => (
						<span
							key={item}
							style={{
								animationDelay: `${index * 50}ms`,
							}}
							className="group/tag inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 opacity-0 animate-[tagIn_.35s_ease-out_forwards] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-100 hover:shadow-sm"
						>
							<span>{item}</span>

							<button
								type="button"
								onClick={() => onRemove(item)}
								aria-label={`Remove ${item}`}
								className="flex h-4 w-4 items-center justify-center rounded-full text-violet-400 transition-all duration-200 hover:bg-red-100 hover:text-red-500"
							>
								<X size={12} />
							</button>
						</span>
					))}

				</div>
			)}

			{/* Empty helper */}
			{values.length === 0 && (
				<p className="mt-2 text-xs text-slate-400 transition-colors duration-300 group-focus-within:text-violet-400">
					Add at least one {label.toLowerCase()}.
				</p>
			)}

			<style>{`
				@keyframes tagIn {
					from {
						opacity: 0;
						transform: translateY(6px) scale(.9);
					}

					to {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}
			`}</style>
		</div>
	)
}
