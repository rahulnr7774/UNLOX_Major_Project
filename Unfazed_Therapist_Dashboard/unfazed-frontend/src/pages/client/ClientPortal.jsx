import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Modal from "../../components/common/Modal";

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

        const response = await axiosInstance.get(
          "/clients/portal"
        );

        setClient(response.data.client);

        setUpcomingSession(
          response.data.upcomingSession
        );

        setSessions(
          response.data.sessions
        );

        setSharedNotes(
          response.data.sharedNotes
        );

        setClientPackage(
          response.data.clientPackage
        );

        setPackages(response.data.packages || []);

      } catch (error) {

        console.error(
          "Failed to load client portal",
          error
        );

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
        theme: { color: "#486653" }
      });
      checkout.open();
    } catch (error) {
      console.error(error);
    } finally {
      setPackageLoading(false);
    }
  };


  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-cream text-sm text-ink/60">Loading your portal...</main>;
  }


  if (!client) {
    return <main className="flex min-h-screen items-center justify-center bg-cream text-sm text-ink/60">Unable to load client information.</main>;
  }


  return (

    <div className="min-h-screen bg-cream text-ink">

      {/* NAVBAR */}

      <header className="border-b border-ink/10 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <h2 className="font-display text-xl font-semibold">unfazed</h2>

        <div className="flex items-center gap-3">

          <span className="hidden text-sm font-semibold text-ink/60 sm:block">
            {client.name}
          </span>

          <button className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold hover:border-moss hover:text-moss"
            onClick={() => navigate("/client/profile")}
          >
            Profile
          </button>

          <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss"
            onClick={() => navigate("/logout")}
          >
            Logout
          </button>
          </div>

        </div>

      </header>


      {/* WELCOME */}

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">

        <h1 className="font-display text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
          Welcome back, {client.name} 👋
        </h1>

        <p className="mt-3 max-w-xl text-base leading-7 text-ink/60">
          Manage your therapy sessions and
          stay connected with your therapist.
        </p>


        {/* UPCOMING SESSION */}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">

          <div className="rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_rgba(31,41,36,.05)] sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Upcoming Session</h2>

          {upcomingSession ? (

            <div className="mt-6 rounded-2xl bg-sage/60 p-5">

              <h3>
                {upcomingSession.therapist.name}
              </h3>

              <p>
                Date:{" "}
                {new Date(
                  upcomingSession.starts_at
                ).toLocaleDateString()}
              </p>

              <p>
                Time:{" "}
                {new Date(
                  upcomingSession.starts_at
                ).toLocaleTimeString()}
              </p>

              <p>
                Duration:{" "}
                {upcomingSession.duration} minutes
              </p>

              <button className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-moss"
                onClick={() => setSelectedSession(upcomingSession)}
              >
                View Session
              </button>

              <button>
                Cancel
              </button>

            </div>

          ) : (

            <div className="mt-6 rounded-2xl border border-dashed border-ink/15 p-6">

              <p>
                You don't have any upcoming sessions.
              </p>

              <button className="mt-4 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white hover:bg-ink"
                onClick={() =>
                  navigate("/client/book")
                }
              >
                Book a Session
              </button>

            </div>

          )}
          </div>
          <div className="soft-grid rounded-[28px] border border-moss/10 bg-sage p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">Quick Actions</h2>
            <div className="mt-6 space-y-3">
              <button onClick={() => navigate('/client/book')} className="w-full rounded-2xl bg-white/80 px-4 py-3 text-left text-sm font-semibold hover:bg-white">Book a Session</button>
              <button onClick={() => navigate('/client/payments')} className="w-full rounded-2xl bg-white/80 px-4 py-3 text-left text-sm font-semibold hover:bg-white">Payments</button>
              <button onClick={() => navigate('/client/chat')} className="w-full rounded-2xl bg-white/80 px-4 py-3 text-left text-sm font-semibold hover:bg-white">Chat with Therapist</button>
            </div>
          </div>

        </section>

        <section className="mt-6 rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[.15em] text-ink/45">Flexible care</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Packages from your therapist</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {packages.map((packageRecord) => (
              <div key={packageRecord._id} className="rounded-2xl border border-ink/10 bg-cream p-5">
                <h3 className="font-display text-lg font-semibold">{packageRecord.name}</h3>
                <p className="mt-1 text-sm text-ink/55">{packageRecord.session_count} sessions · {packageRecord.expiry_days} days</p>
                <p className="mt-4 font-display text-2xl font-semibold">INR {packageRecord.total_price}</p>
                <button disabled={packageLoading} onClick={() => purchasePackage(packageRecord)} className="mt-4 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-moss disabled:opacity-50">Buy package</button>
              </div>
            ))}
          </div>
          {!packages.length && <p className="mt-4 text-sm text-ink/55">Your therapist has not published packages yet.</p>}
        </section>


        {/* QUICK ACTIONS */}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          <h2>Quick Actions</h2>

          <button
            onClick={() =>
              navigate("/client/book")
            }
          >
            📅 Book Session
          </button>


          <button
            onClick={() =>
              navigate("/client/payments")
            }
          >
            💳 Payments
          </button>


          <button
            onClick={() =>
              navigate("/client/chat")
            }
          >
            💬 Chat
          </button>

        </section>


        {/* PACKAGE */}

        <section>

          <div className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">My Package</h2>

          {clientPackage ? (

            <div className="mt-6 space-y-3 text-sm text-ink/65">

              <h3>
                {clientPackage.package.name}
              </h3>

              <p>
                Total Sessions:{" "}
                {clientPackage.total_sessions}
              </p>

              <p>
                Sessions Used:{" "}
                {clientPackage.sessions_used}
              </p>

              <p>
                Sessions Remaining:{" "}
                {clientPackage.sessions_remaining}
              </p>

              <p>
                Expires:{" "}
                {new Date(
                  clientPackage.expires_at
                ).toLocaleDateString()}
              </p>

            </div>

          ) : (

            <div className="mt-6">

              <p>
                You don't have an active package.
              </p>

              <button
                onClick={() =>
                  navigate("/client/packages")
                }
              >
                View Packages
              </button>

            </div>

          )}
          </div>

        </section>


        {/* SHARED NOTES */}

        <section>

          <div className="rounded-[28px] border border-ink/10 bg-[#f0ece5] p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Shared Notes</h2>

          {sharedNotes.length > 0 ? (

            sharedNotes.map((note) => (

              <div key={note._id} className="mt-4 border-b border-ink/10 pb-4 last:border-0">

                <h3>
                  Session Note
                </h3>

                <p>
                  {new Date(
                    note.createdAt
                  ).toLocaleDateString()}
                </p>

                <p>
                  {note.content}
                </p>

              </div>

            ))

          ) : (

            <p>
              No shared notes yet.
            </p>

          )}
          </div>

        </section>


        {/* SESSION HISTORY */}

        <section className="mt-6 rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">

          <h2 className="font-display text-2xl font-semibold">Recent Sessions</h2>

          {sessions.length > 0 ? (

            sessions.map((session) => (

              <div key={session._id} className="mt-3 flex items-center justify-between rounded-2xl border border-ink/10 p-4">

                <p>
                  {new Date(
                    session.starts_at
                  ).toLocaleDateString()}
                </p>

                <p>
                  {session.therapist.name}
                </p>

                <p>
                  {session.status}
                </p>

                <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss" onClick={() => setSelectedSession(session)}>
                  View
                </button>

              </div>

            ))

          ) : (

            <p>
              No previous sessions.
            </p>

          )}

        </section>

      </main>

      <Modal open={Boolean(selectedSession)}>
        {selectedSession && <div>
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-moss">Session details</p><h2 className="mt-2 font-display text-2xl font-semibold">Your therapy session</h2></div>
            <button onClick={() => setSelectedSession(null)} className="text-sm font-bold text-ink/45 hover:text-ink">Close</button>
          </div>
          <div className="mt-6 space-y-3 rounded-2xl bg-cream p-5 text-sm text-ink/70">
            <p><strong>Session:</strong> {selectedSession.session_code || 'Code pending'}</p>
            <p><strong>Therapist:</strong> {selectedSession.therapist?.name || 'Your therapist'}</p>
            <p><strong>Date:</strong> {new Date(selectedSession.starts_at).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date(selectedSession.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
            <p><strong>Status:</strong> <span className="capitalize">{selectedSession.status}</span></p>
          </div>
          <button onClick={() => navigate(`/chat/${selectedSession._id}?code=${selectedSession.session_code || ''}&resume=${Date.now()}`)} className="mt-6 w-full rounded-full bg-moss px-5 py-3 text-sm font-bold text-white hover:bg-ink">Join / resume session</button>
        </div>}
      </Modal>

    </div>
  );
}

export default ClientPortal;