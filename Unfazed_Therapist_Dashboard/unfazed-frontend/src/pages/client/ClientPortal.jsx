import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Package,
  FileText,
  MessageSquare,
  CreditCard,
  BookOpen,
  Leaf,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Modal from "../../components/common/Modal";

function sanitizeNoteHtml(content) {
  const documentNode = new DOMParser().parseFromString(String(content || ''), 'text/html')
  const allowedTags = new Set(['P', 'H3', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'BR'])
  documentNode.body.querySelectorAll('*').forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(documentNode.createTextNode(element.textContent || ''))
      return
    }
    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name))
  })
  return documentNode.body.innerHTML
}

function isMeaningfulSharedNote(note) {
  const text = String(note.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return !['Subjective Objective Assessment Plan', 'Data Assessment Plan'].includes(text)
}

function ClientPortal() {
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [clientPackage, setClientPackage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortal = async () => {
      try {
        const response = await axiosInstance.get("/clients/portal");
        setClient(response.data.client);
        setUpcomingSession(response.data.upcomingSession);
        setSessions(response.data.sessions);
        setSharedNotes(response.data.sharedNotes);
        setClientPackage(response.data.clientPackage);
        setPackages(response.data.packages || []);
      } catch (error) {
        console.error("Failed to load client portal", error);
      } finally {
        setLoading(false);
      }
    };
    loadPortal();
  }, []);

  const purchasePackage = async (packageRecord) => {
    try {
      setPackageLoading(true);
      const { data } = await axiosInstance.post(`/client-booking/packages/${packageRecord._id}/orders`);
      if (!window.Razorpay || !import.meta.env.VITE_RAZORPAY_KEY_ID) throw new Error("Razorpay is not configured.");
      const checkout = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Unfazed",
        description: packageRecord.name,
        order_id: data.order.id,
        handler: async (result) => {
          await axiosInstance.post("/client-booking/packages/verify", {
            payment_id: data.payment._id,
            razorpay_order_id: data.order.id,
            razorpay_payment_id: result.razorpay_payment_id,
            razorpay_signature: result.razorpay_signature,
            payment_method: "razorpay"
          });
          window.location.reload();
        },
        theme: { color: "#10B981" } // Emerald
      });
      checkout.open();
    } catch (error) {
      console.error(error);
    } finally {
      setPackageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] text-sm text-[#64748B]">
        Loading your portal...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] text-sm text-[#64748B]">
        Unable to load client information.
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen overflow-auto">
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          {/* Header */}
          <header className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[.18em] text-emerald-600">
                Client portal
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B] sm:text-5xl">
                Welcome back, {client.name} 👋
              </h1>
              <p className="mt-3 max-w-lg text-base text-[#64748B]">
                Manage your therapy sessions and stay connected with your therapist.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/client/book')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                <Calendar size={17} /> Book session
              </button>
              {/* <button
                onClick={() => navigate('/client/chat')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#1E293B] transition-colors hover:border-emerald-500 hover:text-emerald-600"
              >
                <MessageSquare size={17} /> Chat
              </button> */}
            </div>
          </header>

          {/* Stats Cards */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#64748B]">Upcoming Sessions</p>
                <Calendar size={20} className="text-emerald-500" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-[#1E293B]">
                {upcomingSession ? 1 : 0}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-600">Next session</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#64748B]">Total Sessions</p>
                <Clock size={20} className="text-emerald-500" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-[#1E293B]">{sessions.length}</p>
              <p className="mt-1 text-xs font-medium text-emerald-600">All time</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#64748B]">Active Package</p>
                <Package size={20} className="text-emerald-500" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-[#1E293B]">
                {clientPackage ? clientPackage.sessions_remaining : 0}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-600">Remaining sessions</p>
            </div>
          </section>

          {/* Upcoming Session + Quick Actions */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-emerald-500" />
                <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Upcoming Session</h2>
              </div>
              {upcomingSession ? (
                <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
                  <h3 className="text-lg font-semibold text-[#1E293B]">
                    {upcomingSession.therapist.name}
                  </h3>
                  <div className="mt-3 space-y-1 text-sm text-[#64748B]">
                    <p><Calendar size={14} className="inline mr-1" /> Date: {new Date(upcomingSession.starts_at).toLocaleDateString()}</p>
                    <p><Clock size={14} className="inline mr-1" /> Time: {new Date(upcomingSession.starts_at).toLocaleTimeString()}</p>
                    <p><Clock size={14} className="inline mr-1" /> Duration: {upcomingSession.duration} minutes</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                      onClick={() => setSelectedSession(upcomingSession)}
                    >
                      View Session
                    </button>
                    <button className="rounded-full border border-[#E2E8F0] px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:border-red-300 hover:text-red-500">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-[#E2E8F0] p-6 text-center">
                  <p className="text-[#64748B]">You don't have any upcoming sessions.</p>
                  <button
                    className="mt-4 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    onClick={() => navigate("/client/book")}
                  >
                    Book a Session
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Quick Actions</h2>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/client/book')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-[#1E293B] transition-colors hover:bg-white"
                >
                  <Calendar size={18} className="text-emerald-500" /> Book a Session
                </button>
                <button
                  onClick={() => navigate('/client/payments')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-[#1E293B] transition-colors hover:bg-white"
                >
                  <CreditCard size={18} className="text-emerald-500" /> Payments
                </button>
                <button
                  onClick={() => navigate('/client/chat')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-[#1E293B] transition-colors hover:bg-white"
                >
                  <MessageSquare size={18} className="text-emerald-500" /> Chat with Therapist
                </button>
              </div>
            </div>
          </section>

          {/* Packages */}
          <section className="mt-6 rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <Leaf size={20} className="text-emerald-500" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#64748B]">Flexible care</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">Packages from your therapist</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {packages.map((packageRecord) => (
                <div key={packageRecord._id} className="rounded-2xl border border-[#E2E8F0] bg-[#FAFAF9] p-5 transition-shadow hover:shadow-md">
                  <h3 className="font-display text-lg font-semibold text-[#1E293B]">{packageRecord.name}</h3>
                  <p className="mt-1 text-sm text-[#64748B]">{packageRecord.session_count} sessions · {packageRecord.expiry_days} days</p>
                  <p className="mt-4 font-display text-2xl font-semibold text-[#1E293B]">INR {packageRecord.total_price}</p>
                  <button
                    disabled={packageLoading}
                    onClick={() => purchasePackage(packageRecord)}
                    className="mt-4 w-full rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                  >
                    Buy package
                  </button>
                </div>
              ))}
            </div>
            {!packages.length && (
              <p className="mt-4 text-sm text-[#64748B]">Your therapist has not published packages yet.</p>
            )}
          </section>

          {/* My Package */}
          <section className="mt-6 rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-emerald-500" />
              <h2 className="font-display text-2xl font-semibold text-[#1E293B]">My Package</h2>
            </div>
            {clientPackage ? (
              <div className="mt-4 grid gap-3 rounded-2xl bg-emerald-50 p-5 text-sm text-[#64748B] sm:grid-cols-2">
                <p><strong className="text-[#1E293B]">Package:</strong> {clientPackage.package.name}</p>
                <p><strong className="text-[#1E293B]">Total Sessions:</strong> {clientPackage.total_sessions}</p>
                <p><strong className="text-[#1E293B]">Sessions Used:</strong> {clientPackage.sessions_used}</p>
                <p><strong className="text-[#1E293B]">Remaining:</strong> {clientPackage.sessions_remaining}</p>
                <p><strong className="text-[#1E293B]">Expires:</strong> {new Date(clientPackage.expires_at).toLocaleDateString()}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#E2E8F0] p-6 text-center">
                <p className="text-[#64748B]">You don't have an active package.</p>
                <button
                  onClick={() => navigate("/client/packages")}
                  className="mt-3 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  View Packages
                </button>
              </div>
            )}
          </section>

          {/* Shared Notes */}
          <section className="mt-6 rounded-[28px] border border-[#E2E8F0] bg-[#F1F5F9] p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-emerald-500" />
              <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Shared Notes</h2>
            </div>
            {sharedNotes.filter(isMeaningfulSharedNote).length > 0 ? (
              sharedNotes.filter(isMeaningfulSharedNote).map((note) => (
                <div key={note._id} className="mt-4 border-b border-[#E2E8F0] pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#1E293B]">Session Note</h3>
                    <span className="text-xs text-[#64748B]">{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-[#64748B]"
                    dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(note.content) }}
                  />
                </div>
              ))
            ) : (
              <p className="mt-4 text-sm text-[#64748B]">No shared notes yet.</p>
            )}
          </section>

          {/* Session History */}
          <section className="mt-6 rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-emerald-500" />
              <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Recent Sessions</h2>
            </div>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session._id}
                  className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] p-4 transition-shadow hover:shadow-sm"
                >
                  <span className="text-sm font-medium text-[#64748B]">
                    {new Date(session.starts_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-[#1E293B]">{session.therapist.name}</span>
                  <span
                    className={`text-xs font-bold capitalize ${
                      session.status === 'completed'
                        ? 'text-emerald-600'
                        : session.status === 'cancelled'
                        ? 'text-red-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {session.status}
                  </span>
                  <button
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    onClick={() => setSelectedSession(session)}
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <p className="mt-4 text-sm text-[#64748B]">No previous sessions.</p>
            )}
          </section>
        </div>
      </main>

      {/* Modal */}
      <Modal open={Boolean(selectedSession)}>
        {selectedSession && (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Session details</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">Your therapy session</h2>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-sm font-bold text-[#64748B] hover:text-[#1E293B]"
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-3 rounded-2xl bg-[#FAFAF9] p-5 text-sm text-[#64748B]">
              <p><strong className="text-[#1E293B]">Session:</strong> {selectedSession.session_code || 'Code pending'}</p>
              <p><strong className="text-[#1E293B]">Therapist:</strong> {selectedSession.therapist?.name || 'Your therapist'}</p>
              <p><strong className="text-[#1E293B]">Date:</strong> {new Date(selectedSession.starts_at).toLocaleDateString()}</p>
              <p><strong className="text-[#1E293B]">Time:</strong> {new Date(selectedSession.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
              <p>
                <strong className="text-[#1E293B]">Status:</strong>
                <span className={`ml-1 capitalize ${selectedSession.status === 'completed' ? 'text-emerald-600' : selectedSession.status === 'cancelled' ? 'text-red-500' : 'text-amber-500'}`}>
                  {selectedSession.status}
                </span>
              </p>
            </div>
            <button
              onClick={() =>
                navigate(`/chat/${selectedSession._id}?code=${selectedSession.session_code || ''}&resume=${Date.now()}`)
              }
              className="mt-6 w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
            >
              Join / resume session
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

export default ClientPortal;