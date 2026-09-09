import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PageBackButton({ to, label = 'Back' }) {
  const navigate = useNavigate()

  return <button type="button" onClick={() => navigate(to)} className="inline-flex items-center gap-2 text-sm font-bold text-[#64748B] transition-colors hover:text-[#1E293B]"><ArrowLeft size={16} />{label}</button>
}
