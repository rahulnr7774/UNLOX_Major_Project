import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock3, LoaderCircle, LogOut, RefreshCw } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

export default function PendingApproval() {
  const { logout, user } = useAuth()
  const [approved, setApproved] = useState(false)
  const [checking, setChecking] = useState(true)
  const approvalAlertShown = useRef(false)

  useEffect(() => {
    let active = true
    let intervalId

    const checkApprovalStatus = async () => {
      try {
        const { data } = await axiosInstance.get('/clients/approval-status')
        const isApproved = data.client?.approval_status !== 'pending'

        if (active && isApproved) {
          window.clearInterval(intervalId)
          setApproved(true)
          setChecking(false)
          if (!approvalAlertShown.current) {
            approvalAlertShown.current = true
            window.alert('Your therapist has approved your access. Click Reload to open your client portal.')
          }
        } else if (active) {
          setChecking(false)
        }
      } catch {
        if (active) setChecking(false)
      }
    }

    checkApprovalStatus()
    intervalId = window.setInterval(checkApprovalStatus, 5000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  const reloadPortal = () => window.location.reload()

  return <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-8">
    <section className="w-full max-w-lg rounded-[28px] bg-white p-8 text-center shadow-[0_24px_80px_rgba(31,41,36,.08)] sm:p-12">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${approved ? 'bg-moss text-white' : 'bg-sage text-moss'}`}>
        {approved ? <CheckCircle2 size={30} /> : <Clock3 size={30} />}
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-moss">{approved ? 'Access approved' : 'Access request sent'}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">{approved ? 'Your client portal is ready' : 'Your therapist is reviewing your request'}</h1>
      <p className="mt-4 text-sm leading-6 text-ink/60">
        {approved
          ? 'Your therapist approved your access. Reload the page to continue to your client portal.'
          : `Hi ${user?.name || 'there'}, your account is ready. You can sign in with your password as soon as your therapist approves access to the client portal.`}
      </p>
      {approved && <button type="button" onClick={reloadPortal} className="mt-8 inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-bold text-white hover:bg-ink"><RefreshCw size={16} />Reload portal</button>}
      {!approved && <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-ink/50">{checking ? <LoaderCircle className="animate-spin" size={14} /> : <Clock3 size={14} />}Checking for approval automatically</p>}
      <div><button type="button" onClick={logout} className={`${approved ? 'mt-4' : 'mt-8'} inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-moss`}><LogOut size={16} />Sign out</button></div>
    </section>
  </main>
}
