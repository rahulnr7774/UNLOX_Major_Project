import { Bell, Check, CheckCheck, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

function formatDate(value) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function cacheUnreadCount(count) {
  localStorage.setItem('unfazed_unread_notifications', String(count))
  window.dispatchEvent(new Event('unfazed-notification-count'))
}

export default function Notifications() {
  const { user } = useAuth()
  const isClient = user?.role === 'client'
  const notificationBasePath = isClient ? '/clients/notifications' : '/notifications/therapist'
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState('')

  const loadNotifications = async () => {
    try {
      const { data } = await axiosInstance.get(notificationBasePath)
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      cacheUnreadCount(data.unreadCount || 0)
      setError('')
    } catch {
      setError('Notifications could not be loaded right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [notificationBasePath])

  const markRead = async (notificationId) => {
    await axiosInstance.patch(`${notificationBasePath}/${notificationId}/read`)
    setNotifications((current) => current.map((notification) => notification._id === notificationId ? { ...notification, read_at: new Date().toISOString() } : notification))
    setUnreadCount((current) => {
      const nextCount = Math.max(0, current - 1)
      cacheUnreadCount(nextCount)
      return nextCount
    })
  }

  const markAllRead = async () => {
    await axiosInstance.patch(`${notificationBasePath}/read-all`)
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at || new Date().toISOString() })))
    setUnreadCount(0)
    cacheUnreadCount(0)
  }

  return <section className="mx-auto max-w-3xl">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Updates</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-slate-900">Notifications</h1>
        <p className="mt-2 text-sm text-slate-500">Important updates from your Unfazed care team.</p>
      </div>
      {unreadCount > 0 && <button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 self-start rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 sm:self-auto"><CheckCheck size={16} />Mark all read</button>}
    </div>

    {loading && <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Loading notifications...</div>}
    {!loading && error && <p className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {!loading && !error && notifications.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><Bell className="mx-auto text-slate-300" size={32} /><p className="mt-4 text-sm font-semibold text-slate-700">No notifications yet</p><p className="mt-1 text-sm text-slate-500">New appointment and account updates will appear here.</p></div>}
    {!loading && !error && notifications.length > 0 && <div className="mt-8 space-y-3">{notifications.map((notification) => <article key={notification._id} className={`rounded-2xl border p-5 transition ${notification.read_at ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/60'}`}><div className="flex items-start gap-4"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.read_at ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white'}`}><Bell size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start"><h2 className="font-semibold text-slate-900">{notification.subject}</h2><time className="text-xs text-slate-400">{formatDate(notification.createdAt)}</time></div><p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>{!notification.read_at && <button type="button" onClick={() => markRead(notification._id)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-slate-900"><Check size={14} />Mark as read</button>}</div></div></article>)}</div>}
  </section>
}
