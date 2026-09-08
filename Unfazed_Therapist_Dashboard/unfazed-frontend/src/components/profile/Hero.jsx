import { Languages, Sparkles } from 'lucide-react'

export default function Hero({ title = 'Your practice, in balance.', specializations = [], languages = [] }) {
  const initials = title.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()

  return <section className="relative overflow-hidden rounded-[32px] bg-sage p-7 sm:p-10 lg:p-14">
    <div className="relative z-10 max-w-2xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ink text-xl font-bold text-sage">{initials}</div>
      <p className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-[.16em] text-moss"><Sparkles size={16} /> Therapist profile</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
      {specializations.length > 0 && <p className="mt-5 text-lg leading-8 text-ink/65">{specializations.slice(0, 3).join(' · ')}</p>}
      {languages.length > 0 && <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-moss"><Languages size={17} /> Sessions in {languages.join(' · ')}</p>}
    </div>
    <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/35" aria-hidden="true" />
  </section>
}
