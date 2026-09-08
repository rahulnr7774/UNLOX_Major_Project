import { BarChart3, Calendar, CreditCard, FileText, LayoutDashboard, Leaf, LogOut, MessageSquare, Package, UserRound, Users, UsersRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const therapistNavItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Clients', icon: Users, path: '/clients' },
  { label: 'Schedule', icon: Calendar, path: '/schedule' },
  { label: 'Notes', icon: FileText, path: '/notes' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Packages', icon: Package, path: '/packages' },
  { label: 'Profile', icon: UsersRound, path: '/profile' },
]

const clientNavItems = [
  { label: 'Profile', icon: UserRound, path: '/client/profile' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/client-portal' },
  { label: 'Chat', icon: MessageSquare, path: '/client/chat' },
  { label: 'Payment', icon: CreditCard, path: '/client/payments' },
]

export default function Sidebar({ onNavigate, mobile = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const isClient = user?.role === 'client'
  const navItems = isClient ? clientNavItems : therapistNavItems

  return <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-700 bg-[#0F172A] ${mobile ? 'block' : 'hidden lg:block'}`}><div className="flex h-full flex-col"><div className="border-b border-slate-700 p-6"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${isClient ? 'bg-emerald-500' : 'bg-violet-500'}`}><Leaf size={24} className="text-white" /></div><div><h3 className="font-display text-lg font-semibold text-white">Unfazed</h3><p className="text-xs text-slate-400">{isClient ? 'Client portal' : 'Practice management'}</p></div></div></div><nav className="flex-1 space-y-1 px-4 py-6">{navItems.map((item) => { const Icon = item.icon; const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`); return <button key={`${item.path}-${item.label}`} onClick={() => { navigate(item.path); onNavigate?.() }} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${isActive ? (isClient ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400') : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><span className="flex items-center gap-3"><Icon size={18} />{item.label}</span></button> })}</nav><div className="border-t border-slate-700 p-4"><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"><LogOut size={18} />Logout</button></div></div></aside>
}
