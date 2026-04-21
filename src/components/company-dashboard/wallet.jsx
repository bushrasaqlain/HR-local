import React, { Component } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ─── Responsive CSS injected once into <head> ─────────────────────────────────
const STYLES = `
  .cw-root {
    min-height: 100vh;
    background: #f8fafc;
    padding: 32px 28px;
    font-family: 'DM Sans', 'Outfit', ui-sans-serif, system-ui, sans-serif;
    box-sizing: border-box;
  }
  .cw-root *, .cw-root *::before, .cw-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Header ── */
  .cw-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cw-header h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .cw-header p  { font-size: 13px; color: #94a3b8; }

  /* ── Buy button ── */
  .cw-btn-buy {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #0f172a;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .cw-btn-buy:hover { background: #1e293b; }

  /* ── Package cards grid ── */
  .cw-pkg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }

  /* ── Stat cards grid ── */
  .cw-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }

  /* ── Charts row ── */
  .cw-charts-row {
    display: grid;
    grid-template-columns: 1fr 1.6fr;
    gap: 16px;
    margin-bottom: 28px;
  }

  /* ── Generic chart card ── */
  .cw-chart-card {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px 20px 16px;
  }
  .cw-section-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 4px;
    display: block;
  }
  .cw-chart-sub { font-size: 13px; color: #64748b; margin-bottom: 16px; display: block; }

  /* Donut */
  .cw-donut-wrap   { position: relative; width: 100%; height: 200px; }
  .cw-donut-center {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    text-align: center; pointer-events: none;
  }
  .cw-donut-pct { font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1; display: block; }
  .cw-donut-sub-lbl { font-size: 10px; color: #94a3b8; display: block; }

  /* Bar */
  .cw-bar-wrap { position: relative; width: 100%; height: 200px; }

  /* Legend */
  .cw-legend { display: flex; gap: 16px; margin-top: 14px; flex-wrap: wrap; }
  .cw-legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #64748b; }
  .cw-legend-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; display: inline-block; }

  /* ── Payment table ── */
  .cw-payment-section { margin-bottom: 28px; }
  .cw-payment-table { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .cw-payment-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #f8fafc;
  }
  .cw-payment-row:last-child { border-bottom: none; }
  .cw-payment-row:nth-child(even) { background: #fafafa; }
  .cw-payment-label { font-size: 13px; color: #64748b; }
  .cw-payment-value { font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; }

  /* ── Actions ── */
  .cw-actions { display: flex; gap: 12px; flex-wrap: wrap; }
  .cw-btn-accent {
    padding: 11px 24px; color: #fff; border: none; border-radius: 10px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
  }
  .cw-btn-outline {
    padding: 11px 24px; background: #fff; color: #64748b;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
  }
  .cw-btn-outline:hover { background: #f8fafc; }

  /* ── States ── */
  .cw-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 300px; color: #94a3b8; font-size: 14px; gap: 10px;
    font-family: 'DM Sans', ui-sans-serif, sans-serif;
  }
  .cw-error {
    padding: 24px; background: #fef2f2; border: 1.5px solid #fecaca;
    border-radius: 12px; color: #dc2626; font-size: 14px;
    font-family: 'DM Sans', ui-sans-serif, sans-serif;
  }
  .cw-empty {
    padding: 40px; text-align: center; color: #94a3b8; font-size: 14px;
    font-family: 'DM Sans', ui-sans-serif, sans-serif;
  }
  @keyframes cw-spin { to { transform: rotate(360deg); } }
  .cw-spin { animation: cw-spin 1s linear infinite; }

  /* ── TABLET ≤ 900px ── */
  @media (max-width: 900px) {
    .cw-stat-grid  { grid-template-columns: repeat(2, 1fr); }
    .cw-charts-row { grid-template-columns: 1fr; }
    .cw-bar-wrap   { height: 220px; }
  }

  /* ── SMALL TABLET / LARGE PHONE ≤ 640px ── */
  @media (max-width: 640px) {
    .cw-root        { padding: 20px 16px; }
    .cw-pkg-grid    { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .cw-stat-grid   { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .cw-header h1   { font-size: 20px; }
    .cw-btn-buy     { padding: 9px 14px; font-size: 12px; }
    .cw-actions     { flex-direction: column; }
    .cw-btn-accent,
    .cw-btn-outline { width: 100%; justify-content: center; }
    .cw-payment-row { padding: 10px 14px; }
  }

  /* ── MOBILE ≤ 420px ── */
  @media (max-width: 420px) {
    .cw-root      { padding: 16px 12px; }
    .cw-pkg-grid  { grid-template-columns: 1fr; }
    .cw-stat-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .cw-header    { flex-direction: column; align-items: flex-start; }
    .cw-btn-buy   { width: 100%; justify-content: center; }
    .cw-donut-wrap { height: 170px; }
    .cw-donut-pct  { font-size: 18px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("cw-styles")) {
  const tag = document.createElement("style");
  tag.id = "cw-styles";
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_META = {
  cv_credits:   { label: "CV Credits",   color: "#4F8EF7", light: "#dbeafe" },
  job_slot:     { label: "Job Slots",    color: "#A78BFA", light: "#ede9fe" },
  subscription: { label: "Subscription", color: "#34D399", light: "#d1fae5" },
  bundle:       { label: "Bundle",       color: "#F59E0B", light: "#fef3c7" },
};
const ICONS = ["◈", "⬟", "▣", "⬡"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct      = (used, total) => total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
const fmtPrice = (n)           => `PKR ${Number(n).toLocaleString("en-PK")}`;
const fmtDate  = (d)           => d
  ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
  : "N/A";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IconHistory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconSpinner = () => (
  <svg className="cw-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// ─── PackageCard ──────────────────────────────────────────────────────────────
function PackageCard({ pkg, index, isSelected, onClick }) {
  const meta  = TYPE_META[pkg.type] || TYPE_META.bundle;
  const usage = pct(pkg.used, pkg.total);
  const isExp = pkg.status === "expired";

  return (
    <div
      onClick={onClick}
      style={{
        background:   isSelected ? "#1e293b" : "#fff",
        border:       isSelected ? `2px solid ${meta.color}` : "1.5px solid #e2e8f0",
        borderRadius: 16,
        padding:      "18px 16px",
        cursor:       "pointer",
        transition:   "all 0.2s ease",
        position:     "relative",
        overflow:     "hidden",
      }}
    >
      {/* top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3, background: meta.color, borderRadius: "16px 16px 0 0",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, marginTop: 4 }}>
        <span style={{ fontSize: 20, lineHeight: 1, color: meta.color }}>{ICONS[index % ICONS.length]}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
          padding: "3px 8px", borderRadius: 99,
          background: isSelected ? "rgba(255,255,255,0.12)" : meta.light,
          color:      isSelected ? "#fff" : meta.color,
          textTransform: "uppercase",
        }}>
          {meta.label}
        </span>
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "#94a3b8" : "#64748b", marginBottom: 2 }}>{pkg.name}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: isSelected ? "#f8fafc" : "#0f172a", lineHeight: 1.1, marginBottom: 2 }}>{pkg.remaining}</p>
      <p style={{ fontSize: 11, color: isSelected ? "#64748b" : "#94a3b8", marginBottom: 12 }}>of {pkg.total} remaining</p>

      <div style={{ height: 5, background: isSelected ? "#334155" : "#f1f5f9", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${usage}%`, height: "100%", background: isExp ? "#94a3b8" : meta.color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: isSelected ? "#475569" : "#94a3b8" }}>{usage}% used</span>
        <span style={{ fontSize: 10, color: isExp ? "#f87171" : isSelected ? "#475569" : "#94a3b8" }}>
          {isExp ? "Expired" : `Exp ${fmtDate(pkg.expiresRaw)}`}
        </span>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e2e8f0",
      borderRadius: 12, padding: "14px 16px",
      borderLeft: `4px solid ${accent}`,
    }}>
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1, marginBottom: 2 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</p>}
    </div>
  );
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
function DonutChart({ pkg }) {
  const meta  = TYPE_META[pkg.type] || TYPE_META.bundle;
  const usage = pct(pkg.used, pkg.total);

  const data = {
    labels: ["Used", "Remaining"],
    datasets: [{
      data: [pkg.used, pkg.remaining],
      backgroundColor: [meta.color, "#f1f5f9"],
      borderColor:     [meta.color, "#e2e8f0"],
      borderWidth: 1,
      hoverOffset: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${pct(ctx.parsed, pkg.total)}%)` } },
    },
  };

  return (
    <div className="cw-donut-wrap">
      <Doughnut data={data} options={options} />
      <div className="cw-donut-center">
        <span className="cw-donut-pct">{usage}%</span>
        <span className="cw-donut-sub-lbl">used</span>
      </div>
    </div>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
function BarChart({ packages }) {
  const data = {
    labels: packages.map((p) => (TYPE_META[p.type] || TYPE_META.bundle).label),
    datasets: [
      {
        label: "Used",
        data: packages.map((p) => p.used),
        backgroundColor: packages.map((p) => (TYPE_META[p.type] || TYPE_META.bundle).color),
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Remaining",
        data: packages.map((p) => p.remaining),
        backgroundColor: "#e2e8f0",
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 }, color: "#94a3b8" } },
      y: { stacked: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 }, color: "#94a3b8" } },
    },
  };

  return <div className="cw-bar-wrap"><Bar data={data} options={options} /></div>;
}

// ─── PaymentDetails ───────────────────────────────────────────────────────────
function PaymentDetails({ pkg }) {
  const meta  = TYPE_META[pkg.type] || TYPE_META.bundle;
  const isExp = pkg.status === "expired";

  const rows = [
    { label: "Package name", value: pkg.name },
    {
      label: "Type",
      value: (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
          background: meta.light, color: meta.color,
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>{meta.label}</span>
      ),
    },
    { label: "Amount paid", value: fmtPrice(pkg.price) },
    {
      label: "Status",
      value: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: isExp ? "#ef4444" : "#10b981" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: isExp ? "#ef4444" : "#10b981", display: "inline-block" }} />
          {isExp ? "Expired" : "Active"}
        </span>
      ),
    },
    { label: "Expiry date", value: fmtDate(pkg.expiresRaw) },
    { label: "Total units",  value: pkg.total },
    { label: "Units used",   value: pkg.used },
    { label: "Units left",   value: pkg.remaining },
    { label: "Usage",        value: `${pct(pkg.used, pkg.total)}%` },
  ];

  return (
    <div className="cw-payment-table">
      {rows.map((r, i) => (
        <div key={i} className="cw-payment-row">
          <span className="cw-payment-label">{r.label}</span>
          <span className="cw-payment-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
class CompanyWallet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      packages:     [],
      selectedCard: 0,
      loading:      true,
      error:        null,
    };
    this.userId =
      typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
  }

  componentDidMount() {
    this.fetchPackages();
  }

  fetchPackages = async () => {
    this.setState({ loading: true, error: null });
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    try {
      const { userId } = this;
      if (!userId || userId === "undefined") {
        this.setState({ error: "User ID missing.", loading: false });
        return;
      }

      const response = await axios.get(`${apiBaseUrl}job/getUserPackages/${userId}`);

      const formatted = response.data.map((p) => {
        const pkg   = p.package || {};
        const total = pkg.num_posts || pkg.slot_count || pkg.credit_count || 0;
        const used  = p.used_posts  || p.used_credits || p.used_slots     || 0;

        return {
          id:         p.subscription_id,
          name:       pkg.name   || "Package",
          type:       pkg.type   || "bundle",
          total,
          used,
          remaining:  Math.max(total - used, 0),
          price:      pkg.price  || 0,
          status:     p.status   || "active",
          expiresRaw: p.end_date || null,
        };
      });

      this.setState({ packages: formatted, loading: false });
    } catch (err) {
      console.error("Wallet API ERROR:", err.response?.data || err.message);
      this.setState({ error: "Failed to load packages. Please try again.", loading: false });
    }
  };

  render() {
    const { packages, selectedCard, loading, error } = this.state;

    if (loading) return <div className="cw-loading"><IconSpinner /> Loading wallet…</div>;
    if (error)   return <div className="cw-error">{error}</div>;
    if (!packages.length) return <div className="cw-empty">No packages found. Purchase a package to get started.</div>;

    const pkg  = packages[selectedCard];
    const meta = TYPE_META[pkg.type] || TYPE_META.bundle;

    return (
      <div className="cw-root">

        {/* Header */}
        <div className="cw-header">
          <div>
            <h1>Company Wallet</h1>
            <p>{packages.length} package{packages.length !== 1 ? "s" : ""} found</p>
          </div>
          <button
            className="cw-btn-buy"
            onClick={() => { /* router.push('/pricing') or open modal */ alert("Redirect to pricing page"); }}
          >
            <IconPlus /> Buy More Packages
          </button>
        </div>

        {/* Package cards */}
        <div className="cw-pkg-grid">
          {packages.map((p, i) => (
            <PackageCard
              key={p.id}
              pkg={p}
              index={i}
              isSelected={selectedCard === i}
              onClick={() => this.setState({ selectedCard: i })}
            />
          ))}
        </div>

        {/* Stat cards */}
        <div className="cw-stat-grid">
          <StatCard label="Total Units"  value={pkg.total}           sub="in this package"                        accent={meta.color} />
          <StatCard label="Used"         value={pkg.used}            sub={`${pct(pkg.used, pkg.total)}% consumed`} accent="#f59e0b" />
          <StatCard label="Remaining"    value={pkg.remaining}       sub="available now"                          accent="#10b981" />
          <StatCard label="Amount Paid"  value={fmtPrice(pkg.price)} sub={meta.label}                             accent="#8b5cf6" />
        </div>

        {/* Charts */}
        <div className="cw-charts-row">

          <div className="cw-chart-card">
            <span className="cw-section-label">Usage Breakdown</span>
            <span className="cw-chart-sub">{pkg.name}</span>
            <DonutChart pkg={pkg} />
            <div className="cw-legend" style={{ justifyContent: "center" }}>
              {[
                { label: "Used",      color: meta.color },
                { label: "Remaining", color: "#f1f5f9", border: "#e2e8f0" },
              ].map((l) => (
                <span key={l.label} className="cw-legend-item">
                  <span className="cw-legend-swatch" style={{ background: l.color, border: l.border ? `1px solid ${l.border}` : "none" }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          <div className="cw-chart-card">
            <span className="cw-section-label">All Packages — Used vs Remaining</span>
            <span className="cw-chart-sub">Stacked by package type</span>
            <BarChart packages={packages} />
            <div className="cw-legend">
              <span className="cw-legend-item">
                <span className="cw-legend-swatch" style={{ background: "#e2e8f0", border: "1px solid #cbd5e1" }} />
                Remaining
              </span>
              {packages.map((p) => {
                const m = TYPE_META[p.type] || TYPE_META.bundle;
                return (
                  <span key={p.id} className="cw-legend-item">
                    <span className="cw-legend-swatch" style={{ background: m.color }} />
                    {m.label}
                  </span>
                );
              })}
            </div>
          </div>

        </div>

        {/* Payment Details */}
        <div className="cw-payment-section">
          <span className="cw-section-label" style={{ marginBottom: 12, display: "block" }}>
            Payment Details — {pkg.name}
          </span>
          <PaymentDetails pkg={pkg} />
        </div>

        {/* Actions */}
        <div className="cw-actions">
          <button
            className="cw-btn-accent"
            style={{ background: meta.color }}
            onClick={() => { alert("Redirect to pricing page"); }}
          >
            <IconPlus /> Buy More
          </button>
          <button className="cw-btn-outline" onClick={this.fetchPackages}>
            <IconRefresh /> Refresh
          </button>
          <button className="cw-btn-outline" onClick={() => { alert("Open transaction history"); }}>
            <IconHistory /> View Transaction History
          </button>
        </div>

      </div>
    );
  }
}

export default CompanyWallet;