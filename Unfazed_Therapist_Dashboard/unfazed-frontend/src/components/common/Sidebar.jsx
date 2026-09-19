import { BarChart3, Bell, Calendar, CalendarDays, Clock3, CreditCard, FileText, LayoutDashboard, Leaf, LogOut, MessageSquare, Package, UserRound, Users, UsersRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { isClientProfileComplete, isTherapistProfileComplete } from '../../utils/profileCompletion'

const therapistNavItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Clients', icon: Users, path: '/clients' },
  { label: 'Waitlist', icon: Clock3, path: '/waitlist' },
  { label: 'Schedule', icon: Calendar, path: '/schedule' },
  { label: 'My sessions', icon: CalendarDays, path: '/sessions' },
  { label: 'Notes', icon: FileText, path: '/notes' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Packages', icon: Package, path: '/packages' },
  { label: 'Profile', icon: UsersRound, path: '/profile' },
]

const clientNavItems = [
  { label: 'Profile', icon: UserRound, path: '/client/profile' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/client-portal' },
  { label: 'Chat', icon: MessageSquare, path: '/client/chat' },
  { label: 'Notes', icon: FileText, path: '/client/notes' },
  { label: 'Payment', icon: CreditCard, path: '/client/payments' },
  { label: 'Waitlist', icon: Clock3, path: '/client/waitlist' },
]

export default function Sidebar({ onNavigate, mobile = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const isClient = user?.role === 'client'
  const [unreadCount, setUnreadCount] = useState(() => Number(localStorage.getItem('unfazed_unread_notifications') || 0))
  const clientProfileComplete = isClientProfileComplete(user)
  const therapistProfileComplete = isTherapistProfileComplete(user)
  const navItems = isClient
    ? clientProfileComplete
      ? clientNavItems
      : clientNavItems.filter((item) => item.path === '/client/profile')
    : therapistProfileComplete
      ? therapistNavItems
      : therapistNavItems.filter((item) => item.path === '/profile')

  useEffect(() => {
    const updateUnreadCount = () => setUnreadCount(Number(localStorage.getItem('unfazed_unread_notifications') || 0))
    window.addEventListener('unfazed-notification-count', updateUnreadCount)
    return () => window.removeEventListener('unfazed-notification-count', updateUnreadCount)
  }, [])

  return <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-700 bg-[#0F172A] ${mobile ? 'block' : 'hidden lg:block'}`}><div className="flex h-full flex-col"><div className="border-b border-slate-700 p-6"><div className="flex items-center justify-between gap-3"><button type="button" aria-label="Go to default page" onClick={() => { navigate(isClient ? '/client-portal' : '/dashboard'); onNavigate?.() }} className="flex min-w-0 items-center gap-3 rounded-xl text-left transition-opacity hover:opacity-90"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isClient ? 'bg-emerald-500' : 'bg-violet-500'}`}><Leaf size={24} className="text-white" /></div><div className="min-w-0"><h3 className="font-display text-lg font-semibold text-white">Unfazed</h3><p className="text-xs text-slate-400">{isClient ? 'Client portal' : 'Practice management'}</p></div></button>{isClient && <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} title="Notifications" onClick={() => { navigate('/client/notifications'); onNavigate?.() }} className="relative shrink-0 rounded-xl p-2.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"><Bell size={20} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>}</div></div><nav className="flex-1 space-y-1 px-4 py-6">{navItems.map((item) => { const Icon = item.icon; const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`); return <button key={`${item.path}-${item.label}`} onClick={() => { navigate(item.path); onNavigate?.() }} className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${isActive ? (isClient ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400') : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><span className="flex items-center gap-3"><Icon size={18} />{item.label}</span></button> })}</nav><div className="border-t border-slate-700 p-4"><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"><LogOut size={18} />Logout</button></div></div></aside>
}
