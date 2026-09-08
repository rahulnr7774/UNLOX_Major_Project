import { ArrowUpRight, LockKeyhole } from 'lucide-react'

export default function UpgradePrompt({ feature = 'This feature' }) {
  return <div className="rounded-2xl border border-coral/30 bg-[#fff4ef] p-5"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 text-coral" size={18} /><div><p className="font-semibold text-ink">Upgrade needed</p><p className="mt-1 text-sm leading-6 text-ink/60">{feature} is not included in your current subscription.</p><button type="button" className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-moss">View upgrade options <ArrowUpRight size={15} /></button></div></div></div>
}
