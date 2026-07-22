import React, { Component } from "react";
import axios from "axios";
import Head from "next/head";
import api from "../../lib/api";
import { PaymentModal } from "../../company-dashboard/viewpackage";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY = "#36565f";
const TYPE_META = {
  featured_boost:      { label: "Featured Boost",       color: "#36565f", light: "#e8f0f1" },
  duration_bundle:     { label: "Profile Spotlight",    color: "#e8a84c", light: "#fef3e2" },
  profile_top:         { label: "Top of Search",        color: "#36565f", light: "#e8f0f1" },
  highlighted_profile: { label: "Highlighted Profile",  color: "#8899aa", light: "#eef2f5" },
  recruiter_spotlight: { label: "Recruiter Spotlight",  color: "#d4756a", light: "#fde8e8" },
};

const getMeta  = (pkg) => TYPE_META[pkg.boost_type] || TYPE_META[pkg.pricing_model] || TYPE_META.featured_boost;
const fmtPrice = (n, cur = "PKR") => `${cur} ${Number(n || 0).toLocaleString("en-PK")}`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
const daysLeft = (end) => end ? Math.ceil((new Date(end) - new Date()) / 86400000) : null;

const statusStyle = { active: ["success", "Active"], pending: ["warning", "Pending"], expired: ["danger", "Expired"], rejected: ["secondary", "Rejected"] };

// ─── Small helpers ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const [variant, label] = statusStyle[status] || statusStyle.rejected;
  return <span className={`badge bg-${variant} bg-opacity-10 text-${variant} border border-${variant} border-opacity-25`}>{label}</span>;
};

const SectionTitle = ({ title, sub }) => (
  <div className="mb-3">
    <h6 className="fw-bold mb-0" style={{ color: PRIMARY }}>{title}</h6>
    {sub && <small className="text-muted">{sub}</small>}
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div className="card border-0 shadow-sm h-100" style={{ borderTop: `3px solid ${accent}` }}>
    <div className="card-body">
      <p className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: 11 }}>{label}</p>
      <h3 className="fw-bold mb-0" style={{ color: PRIMARY }}>{value}</h3>
      {sub && <small className="text-muted">{sub}</small>}
    </div>
  </div>
);

// ─── Package Card ─────────────────────────────────────────────────────────────
const PkgCard = ({ pkg, isSelected, onClick }) => {
  const { color, label } = getMeta(pkg);
  const days = daysLeft(pkg.end_date);
  const pct  = pkg.status === "active" && pkg.duration_days > 0 && days !== null
    ? Math.max(0, Math.min(100, Math.round(((pkg.duration_days - Math.max(days, 0)) / pkg.duration_days) * 100)))
    : pkg.status === "expired" ? 100 : 0;

  return (
    <div className={`card border-2 h-100 cursor-pointer ${isSelected ? "shadow" : "border-light"}`}
      style={{
        borderTopColor: color,
        borderColor: isSelected ? color : undefined,
        cursor: "pointer",
      }} onClick={onClick}>
      <div className="card-body p-3">
        <StatusBadge status={pkg.status} />
        <p className="fw-semibold mt-2 mb-0" style={{ fontSize: 13 }}>{pkg.package_name}</p>
        <small className="text-muted">{label}</small>
        <div className="mt-2 fw-bold" style={{ color: PRIMARY }}>{fmtPrice(pkg.price, pkg.currency)}</div>
        {pkg.status === "active" && (
          <>
            <div className="progress mt-2" style={{ height: 4 }}>
              <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div className="d-flex justify-content-between mt-1" style={{ fontSize: 10, color: "#aaa" }}>
              <span>{pct}% elapsed</span>
              <span style={{ color: days <= 3 ? "#d4756a" : "#aaa" }}>{days > 0 ? `${days}d left` : "Ends today"}</span>
            </div>
          </>
        )}
        {pkg.status === "pending" && <div className="alert alert-warning p-1 mt-2 mb-0" style={{ fontSize: 11 }}>Awaiting admin activation</div>}
      </div>
    </div>
  );
};

