import { useEffect, useMemo, useState } from "react";
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
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import Modal from "../../components/common/Modal";

function sanitizeNoteHtml(content) {
  const documentNode = new DOMParser().parseFromString(
    String(content || ""),
    "text/html"
  );

  const allowedTags = new Set([
    "P",
    "H3",
    "STRONG",
    "EM",
    "UL",
    "OL",
    "LI",
    "BR",
  ]);

  documentNode.body.querySelectorAll("*").forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(
        documentNode.createTextNode(element.textContent || "")
      );
      return;
    }

    Array.from(element.attributes).forEach((attribute) =>
      element.removeAttribute(attribute.name)
    );
  });

  return documentNode.body.innerHTML;
}

function isMeaningfulSharedNote(note) {
  const text = String(note.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return ![
    "Subjective Objective Assessment Plan",
    "Data Assessment Plan",
  ].includes(text);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClasses(status) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-600";
  }

  return "bg-amber-50 text-amber-700";
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

      const { data } = await axiosInstance.post(
        `/client-booking/packages/${packageRecord._id}/orders`
      );

      if (
        !window.Razorpay ||
        !import.meta.env.VITE_RAZORPAY_KEY_ID
      ) {
        throw new Error("Razorpay is not configured.");
      }

      const checkout = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Unfazed",
        description: packageRecord.name,
        order_id: data.order.id,

        handler: async (result) => {
          await axiosInstance.post(
            "/client-booking/packages/verify",
            {
              payment_id: data.payment._id,
              razorpay_order_id: data.order.id,
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_signature: result.razorpay_signature,
              payment_method: "razorpay",
            }
          );

          window.location.reload();
        },

        theme: {
          color: "#10B981",
        },
      });

      checkout.open();
    } catch (error) {
      console.error(error);
    } finally {
      setPackageLoading(false);
    }
  };

  const meaningfulNotes = useMemo(
    () => sharedNotes.filter(isMeaningfulSharedNote),
    [sharedNotes]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF9]">
        <div className="text-sm font-medium text-[#64748B]">
          Loading your portal...
        </div>
      </main>
    );
  }

  if (!client) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF9]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 text-sm text-[#64748B] shadow-sm">
          Unable to load client information.
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#F8FAF9] text-[#1E293B]">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">

          {/* =====================================================
              HEADER
          ====================================================== */}
          <header className="mb-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">
                  <Leaf size={13} />
                  Client portal
                </div>

                <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-[#1E293B] sm:text-4xl lg:text-[42px]">
                  Welcome back, {client.name}
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
                  A calm space to manage your sessions, appointments,
                  payments, and progress.
                </p>
              </div>

              <button
                onClick={() => navigate("/client/book")}
                className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-bold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-600"
              >
                <Calendar size={17} />
                Book a session
              </button>
            </div>
          </header>

          {/* =====================================================
              STATS
          ====================================================== */}
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Calendar}
              label="Upcoming session"
              value={upcomingSession ? "1" : "0"}
              helper={
                upcomingSession
                  ? formatDate(upcomingSession.starts_at)
                  : "Nothing scheduled"
              }
            />

            <StatCard
              icon={Clock}
              label="Total sessions"
              value={sessions.length}
              helper="All time"
            />

            <StatCard
              icon={Package}
              label="Sessions remaining"
              value={clientPackage?.sessions_remaining || 0}
              helper={
                clientPackage
                  ? clientPackage.package?.name || "Active package"
                  : "No active package"
              }
            />
          </section>

          {/* =====================================================
              MAIN GRID
          ====================================================== */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">

            {/* Upcoming */}
            <div className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
              <SectionHeader
                icon={Calendar}
                eyebrow="Next appointment"
                title="Upcoming session"
              />

              {upcomingSession ? (
                <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/70">
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.13em] text-emerald-600">
                        Your therapist
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-[#1E293B]">
                        {upcomingSession.therapist?.name ||
                          "Your therapist"}
                      </h3>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#64748B]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={14} />
                          {formatDate(upcomingSession.starts_at)}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatTime(upcomingSession.starts_at)}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} />
                          {upcomingSession.duration} min
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() =>
                          setSelectedSession(upcomingSession)
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-emerald-600"
                      >
                        View session
                        <ArrowRight size={15} />
                      </button>

                      <button className="rounded-full border border-[#D7E1DD] bg-white px-4 py-2.5 text-sm font-semibold text-[#64748B] transition-colors duration-150 hover:border-red-200 hover:text-red-500">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming sessions"
                  description="Book your next session whenever you're ready."
                  action="Book a session"
                  onClick={() => navigate("/client/book")}
                />
              )}
            </div>

            {/* Quick actions */}
            <div className="rounded-[26px] border border-emerald-100 bg-[#ECFDF5] p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Leaf size={17} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.13em] text-emerald-600">
                    Shortcuts
                  </p>

                  <h2 className="mt-0.5 text-lg font-semibold text-[#1E293B]">
                    Quick actions
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                <ActionButton
                  icon={Calendar}
                  label="Book a session"
                  onClick={() => navigate("/client/book")}
                />

                <ActionButton
                  icon={CreditCard}
                  label="Payments"
                  onClick={() => navigate("/client/payments")}
                />

                <ActionButton
                  icon={MessageSquare}
                  label="Chat with therapist"
                  onClick={() => navigate("/client/chat")}
                />
              </div>
            </div>
          </section>

          {/* =====================================================
              PACKAGES
          ====================================================== */}
          <section className="mt-6 rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <SectionHeader
              icon={Leaf}
              eyebrow="Flexible care"
              title="Packages from your therapist"
            />

            {packages.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {packages.map((packageRecord) => (
                  <div
                    key={packageRecord._id}
                    className="group rounded-2xl border border-[#E2E8F0] bg-[#FAFAF9] p-5 transition-shadow duration-150 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-[#1E293B]">
                          {packageRecord.name}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-[#64748B]">
                          {packageRecord.session_count} sessions ·{" "}
                          {packageRecord.expiry_days} days
                        </p>
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Package size={17} />
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                          Package price
                        </p>

                        <p className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
                          INR {packageRecord.total_price}
                        </p>
                      </div>

                      <button
                        disabled={packageLoading}
                        onClick={() => purchasePackage(packageRecord)}
                        className="rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {packageLoading ? "Processing..." : "Buy package"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-[#FAFAF9] px-4 py-3 text-sm text-[#64748B]">
                Your therapist has not published packages yet.
              </p>
            )}
          </section>

          {/* =====================================================
              MY PACKAGE
          ====================================================== */}
          <section className="mt-6 rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <SectionHeader
              icon={BookOpen}
              eyebrow="Your plan"
              title="My package"
            />

            {clientPackage ? (
              <div className="mt-6">
                <div className="rounded-2xl bg-emerald-50/70 p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.13em] text-emerald-600">
                        Active package
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-[#1E293B]">
                        {clientPackage.package?.name}
                      </h3>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-semibold text-emerald-600">
                        {clientPackage.sessions_remaining}
                      </p>
                      <p className="text-xs font-medium text-[#64748B]">
                        sessions remaining
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-4">
                    <PackageDetail
                      label="Total"
                      value={clientPackage.total_sessions}
                    />

                    <PackageDetail
                      label="Used"
                      value={clientPackage.sessions_used}
                    />

                    <PackageDetail
                      label="Remaining"
                      value={clientPackage.sessions_remaining}
                    />

                    <PackageDetail
                      label="Expires"
                      value={formatDate(clientPackage.expires_at)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No active package"
                description="Choose a package to make your care plan more convenient."
                action="View packages"
                onClick={() => navigate("/client/packages")}
              />
            )}
          </section>

          {/* =====================================================
              NOTES + RECENT SESSIONS
          ====================================================== */}
          <section className="mt-6 grid gap-6 lg:grid-cols-2">

            {/* Shared notes */}
            <div className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
              <SectionHeader
                icon={FileText}
                eyebrow="Your care"
                title="Shared notes"
              />

              {meaningfulNotes.length > 0 ? (
                <div className="mt-5 divide-y divide-[#E2E8F0]">
                  {meaningfulNotes.map((note) => (
                    <div key={note._id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-bold text-[#1E293B]">
                          Session note
                        </h3>

                        <span className="shrink-0 text-xs text-[#94A3B8]">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>

                      <div
                        className="prose prose-sm mt-3 max-w-none text-[#64748B] prose-headings:text-[#1E293B] prose-strong:text-[#1E293B]"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeNoteHtml(note.content),
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#FAFAF9] p-5">
                  <p className="text-sm text-[#64748B]">
                    No shared notes yet.
                  </p>
                </div>
              )}
            </div>

            {/* Recent sessions */}
            <div className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
              <SectionHeader
                icon={Calendar}
                eyebrow="Your history"
                title="Recent sessions"
              />

              {sessions.length > 0 ? (
                <div className="mt-5 space-y-2.5">
                  {sessions.map((session) => (
                    <div
                      key={session._id}
                      className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#FAFAF9] p-3.5 transition-colors duration-150 hover:bg-white"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Calendar size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1E293B]">
                          {session.therapist?.name ||
                            "Your therapist"}
                        </p>

                        <p className="mt-0.5 text-xs text-[#94A3B8]">
                          {formatDate(session.starts_at)}
                        </p>
                      </div>

                      <span
                        className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold capitalize sm:inline-flex ${getStatusClasses(
                          session.status
                        )}`}
                      >
                        {session.status}
                      </span>

                      <button
                        onClick={() =>
                          setSelectedSession(session)
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition-colors duration-150 hover:bg-emerald-50 hover:text-emerald-600"
                        aria-label="View session"
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#FAFAF9] p-5">
                  <p className="text-sm text-[#64748B]">
                    No previous sessions.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* =====================================================
          SESSION MODAL
      ====================================================== */}
      <Modal open={Boolean(selectedSession)}>
        {selectedSession && (
          <div>
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-emerald-600">
                  <Calendar size={12} />
                  Session details
                </div>

                <h2 className="mt-3 font-display text-2xl font-semibold text-[#1E293B]">
                  Your therapy session
                </h2>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-full px-2 py-1 text-sm font-semibold text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#1E293B]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FAFAF9]">
              <div className="grid divide-y divide-[#E2E8F0] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <ModalDetail
                  label="Therapist"
                  value={
                    selectedSession.therapist?.name ||
                    "Your therapist"
                  }
                />

                <ModalDetail
                  label="Session"
                  value={
                    selectedSession.session_code ||
                    "Code pending"
                  }
                />

                <ModalDetail
                  label="Date"
                  value={formatDate(selectedSession.starts_at)}
                />

                <ModalDetail
                  label="Time"
                  value={formatTime(selectedSession.starts_at)}
                />
              </div>

              <div className="border-t border-[#E2E8F0] px-5 py-4">
                <span className="text-xs font-semibold text-[#94A3B8]">
                  Status
                </span>

                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${getStatusClasses(
                      selectedSession.status
                    )}`}
                  >
                    <CheckCircle2 size={13} />
                    {selectedSession.status}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(
                  `/chat/${selectedSession._id}?code=${
                    selectedSession.session_code || ""
                  }&resume=${Date.now()}`
                )
              }
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-emerald-600"
            >
              Join / resume session
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.035)] transition-shadow duration-150 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#1E293B]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-2 text-xs font-medium text-emerald-600">
        {helper}
      </p>
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon size={17} />
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 font-display text-xl font-semibold text-[#1E293B]">
          {title}
        </h2>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-left text-sm font-semibold text-[#1E293B] transition-colors duration-150 hover:border-emerald-200 hover:bg-emerald-50/40"
    >
      <Icon size={17} className="text-emerald-500" />

      <span className="flex-1">{label}</span>

      <ChevronRight
        size={16}
        className="text-[#94A3B8] transition-colors group-hover:text-emerald-500"
      />
    </button>
  );
}

function PackageDetail({ label, value }) {
  return (
    <div className="rounded-xl bg-white/70 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#1E293B]">
        {value}
      </p>
    </div>
  );
}

function ModalDetail({ label, value }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#1E293B]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onClick,
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[#DDE5E1] bg-[#FAFAF9] p-7 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
        <Icon size={19} />
      </div>

      <h3 className="mt-3 text-sm font-bold text-[#1E293B]">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#64748B]">
        {description}
      </p>

      <button
        onClick={onClick}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors duration-150 hover:bg-emerald-600"
      >
        {action}
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

export default ClientPortal;
