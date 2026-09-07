
import { useState } from 'react'
import { CalendarDays, ChevronRight, Clock3, Leaf, MoreHorizontal, Plus, Sparkles, UsersRound, LayoutDashboard, Users, Calendar, FileText, BarChart3, LogOut, Menu, X, Package, ListChecks } from 'lucide-react'
import StatCard from '../../components/analytics/StatCard'
import RevenueChart from '../../components/analytics/RevenueChart'
import ClientCard from '../../components/crm/ClientCard'
import { appointments, clients } from '../../utils/mockData'
import { useAuth } from '../../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Clients', icon: Users, path: '/clients' },
    { label: 'Schedule', icon: Calendar, path: '/schedule' },
    { label: 'Notes', icon: FileText, path: '/notes' },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Packages', icon: Package, path: '/packages' },
  ]

  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-ink/10 bg-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="border-b border-ink/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss">
                <Leaf size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">TherapyHub</h3>
                <p className="text-xs text-ink/50">Practice Management</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setSidebarOpen(false)
                  }}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-moss/10 text-moss'
                      : 'text-ink/60 hover:bg-cream'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Footer Section */}
          <div className="border-t border-ink/10 p-4">
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-ink/60 transition hover:bg-cream hover:text-ink">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          {/* Header */}
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[.18em] text-moss">Monday, 14 October 2024</p>
              <h1 className="font-display text-4xl font-semibold tracking-[-.04em] text-ink sm:text-5xl">Good morning, Dr. Maya.</h1>
              <p className="mt-3 max-w-lg text-base text-ink/60">A calm view of your practice, your people, and what needs your attention today.</p>
            </div>
            <button onClick={() => navigate('/schedule')} className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-moss sm:self-auto">
              <Plus size={17} /> New session
            </button>
            <button onClick={() => navigate('/sessions')} className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full border border-ink/10 bg-white px-5 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss sm:self-auto">
              <ListChecks size={17} /> My sessions
            </button>
          </div>

          {/* Stats Grid */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Sessions this week" value="24" delta="12%" icon={CalendarDays} tone="sage" />
            <StatCard label="Active clients" value="86" delta="8%" icon={UsersRound} tone="peach" />
            <StatCard label="Hours in practice" value="31.5" delta="4%" icon={Clock3} tone="lilac" />
            <StatCard label="Monthly revenue" value="$8,420" delta="18%" icon={Sparkles} tone="yellow" />
          </section>

          {/* Charts Section */}
          <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_rgba(31,41,36,.05)] sm:p-8">
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[.15em] text-ink/45">Practice pulse</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">Revenue overview</h2>
                </div>
                <button className="rounded-full p-2 text-ink/45 hover:bg-cream">
                  <MoreHorizontal size={21} />
                </button>
              </div>
              <RevenueChart />
            </div>

            <div className="soft-grid rounded-[28px] border border-moss/10 bg-sage p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-moss">
                  <Leaf size={19} />
                </div>
                <span className="text-xs font-bold uppercase tracking-[.16em] text-moss">Your rhythm</span>
              </div>
              <h2 className="mt-12 max-w-xs font-display text-3xl font-semibold leading-tight">Small pauses make space for better care.</h2>
              <p className="mt-4 max-w-xs text-sm leading-6 text-ink/60">You have a 45-minute gap between your afternoon sessions. Protect it for a reset.</p>
              <button className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-moss">
                View schedule <ChevronRight size={16} />
              </button>
            </div>
          </section>

          {/* Sessions & Clients Section */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[.15em] text-ink/45">Today</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">Your next sessions</h2>
                </div>
                <button className="text-sm font-bold text-moss">See calendar</button>
              </div>
              <div className="space-y-3">
                {appointments.map((item) => (
                  <div key={item.time} className="flex items-center gap-4 rounded-2xl border border-ink/8 p-4">
                    <div className="w-14 text-sm font-bold text-ink/65">{item.time}</div>
                    <div className="h-10 w-1 rounded-full bg-coral" />
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-ink/50">{item.type} · {item.duration}</p>
                    </div>
                    <button className="rounded-full p-2 text-ink/35 hover:bg-cream">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-ink/10 bg-[#f0ece5] p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[.15em] text-ink/45">People</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">Recently active</h2>
                </div>
                <button className="text-sm font-bold text-moss">All clients</button>
              </div>
              <div className="space-y-2">
                {clients.slice(0, 3).map((client) => (
                  <ClientCard key={client.name} client={client} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Dashboard