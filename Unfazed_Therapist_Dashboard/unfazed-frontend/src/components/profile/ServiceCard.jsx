import { ArrowUpRight } from 'lucide-react'

export default function ServiceCard({ title, description, sessionCount, price, onBook }) {
  return <article className="flex h-full flex-col rounded-[24px] border border-ink/10 bg-white p-6 shadow-[0_16px_40px_rgba(31,41,36,.04)]">
    <div className="flex items-start justify-between gap-4"><h3 className="font-display text-xl font-semibold">{title}</h3><span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-moss">{sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}</span></div>
    <p className="mt-4 flex-1 text-sm leading-7 text-ink/55">{description || 'A flexible way to make space for your wellbeing.'}</p>
    <div className="mt-6 flex items-end justify-between gap-4 border-t border-ink/10 pt-5"><p><span className="font-display text-2xl font-semibold">Rs {price.toLocaleString('en-IN')}</span><span className="ml-1 text-xs text-ink/45">total</span></p><button type="button" onClick={onBook} className="inline-flex items-center gap-1 text-sm font-bold text-moss hover:text-ink">Book <ArrowUpRight size={16} /></button></div>
  </article>
}
