import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import Sidebar from './Sidebar'

export default function TherapistLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return <div className="min-h-screen bg-[#F8FAFC] lg:pl-64"><Sidebar onNavigate={() => setSidebarOpen(false)} /><button type="button" onClick={() => setSidebarOpen((open) => !open)} className={`fixed top-4 z-50 rounded-lg bg-white p-2 shadow-lg transition-[left,right] duration-200 lg:hidden ${sidebarOpen ? 'right-4' : 'left-4'}`} aria-label="Toggle navigation">{sidebarOpen ? <X size={24} /> : <Menu size={24} />}</button>{sidebarOpen && <><div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} /><div className="fixed inset-y-0 left-0 z-40 w-64 lg:hidden"><Sidebar mobile onNavigate={() => setSidebarOpen(false)} /></div></>}<main className="min-h-screen overflow-auto"><div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">{children}</div></main></div>
}
