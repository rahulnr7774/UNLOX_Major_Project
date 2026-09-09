import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Download,
  Package,
  Receipt,
  ShieldCheck,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CheckoutForm from "../../components/payments/CheckoutForm";
import InvoiceView from "../../components/payments/InvoiceView";

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not recorded";
}

function formatShortDate(value) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";
}

function getStatusStyles(status) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "failed") {
    return "bg-red-50 text-red-600";
  }

  return "bg-amber-50 text-amber-700";
}

function getPaymentLabel(payment) {
  if (payment.package_id?.name) {
    return payment.package_id.name;
  }

  if (payment.session_id) {
    return "Therapy session";
  }

  return "Payment";
}

async function downloadReceipt(payment, onError) {
  try {
    const response = await axiosInstance.get(`/clients/payments/${payment._id}/receipt`, {
      responseType: "blob",
    });
    const receiptNumber = payment.invoice_number || `UF-${payment._id}`;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receiptNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (requestError) {
    onError(requestError.response?.data?.message || "Unable to download the receipt.");
  }
}

export default function Payment() {
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance
      .get("/clients/portal")
      .then(({ data }) => {
        setClient(data.client);
        setPayments(data.payments || []);
        setPackages(data.packages || []);
      })
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ||
            "Unable to load payment history."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  async function payForPackage() {
    if (!selectedPackage) return;

    setCheckoutLoading(true);
    setError("");

    try {
      const { data } = await axiosInstance.post(
        `/client-booking/packages/${selectedPackage._id}/orders`
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
        description: selectedPackage.name,
        order_id: data.order.id,

        prefill: {
          name: client?.name || "",
          email: client?.email || "",
          contact: client?.phone || "",
        },

        handler: async (result) => {
          try {
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

            setSelectedPackage(null);

            const response = await axiosInstance.get(
              "/clients/portal"
            );

            setPayments(response.data.payments || []);
          } catch (requestError) {
            setError(
              requestError.response?.data?.message ||
                "Payment verification failed."
            );
          } finally {
            setCheckoutLoading(false);
          }
        },

        modal: {
          ondismiss: () => setCheckoutLoading(false),
        },

        theme: {
          color: "#10B981",
        },
      });

      checkout.open();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to start payment."
      );

      setCheckoutLoading(false);
    }
  }

  function goToPackagePlans() {
    document.getElementById("package-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const totalPaid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const successfulPayments = payments.filter(
    (payment) => payment.status === "paid"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF9]">
        <p className="text-sm font-medium text-[#64748B]">
          Loading payment history...
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#F8FAF9] text-[#1E293B]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">

          {/* =====================================================
              BACK
          ====================================================== */}
          <button
            onClick={() => navigate("/client-portal")}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#64748B] transition-colors duration-150 hover:text-[#1E293B]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>

          {/* =====================================================
              HEADER
          ====================================================== */}
          <header className="mb-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
                  <CreditCard size={13} />
                  Payments
                </div>

                <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-[#1E293B] sm:text-4xl">
                  Payment history
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
                  Manage your payments, view receipts, and purchase
                  another care package securely.
                </p>
              </div>

              {packages.length > 0 && (
                <button
                  onClick={() => setSelectedPackage(packages[0])}
                  className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-bold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-600"
                >
                  <Package size={17} />
                  Buy a package
                </button>
              )}
            </div>
          </header>

          {/* =====================================================
              ERROR
          ====================================================== */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* =====================================================
              SUMMARY
          ====================================================== */}
          <section className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Total paid"
              value={`INR ${totalPaid}`}
              icon={CreditCard}
              helper="Successful payments"
            />

            <SummaryCard
              label="Transactions"
              value={payments.length}
              icon={Receipt}
              helper="All payment records"
            />

            <SummaryCard
              label="Successful"
              value={successfulPayments}
              icon={CheckCircle2}
              helper="Completed payments"
            />
          </section>

          {/* =====================================================
              TRANSACTIONS
          ====================================================== */}
          <section className="mt-6 rounded-[26px] border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Receipt size={17} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
                    Financial activity
                  </p>

                  <h2 className="mt-0.5 font-display text-xl font-semibold text-[#1E293B]">
                    Transactions
                  </h2>
                </div>
              </div>

              {payments.length > 0 && (
                <p className="text-xs text-[#94A3B8]">
                  {payments.length}{" "}
                  {payments.length === 1
                    ? "transaction"
                    : "transactions"}
                </p>
              )}
            </div>

            {payments.length > 0 ? (
              <div className="mt-6 space-y-2.5">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="group flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-[#FAFAF9] p-4 transition-colors duration-150 hover:bg-white sm:flex-row sm:items-center"
                  >
                    {/* Icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      {payment.package_id ? (
                        <Package size={18} />
                      ) : (
                        <CreditCard size={18} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#1E293B]">
                        {getPaymentLabel(payment)}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#94A3B8]">
                        <span>
                          {formatDate(
                            payment.paid_at ||
                              payment.createdAt
                          )}
                        </span>

                        <span className="hidden h-1 w-1 rounded-full bg-[#CBD5E1] sm:block" />

                        <span className="capitalize">
                          {payment.payment_method ||
                            "Razorpay"}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="font-display text-lg font-semibold text-[#1E293B]">
                          INR {payment.amount}
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${getStatusStyles(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>

                      {payment.status === "paid" ? (
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#64748B] transition-colors duration-150 hover:border-emerald-300 hover:text-emerald-600"
                        >
                          <Receipt size={14} />
                          Receipt
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={goToPackagePlans}
                          className="max-w-28 text-right text-[10px] font-semibold leading-4 text-amber-700 underline decoration-amber-300 underline-offset-2 transition-colors hover:text-emerald-600 sm:max-w-36"
                        >
                          Make a payment to enable receipt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#DDE5E1] bg-[#FAFAF9] px-6 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#94A3B8] shadow-sm">
                  <Receipt size={20} />
                </div>

                <h3 className="mt-4 text-sm font-bold text-[#1E293B]">
                  No payments yet
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#64748B]">
                  Your completed payments and receipts will appear
                  here.
                </p>

                {packages.length > 0 && (
                  <button
                    onClick={() =>
                      setSelectedPackage(packages[0])
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-colors duration-150 hover:bg-emerald-600"
                  >
                    Explore packages
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </section>

          {/* =====================================================
              PACKAGES
          ====================================================== */}
          {packages.length > 0 && (
            <section id="package-plans" className="mt-6 scroll-mt-6 rounded-[26px] border border-emerald-100 bg-[#ECFDF5] p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <Package size={17} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                      Continue your care
                    </p>

                    <h2 className="mt-0.5 font-display text-xl font-semibold text-[#1E293B]">
                      Available packages
                    </h2>
                  </div>
                </div>

                <div className="hidden items-center gap-2 text-xs font-medium text-emerald-700 sm:flex">
                  <ShieldCheck size={15} />
                  Secure checkout
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {packages.map((packageRecord) => (
                  <div
                    key={packageRecord._id}
                    className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-shadow duration-150 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-[#1E293B]">
                          {packageRecord.name}
                        </h3>

                        <p className="mt-1 text-xs text-[#64748B]">
                          {packageRecord.session_count} sessions
                          {" · "}
                          {packageRecord.expiry_days} days
                        </p>
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Package size={17} />
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                        Package price
                      </p>

                      <p className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
                        INR {packageRecord.total_price}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedPackage(packageRecord)
                      }
                      className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-emerald-600"
                    >
                      Buy package
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ==========================================================
          RECEIPT MODAL
      =========================================================== */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/45 p-4 sm:p-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-[#FAFAF9] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                  <Receipt size={12} />
                  Payment receipt
                </div>

                <h2 className="mt-3 font-display text-2xl font-semibold text-[#1E293B]">
                  Receipt
                </h2>

                <p className="mt-1 text-xs text-[#94A3B8]">
                  {formatShortDate(
                    selectedPayment.paid_at ||
                      selectedPayment.createdAt
                  )}
                </p>
              </div>

              <button
                onClick={() => setSelectedPayment(null)}
                aria-label="Close receipt"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#94A3B8] transition-colors duration-150 hover:bg-white hover:text-[#1E293B]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6">
              <InvoiceView payment={selectedPayment} />
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => downloadReceipt(selectedPayment, setError)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#64748B] transition-colors duration-150 hover:border-emerald-300 hover:text-emerald-600"
              >
                <Download size={15} />
                Download receipt
              </button>

              <button
                onClick={() => setSelectedPayment(null)}
                className="h-11 rounded-full bg-emerald-500 px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-emerald-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          CHECKOUT MODAL
      =========================================================== */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/45 p-4 sm:p-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-[#FAFAF9] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                  <ShieldCheck size={12} />
                  Secure checkout
                </div>

                <h2 className="mt-3 font-display text-2xl font-semibold text-[#1E293B]">
                  Confirm package
                </h2>

                <p className="mt-1 text-xs text-[#94A3B8]">
                  Review your package before continuing.
                </p>
              </div>

              <button
                onClick={() => setSelectedPackage(null)}
                aria-label="Close checkout"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#94A3B8] transition-colors duration-150 hover:bg-white hover:text-[#1E293B]"
              >
                <X size={19} />
              </button>
            </div>

            {/* Selected package summary */}
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Package size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1E293B]">
                    {selectedPackage.name}
                  </p>

                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {selectedPackage.session_count} sessions
                    {" · "}
                    {selectedPackage.expiry_days} days
                  </p>
                </div>

                <p className="ml-auto shrink-0 font-display text-lg font-semibold text-[#1E293B]">
                  INR {selectedPackage.total_price}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <CheckoutForm
                client={client}
                packageRecord={selectedPackage}
                onPay={payForPackage}
                loading={checkoutLoading}
              />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#94A3B8]">
              <ShieldCheck size={13} className="text-emerald-500" />
              Your payment is processed securely.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================
   SMALL COMPONENTS
================================================================ */

function SummaryCard({
  label,
  value,
  icon: Icon,
  helper,
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.035)] transition-shadow duration-150 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
            {label}
          </p>

          <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-[#1E293B]">
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
