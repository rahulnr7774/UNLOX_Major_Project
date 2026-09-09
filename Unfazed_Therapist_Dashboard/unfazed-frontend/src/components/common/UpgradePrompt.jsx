import { ArrowUpRight, ChevronDown, LockKeyhole } from 'lucide-react'
import { useState } from 'react'

export default function UpgradePrompt({ feature = 'This feature', onUpgrade }) {
  const [expanded, setExpanded] = useState(false)

  function handleUpgradeClick() {
    onUpgrade?.()
    setExpanded((current) => !current)
  }

  return (
    <div className="rounded-2xl border border-coral/30 bg-[#fff4ef] p-5">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 shrink-0 text-coral" size={18} />
        <div className="min-w-0">
          <p className="font-semibold text-ink">Upgrade needed</p>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            {feature} is not included in your current subscription.
          </p>

          <button
            type="button"
            onClick={handleUpgradeClick}
            aria-expanded={expanded}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-moss"
          >
            {expanded ? 'Hide upgrade options' : 'View upgrade options'}
            {expanded ? <ChevronDown size={15} className="rotate-180" /> : <ArrowUpRight size={15} />}
          </button>

          {expanded && (
            <div className="mt-4 rounded-xl border border-coral/20 bg-white/70 p-4 text-sm text-ink/70">
              <p className="font-semibold text-ink">Unlock more from your practice</p>
              <p className="mt-1 leading-6">
                An upgraded plan can unlock {feature.toLowerCase()} along with higher practice limits and advanced tools.
              </p>
              <p className="mt-3 text-xs font-semibold text-ink/50">
                Contact your practice administrator to change your subscription.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