// ─── Spend Snapshot ───────────────────────────────────────────────────────────
const SpendSnapshot = ({ packages }) => {
  const valid = packages.filter(p => Number(p.price) > 0);
  if (!valid.length) return <p className="text-muted text-center py-4">No spend data yet</p>;

  const total = valid.reduce((s, p) => s + Number(p.price), 0);
  const data  = {
    labels: valid.map(p => p.package_name),
    datasets: [{ data: valid.map(p => Number(p.price)), backgroundColor: valid.map(p => getMeta(p).color), borderColor: "#fff", borderWidth: 2 }],
  };

  return (
    <div className="d-flex align-items-center gap-4 flex-wrap">
      <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
        <Doughnut data={data} options={{ cutout: "72%", plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <strong style={{ fontSize: 13, color: PRIMARY }}>{fmtPrice(total)}</strong>
          <div style={{ fontSize: 10, color: "#aaa" }}>Total</div>
        </div>
      </div>
      <div className="flex-grow-1">
        {valid.map((p, i) => {
          const { color, label } = getMeta(p);
          return (
            <div key={i} className="d-flex align-items-center gap-2 mb-2">
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: "#777" }}>{label}</div>
                <div className="fw-bold" style={{ fontSize: 14, color: PRIMARY }}>{fmtPrice(p.price, p.currency)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Package Detail ───────────────────────────────────────────────────────────
const PackageDetail = ({ pkg }) => {
  const { color, light, label } = getMeta(pkg);
  const days = daysLeft(pkg.end_date);
  const rows = [
    ["Package", pkg.package_name],
    ["Type", <span key="t" className="badge" style={{ background: light, color }}>{label}</span>],
    ["Amount", fmtPrice(pkg.price, pkg.currency)],
    ["Status", <StatusBadge key="s" status={pkg.status} />],
    ["Duration", `${pkg.duration_days || 0} days`],
    ["Start", fmtDate(pkg.start_date)],
    ["Expiry", fmtDate(pkg.end_date)],
    ...(pkg.status === "active" && days !== null ? [["Days left", <span key="d" style={{ color: days <= 3 ? "#ef4444" : "#059669", fontWeight: 700 }}>{days > 0 ? `${days} days` : "Expires today"}</span>]] : []),
    ["Purchased", fmtDate(pkg.purchased_at)],
  ];

  return (
    <>
      {pkg.status === "pending" && <div className="alert alert-warning py-2 mb-3" style={{ fontSize: 12 }}>⏳ Under review — will activate shortly.</div>}
      {pkg.status === "active" && days !== null && days <= 3 && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 12 }}>⚠️ Expires in {days} day{days !== 1 ? "s" : ""}. Renew soon.</div>}
      {rows.map(([l, v], i) => (
        <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ fontSize: 13 }}>
          <span className="text-muted">{l}</span>
          <span className="fw-semibold text-end">{v}</span>
        </div>
      ))}
    </>
  );
};

// ─── Activity Timeline ────────────────────────────────────────────────────────
const ActivityTimeline = ({ packages }) => {
  if (!packages.length) return <p className="text-muted text-center py-3">No activity yet</p>;
  const dotColor = { active: PRIMARY, pending: "#e8a84c", expired: "#d4756a", rejected: "#ccc" };
  const events = packages.flatMap(pkg => {
    const ev = [{ date: pkg.purchased_at, title: `Purchased: ${pkg.package_name}`, sub: fmtPrice(pkg.price, pkg.currency), dot: "pending" }];
    if (pkg.status === "active")   ev.push({ date: pkg.start_date,  title: `Activated: ${pkg.package_name}`,  sub: `Runs for ${pkg.duration_days} days`, dot: "active" });
    if (pkg.status === "expired")  ev.push({ date: pkg.end_date,    title: `Expired: ${pkg.package_name}`,    sub: "Boost ended",  dot: "expired" });
    if (pkg.status === "rejected") ev.push({ date: pkg.purchased_at,title: `Rejected: ${pkg.package_name}`,   sub: "Admin rejected", dot: "rejected" });
    return ev;
  }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  return (
    <div style={{ borderLeft: `2px solid #e8e4df`, paddingLeft: 20, position: "relative" }}>
      {events.map((e, i) => (
        <div key={i} className="mb-3 position-relative">
          <span style={{ position: "absolute", left: -27, top: 4, width: 12, height: 12, borderRadius: "50%", background: dotColor[e.dot], border: "2px solid #fff", boxShadow: `0 0 0 2px #e8e4df` }} />
          <div className="fw-semibold" style={{ fontSize: 13 }}>{e.title}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>{e.sub}</div>
          <div style={{ fontSize: 11, color: "#ccc" }}>{fmtDate(e.date)}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Boost Modal ──────────────────────────────────────────────────────────────
class BoostModal extends Component {
  state = { packages: [], selected: null, selectedPkg: null, showPayment: false };

  componentDidMount() {
    const token = localStorage.getItem("token");
    api.get("/candidateProfile/boost/packages", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => this.setState({ packages: res.data.data || [] }));
  }

  handlePaymentSuccess = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await api.post("/candidateProfile/boost/order",
        { package_id: this.state.selected },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.success ? "Boost order placed! Awaiting admin approval." : res.data.message);
      if (res.data.success) this.props.onSuccess();
    } catch { alert("Something went wrong. Please try again."); }
  };

  render() {
    const { packages, selected, selectedPkg, showPayment } = this.state;

    if (showPayment && selectedPkg) {
      const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
      return <PaymentModal pkg={selectedPkg} userId={userId}
        onClose={() => this.setState({ showPayment: false, selectedPkg: null })}
        onSubmit={async () => { this.setState({ showPayment: false, selectedPkg: null }); await this.handlePaymentSuccess(); }} />;
    }

    return (
      <div className="modal d-block" style={{ background: "rgba(0,0,0,0.6)", zIndex: 9999 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 rounded-4" style={{ background: PRIMARY }}>
            <div className="modal-header border-0 text-white">
              <div>
                <h5 className="modal-title fw-bold">Choose a Boost Plan</h5>
                <small className="opacity-75">Select a plan — pay — admin activates your boost</small>
              </div>
              <button className="btn-close btn-close-white" onClick={this.props.onClose} />
            </div>
            <div className="modal-body">
              {!packages.length ? (
                <div className="text-center text-white-50 py-4">No boost packages available.</div>
              ) : (
                <div className="row g-3">
                  {packages.map(pkg => {
                    const isSel = selected === pkg.id;
                    const features = pkg.description ? pkg.description.split("\n").filter(Boolean) : [];
                    return (
                      <div key={pkg.id} className="col-md-4">
                        <div className={`card h-100 border-2 ${isSel ? "border-warning shadow-lg" : "border-0"}`}
                          style={{ cursor: "pointer", transition: "transform .2s", transform: isSel ? "translateY(-4px)" : "none" }}
                          onClick={() => this.setState({ selected: pkg.id, selectedPkg: pkg })}>
                          <div className="card-body p-3">
                            {pkg.is_featured === 1 && <span className="badge bg-primary mb-2">Most Popular</span>}
                            <h6 className="fw-bold mb-0">{pkg.name}</h6>
                            <small className="text-muted">{pkg.boost_duration_days || pkg.duration_days || 30} days</small>
                            <div className="fw-bold fs-4 my-2" style={{ color: PRIMARY }}>{pkg.currency} {Number(pkg.price).toFixed(0)}</div>
                            {features.map((f, i) => (
                              <div key={i} className="d-flex align-items-start gap-1 mb-1">
                                <span className="text-success fw-bold" style={{ fontSize: 12 }}>✓</span>
                                <small>{f}</small>
                              </div>
                            ))}
                            <button className="btn btn-sm w-100 mt-3 fw-semibold"
                              style={{ background: PRIMARY, color: "#fff" }}
                              onClick={e => { e.stopPropagation(); this.setState({ selected: pkg.id, selectedPkg: pkg, showPayment: true }); }}>
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
class CandidateWallet extends Component {
  constructor(props) {
    super(props);
    this.state = { packages: [], selectedCard: 0, loading: true, error: null, activeTab: "overview", showBoostModal: false };
    this.accountId  = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() { this.fetchPackages(); }

  fetchPackages = async () => {
    this.setState({ loading: true, error: null });
    try {
      if (!this.accountId) { this.setState({ error: "User not logged in.", loading: false }); return; }
      const token = localStorage.getItem("token");
      const res = await axios.get(`${this.apiBaseUrl}candidateProfile/candidate-packages/${this.accountId}`, { headers: { Authorization: `Bearer ${token}` } });
      this.setState({ packages: res.data.data || [], loading: false });
    } catch { this.setState({ error: "Failed to load wallet. Please try again.", loading: false }); }
  };

  render() {
    const { packages, selectedCard, loading, error, activeTab, showBoostModal } = this.state;

    if (loading) return <div className="d-flex align-items-center justify-content-center min-vh-100 gap-2 text-muted"><div className="spinner-border spinner-border-sm" style={{ color: PRIMARY }} />Loading wallet…</div>;
    if (error)   return <div className="alert alert-danger m-4">{error}</div>;

    const totalSpend  = packages.reduce((s, p) => s + Number(p.price || 0), 0);
    const activeCount = packages.filter(p => p.status === "active").length;
    const pendingCount= packages.filter(p => p.status === "pending").length;
    const expiredCount= packages.filter(p => p.status === "expired").length;
    const pkg         = packages[selectedCard] || null;

    const Topbar = (
      <div className="bg-white border-bottom d-flex align-items-center justify-content-between px-3 mt-3">
        <div className="d-flex">
          {["overview", "history"].map(tab => (
            <button key={tab} onClick={() => this.setState({ activeTab: tab })} style={{
              background: "none", border: "none", outline: "none",
              borderBottom: activeTab === tab ? `2px solid ${PRIMARY}` : "2px solid transparent",
              borderTop: "none", borderLeft: "none", borderRight: "none",
              color: activeTab === tab ? PRIMARY : "#999",
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: 13, padding: "14px 16px 12px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
              {tab === "overview" ? "Overview" : "Purchase History"}
            </button>
          ))}
        </div>
        <div className="d-flex align-items-center gap-2 py-2">
          <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 12 }} onClick={this.fetchPackages}>Refresh</button>
          <button className="btn btn-sm fw-semibold text-white" style={{ background: PRIMARY, fontSize: 12 }} onClick={() => this.setState({ showBoostModal: true })}>Buy Boost</button>
        </div>
      </div>
    );

    return (
      <div className="bg-light min-vh-100">
        {typeof window !== "undefined" && <Head><title>My Wallet</title></Head>}
        {Topbar}
        {showBoostModal && <BoostModal
          onClose={() => this.setState({ showBoostModal: false })}
          onSuccess={() => { this.setState({ showBoostModal: false }); this.fetchPackages(); }} />}

        <div className="container-fluid p-4">
          {/* History Tab */}
          {activeTab === "history" && (
            <>
              <SectionTitle title="Purchase History" sub="All your boost package transactions" />
              <div className="card border-0 shadow-sm">
                {!packages.length ? (
                  <div className="text-center py-5 text-muted"><div style={{ fontSize: 40 }}>🧾</div><p>No purchases yet</p></div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light text-uppercase" style={{ fontSize: 11 }}>
                        <tr>{["Package","Type","Amount","Duration","Status","Purchased","Expires"].map(h => <th key={h} className="fw-semibold text-muted py-3 px-3">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {packages.map((p, i) => {
                          const { color, light, label } = getMeta(p);
                          return (
                            <tr key={i}>
                              <td className="fw-semibold px-3" style={{ color: PRIMARY }}>{p.package_name}</td>
                              <td className="px-3"><span className="badge" style={{ background: light, color }}>{label}</span></td>
                              <td className="fw-bold px-3">{fmtPrice(p.price, p.currency)}</td>
                              <td className="text-muted px-3">{p.duration_days}d</td>
                              <td className="px-3"><StatusBadge status={p.status} /></td>
                              <td className="text-muted px-3" style={{ whiteSpace: "nowrap" }}>{fmtDate(p.purchased_at)}</td>
                              <td className="text-muted px-3" style={{ whiteSpace: "nowrap" }}>{fmtDate(p.end_date)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              <SectionTitle title="My Wallet" sub="Track your profile boost packages and spending" />
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3"><StatCard label="Total Invested" value={fmtPrice(totalSpend)} sub={`${packages.length} package(s)`} accent={PRIMARY} /></div>
                <div className="col-6 col-md-3"><StatCard label="Active Boosts" value={activeCount} sub="currently running" accent="#e8a84c" /></div>
                <div className="col-6 col-md-3"><StatCard label="Pending" value={pendingCount} sub="awaiting activation" accent="#8899aa" /></div>
                <div className="col-6 col-md-3"><StatCard label="Expired" value={expiredCount} sub="past boosts" accent="#d4756a" /></div>
              </div>

              {!packages.length ? (
                <div className="card border-0 shadow-sm text-center py-5">
                  <div style={{ fontSize: 48 }}>🚀</div>
                  <h5 className="fw-bold mt-3" style={{ color: PRIMARY }}>No boosts yet</h5>
                  <p className="text-muted">Buy a profile boost to appear higher in recruiter searches</p>
                  <div><button className="btn fw-semibold text-white" style={{ background: PRIMARY }} onClick={() => this.setState({ showBoostModal: true })}>+ Buy Your First Boost</button></div>
                </div>
              ) : (
                <>
                  {/* Package cards */}
                  <div className="card border-0 shadow-sm p-4 mb-4">
                    <SectionTitle title="Your Packages" sub={`${packages.length} package(s) — select one to view details`} />
                    <div className="row row-cols-2 row-cols-md-4 g-3">
                      {packages.map((p, i) => <div key={i} className="col"><PkgCard pkg={p} isSelected={selectedCard === i} onClick={() => this.setState({ selectedCard: i })} /></div>)}
                    </div>
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm p-4 h-100">
                        <SectionTitle title="Spend Snapshot" sub="Breakdown by boost type" />
                        <SpendSnapshot packages={packages} />
                      </div>
                    </div>
                    {pkg && (
                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm p-4 h-100">
                          <SectionTitle title="Package Details" sub={pkg.package_name} />
                          <PackageDetail pkg={pkg} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="card border-0 shadow-sm p-4">
                    <SectionTitle title="Activity Timeline" sub="Recent boost activity" />
                    <ActivityTimeline packages={packages} />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
}

export default CandidateWallet;