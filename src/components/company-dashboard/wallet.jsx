import React, { Component } from "react";
import axios from "axios";
import Head from "next/head";
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
import PricingPage from "./viewpackage";
import TransactionHistory from "./transactionhistory";
import NotificationCenter, { NotificationsPage } from "./NotificationCenter";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Bootstrap is loaded globally (add to _app.js or _document.js):
// import 'bootstrap/dist/css/bootstrap.min.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_META = {
  cv_credits:      { label: "CV Credits",    color: "#2164f3", light: "#e8f0fe" },
  job_slot:        { label: "Job Slots",      color: "#7c3aed", light: "#ede9fe" },
  subscription:    { label: "Subscription",   color: "#0891b2", light: "#cffafe" },
  bundle:          { label: "Bundle",         color: "#059669", light: "#d1fae5" },
  duration_bundle: { label: "Bundle",         color: "#059669", light: "#d1fae5" },
  daily_budget:    { label: "Daily Budget",   color: "#854F0B", light: "#FAEEDA" },
  featured_boost:  { label: "Featured Boost", color: "#d97706", light: "#fef3c7" },
};

const pct      = (used, total) => total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
const fmtPrice = (n) => `PKR ${Number(n).toLocaleString("en-PK")}`;
const fmtDate  = (d) => d
  ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
  : "N/A";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconSpinner = () => (
  <div className="spinner-border spinner-border-sm text-primary" role="status">
    <span className="visually-hidden">Loading...</span>
  </div>
);

// ─── PackageCard ──────────────────────────────────────────────────────────────
function PackageCard({ pkg, isSelected, onClick }) {
  const meta  = TYPE_META[pkg.type] || TYPE_META.bundle;
  const usage = pct(pkg.used, pkg.total);
  const isExp = pkg.status === "expired";

  return (
    <div
      className={`card h-100 border-2 ${isSelected ? "border-primary bg-primary bg-opacity-10" : ""}`}
      style={{ cursor: "pointer", borderTopColor: meta.color, transition: "all .15s" }}
      onClick={onClick}
    >
      {/* accent stripe */}
      <div style={{ height: 3, background: meta.color, borderRadius: "0.375rem 0.375rem 0 0" }} />
      <div className="card-body p-3">
        <span className="badge mb-2" style={{ background: meta.light, color: meta.color, fontSize: 10 }}>
          {meta.label}
        </span>
        <p className="text-secondary small mb-1 fw-semibold">{pkg.name}</p>
        <p className="fw-bold fs-4 mb-0 lh-1">{pkg.remaining}</p>
        <p className="text-secondary" style={{ fontSize: 11 }}>of {pkg.total} remaining</p>
        <div className="progress mb-1" style={{ height: 4 }}>
          <div
            className="progress-bar"
            style={{ width: `${usage}%`, background: isExp ? "#d4d4d4" : meta.color }}
          />
        </div>
        <div className="d-flex justify-content-between" style={{ fontSize: 10, color: "#9e9e9e" }}>
          <span>{usage}% used</span>
          <span style={{ color: isExp ? "#ef4444" : "#9e9e9e" }}>
            {isExp ? "Expired" : `Exp ${fmtDate(pkg.expiresRaw)}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── SpendSnapshot (donut) ────────────────────────────────────────────────────
function SpendSnapshot({ packages, activeType }) {
  const displayPackages = activeType
    ? packages.filter(p => p.type === activeType)
    : packages;

  if (displayPackages.length === 0) {
    return (
      <div className="text-center py-5 text-secondary">
        <div style={{ fontSize: 32 }}>📊</div>
        <div className="small mt-2">No data available</div>
      </div>
    );
  }

  const grouped = displayPackages.reduce((acc, p) => {
    const key  = p.type;
    const meta = TYPE_META[key] || TYPE_META.bundle;
    if (!acc[key]) acc[key] = { label: meta.label, color: meta.color, value: 0, isMonetary: p.isDailyBudget };
    // daily budget → sum PKR spent; others → sum units used
    acc[key].value += p.isDailyBudget ? Number(p.price || 0) : (p.used || 0);
    return acc;
  }, {});

  const groups = Object.values(grouped);
  const total  = groups.reduce((s, g) => s + g.value, 0);

  if (total === 0) {
    return (
      <div className="text-center py-5 text-secondary">
        <div style={{ fontSize: 32 }}>📊</div>
        <div className="small mt-2">No usage recorded yet</div>
      </div>
    );
  }

  const data = {
    labels: groups.map(g => g.label),
    datasets: [{
      data: groups.map(g => g.value),
      backgroundColor: groups.map(g => g.color),
      borderColor: "#fff",
      borderWidth: 2,
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true, maintainAspectRatio: false, cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const g = groups[ctx.dataIndex];
            return g.isMonetary
              ? ` ${ctx.label}: ${fmtPrice(ctx.raw)}`
              : ` ${ctx.label}: ${ctx.raw} units used`;
          },
        },
      },
    },
  };

  // For center label — if mixed types, just show count
  const allMonetary = groups.every(g => g.isMonetary);
  const allUnits    = groups.every(g => !g.isMonetary);

  return (
    <div className="d-flex flex-wrap align-items-center gap-4">
      <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
        <Doughnut data={data} options={options} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <span className="fw-bold" style={{ fontSize: 16 }}>
            {allMonetary ? fmtPrice(total) : allUnits ? total : "—"}
          </span><br />
          <span className="text-secondary" style={{ fontSize: 11 }}>
            {allMonetary ? "Total spend" : allUnits ? "Total used" : "Mixed"}
          </span>
        </div>
      </div>
      <div className="row g-3 flex-fill">
        {groups.map((g, i) => (
          <div key={i} className="col-6 d-flex align-items-start gap-2">
            <span className="rounded-circle mt-1 flex-shrink-0"
              style={{ width: 10, height: 10, background: g.color, display: "inline-block" }} />
            <div>
              <div className="text-secondary" style={{ fontSize: 12 }}>{g.label}</div>
              <div className="fw-bold" style={{ fontSize: 17 }}>
                {g.isMonetary ? fmtPrice(g.value) : `${g.value} units`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROI / Usage chart ────────────────────────────────────────────────────────
function UsageROI({ packages, activeTab, onTab }) {
  const tabs = packages
    .map(p => (TYPE_META[p.type] || TYPE_META.bundle).label)
    .filter((v, i, a) => a.indexOf(v) === i);

  const safeTab = tabs.length > 0 ? Math.min(activeTab, tabs.length - 1) : 0;

  if (tabs.length === 0) {
    return <div className="text-center py-5 text-secondary small">No usage data available</div>;
  }

  const filtered = packages.filter(p => (TYPE_META[p.type] || TYPE_META.bundle).label === tabs[safeTab]);
  const totalUsed      = filtered.reduce((s, p) => s + p.used, 0);
  const totalRemaining = filtered.reduce((s, p) => s + p.remaining, 0);
  const usagePct       = pct(totalUsed, totalUsed + totalRemaining);

  const barData = {
    labels: filtered.map(p => p.name),
    datasets: [
      { label: "Used",      data: filtered.map(p => p.used),      backgroundColor: "#36565f", borderRadius: 4, borderSkipped: false },
      { label: "Remaining", data: filtered.map(p => p.remaining), backgroundColor: "#dbeafe", borderRadius: 4, borderSkipped: false },
    ],
  };
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 }, color: "#9e9e9e" } },
      y: { stacked: true, grid: { color: "#f5f5f5" }, ticks: { font: { size: 11 }, color: "#9e9e9e" } },
    },
  };

  // return (
  //   // <div>
  //   //   {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
  //   //     <div>
  //   //       <div className="aw-card-title">Return on Investment</div>
  //   //       <div className="aw-card-range">Usage breakdown by package type</div>
  //   //     </div>
  //   //   </div> */}
  //   //   <div className="aw-roi-tabs">
  //   //     {tabs.map((t, i) => (
  //   //       <button key={t} className={`aw-roi-tab${safeTab === i ? " active" : ""}`} onClick={() => onTab(i)}>
  //   //         {t}
  //   //       </button>
  //   //     ))}
  //   //   </div>
  //   //   <div className="aw-roi-inner">
  //   //     <div className="aw-roi-stats">
  //   //       <div>
  //   //         <div className="aw-roi-stat-label">Total units used</div>
  //   //         <div className="aw-roi-stat-val">{totalUsed.toLocaleString()}</div>
  //   //       </div>
  //   //       <div>
  //   //         <div className="aw-roi-stat-label">Usage rate</div>
  //   //         <div className="aw-roi-stat-val">{usagePct}%</div>
  //   //         <div className="aw-roi-stat-sub">across {filtered.length} package{filtered.length !== 1 ? "s" : ""}</div>
  //   //       </div>
  //   //       <div>
  //   //         <div className="aw-roi-stat-label">Units remaining</div>
  //   //         <div className="aw-roi-stat-val">{totalRemaining.toLocaleString()}</div>
  //   //       </div>
  //   //     </div>
  //   //     <div className="aw-roi-chart">
  //   //       <div className="aw-bar-wrap">
  //   //         <Bar data={barData} options={barOpts} />
  //   //       </div>
  //   //       <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
  //   //         {[{ label: "Used", color: "#2164f3" }, { label: "Remaining", color: "#dbeafe", border: "1px solid #93c5fd" }].map((l) => (
  //   //           <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#767676" }}>
  //   //             <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, border: l.border, display: "inline-block" }} />
  //   //             {l.label}
  //   //           </span>
  //   //         ))}
  //   //       </div>
  //   //     </div>
  //   //   </div>
  //   // </div>
  // );
}

// ─── PackageDetail table ──────────────────────────────────────────────────────
function PackageDetail({ pkg }) {
  const meta      = TYPE_META[pkg.type] || TYPE_META.bundle;
  const isExp     = pkg.status === "expired";
  const isPending = pkg.status === "pending_payment";

  const billingLabel = {
    cpc: "Cost per Profile View",
    cpm: "Cost per 1,000 Profiles",
    cpa: "Cost per Application",
  }[pkg.billingModel] || "—";

  const statusBadge = (
    <span className="d-inline-flex align-items-center gap-1">
      <span className="rounded-circle" style={{ width: 7, height: 7, background: isPending ? "#f59e0b" : isExp ? "#ef4444" : "#10b981", display: "inline-block" }} />
      <span style={{ color: isPending ? "#854F0B" : isExp ? "#ef4444" : "#059669", fontWeight: 700, fontSize: 12.5 }}>
        {isPending ? "Pending Payment" : isExp ? "Expired" : "Active"}
      </span>
    </span>
  );

  const rows = pkg.isDailyBudget ? [
    { label: "Job title",       value: pkg.name },
    { label: "Type",            value: <span className="badge" style={{ background: meta.light, color: meta.color }}>Daily Budget</span> },
    { label: "Status",          value: statusBadge },
    { label: "Billing model",   value: billingLabel },
    { label: "Rate per unit",   value: `PKR ${pkg.ratePerUnit}` },
    { label: "Daily cap",       value: `PKR ${pkg.dailyCapToday}` },
    { label: "Spent today",     value: `PKR ${pkg.dailySpendToday}` },
    { label: "Total spend",     value: fmtPrice(pkg.used) },
    { label: "Deadline",        value: fmtDate(pkg.expiresRaw) },
  ] : [
    { label: "Package name",    value: pkg.name },
    { label: "Type",            value: <span className="badge text-uppercase" style={{ background: meta.light, color: meta.color }}>{meta.label}</span> },
    { label: "Amount paid",     value: fmtPrice(pkg.price) },
    { label: "Status",          value: statusBadge },
    { label: "Expiry date",     value: fmtDate(pkg.expiresRaw) },
    { label: "Total units",     value: pkg.total },
    { label: "Units used",      value: pkg.used },
    { label: "Units left",      value: pkg.remaining },
    { label: "Usage",           value: `${pct(pkg.used, pkg.total)}%` },
  ];

  return (
    <>
      {isPending && (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2 small fw-semibold mb-3">
          ⚠️ This job is pending — add a payment method in your wallet to activate it.
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom small">
          <span className="text-secondary">{r.label}</span>
          <span className="fw-bold text-end">{r.value}</span>
        </div>
      ))}
    </>
  );
}

// ─── Payment Method card ──────────────────────────────────────────────────────
function PaymentMethodCard({ method, onAdd, onChange }) {
  const brandColors = {
    visa:       { bg: "linear-gradient(135deg, #1a1f71, #0d3880)", label: "VISA", text: "#fff" },
    mastercard: { bg: "linear-gradient(135deg, #eb001b, #f79e1b)", label: "MC",   text: "#fff" },
    amex:       { bg: "linear-gradient(135deg, #007bc1, #00a8e0)", label: "AMEX", text: "#fff" },
    discover:   { bg: "linear-gradient(135deg, #ff6600, #ffaa00)", label: "DISC", text: "#fff" },
  };
  const brand = brandColors[method?.brand] || { bg: "linear-gradient(135deg, #36565f, #1e3a42)", label: "CARD", text: "#fff" };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="fw-bold mb-0" style={{ fontSize: 15 }}>Payment Method</p>
        {method && (
          <button className="btn btn-sm btn-outline-secondary" onClick={onChange}>
            Change Card
          </button>
        )}
      </div>

      {method ? (
        <>
          {/* Card visual */}
          <div className="rounded-3 p-3 mb-3 position-relative overflow-hidden"
            style={{ background: brand.bg, color: brand.text, minHeight: 110 }}>
            {/* decorative circles */}
            <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
            <div style={{ position:"absolute", bottom:-30, right:30, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />

            <div className="d-flex justify-content-between align-items-start mb-3">
              <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Debit / Credit Card
              </div>
              <div className="fw-black" style={{ fontSize: 14, letterSpacing: "0.05em" }}>{brand.label}</div>
            </div>

            <div className="fw-bold mb-2" style={{ fontSize: 16, letterSpacing: "0.15em" }}>
              •••• •••• •••• {method.last4}
            </div>

            <div className="d-flex justify-content-between align-items-end">
              <div>
                <div style={{ fontSize: 9, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>Card Holder</div>
                <div className="fw-semibold" style={{ fontSize: 12 }}>{method.holder || "—"}</div>
              </div>
              <div className="text-end">
                <div style={{ fontSize: 9, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>Expires</div>
                <div className="fw-semibold" style={{ fontSize: 12 }}>{method.expiry || "—"}</div>
              </div>
            </div>
          </div>

          {/* Status row */}
          <div className="d-flex align-items-center justify-content-between px-1">
            <div className="d-flex align-items-center gap-2">
              <span className="rounded-circle" style={{ width: 8, height: 8, background: "#10b981", display: "inline-block" }} />
              <span className="small text-secondary">Active · Default card</span>
            </div>
            {method.acceptedTypes?.length > 0 && (
              <div className="d-flex gap-1">
                {method.acceptedTypes.map(t => (
                  <span key={t} className="badge text-uppercase"
                    style={{ fontSize: 9, background: "#f0f0f0", color: "#595959" }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* No card state */
        <div className="rounded-3 border-2 border-dashed d-flex flex-column align-items-center justify-content-center py-4 gap-2"
          style={{ border: "2px dashed #e0e0e0", background: "#fafafa", minHeight: 110 }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 40, height: 40, background: "#f0f5ff" }}>
            💳
          </div>
          <p className="text-secondary small mb-1">No payment method saved</p>
          <button className="btn btn-sm text-white fw-semibold d-flex align-items-center gap-1"
            style={{ background: "#36565f" }} onClick={onAdd}>
            <IconPlus /> Add Payment Method
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Quick links ──────────────────────────────────────────────────────────────
function QuickLinks({ onBuy, onHistory, onCompareSpend, onSetAlerts }) {
  const links = [
    // { icon: "📈", name: "Buy More Packages", sub: "Add credits or slots", action: onBuy },
    { icon: "🧾", name: "Transaction History",  sub: "View all past payments",    action: onHistory },
    // { icon: "📊", name: "Compare spend by type", sub: "Analyse usage patterns", action: onCompareSpend },
    { icon: "🔔", name: "Set usage alerts",     sub: "Get notified on low credits", action: onSetAlerts },
  ];

  return (
    <div className="list-group list-group-flush rounded">
      {links.map((l, i) => (
        <button
          key={i}
          type="button"
          className="list-group-item list-group-item-action d-flex align-items-center justify-content-between px-3 py-3"
          onClick={l.action}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="rounded d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: "#f0f5ff", fontSize: 18 }}>
              {l.icon}
            </div>
            <div>
              <div className="fw-bold" style={{ fontSize: 13.5 }}>{l.name}</div>
              <div className="text-secondary" style={{ fontSize: 12 }}>{l.sub}</div>
            </div>
          </div>
          <span className="text-secondary"><IconArrow /></span>
        </button>
      ))}
    </div>
  );
}

// ─── Card brand detection ─────────────────────────────────────────────────────
function detectBrand(raw) {
  const n = raw.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  return "";
}

const BRAND_META = {
  visa:       { label: "VISA", bg: "#0D3880", color: "#fff" },
  mastercard: { label: "MC",   bg: "#EB001B", color: "#fff" },
  amex:       { label: "AMEX", bg: "#007BC1", color: "#fff" },
  discover:   { label: "DISC", bg: "#FF6600", color: "#fff" },
};

const ALL_TYPES = [
  { key: "visa",       label: "Visa",       dot: "#0D3880" },
  { key: "mastercard", label: "Mastercard", dot: "#EB001B" },
  { key: "amex",       label: "Amex",       dot: "#007BC1" },
  { key: "discover",   label: "Discover",   dot: "#FF6600" },
];

// ─── AddCardForm ──────────────────────────────────────────────────────────────
function AddCardForm({ onSave, onBrowse }) {
  const [holder,      setHolder]  = React.useState("");
  const [rawNum,      setRawNum]  = React.useState("");
  const [displayNum,  setDisplay] = React.useState("");
  const [expiry,      setExpiry]  = React.useState("");
  const [cvv,         setCvv]     = React.useState("");
  const [saveForLater, setSave]   = React.useState(true);
  const [accepted,    setAccepted]= React.useState(["visa", "mastercard"]);
  const [errors,      setErrors]  = React.useState({});

  const brand = detectBrand(rawNum);
  const bMeta = BRAND_META[brand] || null;

  const handleNumber = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    setRawNum(digits);
    setDisplay(digits.replace(/(.{4})/g, "$1 ").trim());
    setCvv("");
  };

 const handleExpiry = (e) => {
  let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (raw.length >= 2) {
    let month = parseInt(raw.slice(0, 2));
    if (month > 12) raw = "12" + raw.slice(2);
    if (month === 0) raw = "01" + raw.slice(2);
  }
  if (raw.length >= 3) {
    const year = parseInt(raw.slice(2));
    if (year > 39) return; // blocks anything past 2039, adjust as needed
    raw = raw.slice(0, 2) + " / " + raw.slice(2);
  }
  setExpiry(raw);
};

  const handleCvv = (e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, brand === "amex" ? 4 : 3));

  const toggleType = (key) =>
    setAccepted(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const validate = () => {
    const errs = {};
    if (!holder.trim()) errs.holder = "Required";
    if (rawNum.length < 16) errs.num = "Enter a valid 16-digit number";
    if (expiry.length < 7) {
      errs.exp = "Enter valid expiry date (MM / YY)";
    } else {
      const parts = expiry.replace(/\s/g, "").split("/");
      const month = parseInt(parts[0]);
      const year  = parseInt("20" + parts[1]);
      const now   = new Date();
      if (month < 1 || month > 12)             errs.exp = "Month must be between 01 and 12";
      else if (year < now.getFullYear())        errs.exp = `Year cannot be before ${now.getFullYear()}`;
      else if (year === now.getFullYear() && month < now.getMonth() + 1) errs.exp = "Card expired — enter a future date";
    }
    if (cvv.length < (brand === "amex" ? 4 : 3)) errs.cvv = `Enter ${brand === "amex" ? 4 : 3} digits`;
    if (!accepted.length) errs.types = "Select at least one card type";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ last4: rawNum.slice(-4), brand, holder: holder.trim(), acceptedTypes: accepted, saveForLater, expiry });
  };

  return (
    <>
      {/* Cardholder */}
      <div className="mb-3">
        <label className="form-label small fw-bold text-secondary">CARDHOLDER NAME</label>
        <input type="text" className={`form-control ${errors.holder ? "is-invalid" : ""}`}
          value={holder} onChange={e => setHolder(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
          placeholder="Full name on card" autoComplete="cc-name" />
        {errors.holder && <div className="invalid-feedback">{errors.holder}</div>}
      </div>

      {/* Card number */}
      <div className="mb-3">
        <label className="form-label small fw-bold text-secondary">CARD NUMBER</label>
        <div className="position-relative">
          <input type="text" className={`form-control ${errors.num ? "is-invalid" : ""}`}
            value={displayNum} onChange={handleNumber}
            placeholder="•••• •••• •••• ••••" inputMode="numeric" autoComplete="cc-number"
            style={{ paddingRight: 72, letterSpacing: "0.08em", fontSize: 15 }} />
          {bMeta && (
            <span className="position-absolute top-50 translate-middle-y rounded px-2 py-1"
              style={{ right: 10, background: bMeta.bg, color: bMeta.color, fontSize: 10, fontWeight: 800 }}>
              {bMeta.label}
            </span>
          )}
        </div>
        {errors.num && <div className="text-danger" style={{ fontSize: 11 }}>{errors.num}</div>}
      </div>

      {/* Expiry + CVV */}
      <div className="row g-3 mb-3">
        <div className="col-6">
          <label className="form-label small fw-bold text-secondary">EXPIRY DATE</label>
          <input type="text" className={`form-control ${errors.exp ? "is-invalid" : ""}`}
            value={expiry} onChange={handleExpiry} placeholder="MM / YY" inputMode="numeric" autoComplete="cc-exp" />
          {errors.exp && <div className="invalid-feedback">{errors.exp}</div>}
        </div>
        <div className="col-6">
          <label className="form-label small fw-bold text-secondary">CVV {brand === "amex" ? "(4 digits)" : "(3 digits)"}</label>
          <input type="password" className={`form-control ${errors.cvv ? "is-invalid" : ""}`}
            value={cvv} onChange={handleCvv}
            placeholder={brand === "amex" ? "••••" : "•••"} inputMode="numeric" autoComplete="cc-csc" />
          {errors.cvv && <div className="invalid-feedback">{errors.cvv}</div>}
        </div>
      </div>

      <hr />

      {/* Accepted card types */}
      <div className="mb-3">
        <div className="text-secondary small mb-2">Accepted card types</div>
        <div className="d-flex flex-wrap gap-2">
          {ALL_TYPES.map(t => {
            const on = accepted.includes(t.key);
            return (
              <div key={t.key} onClick={() => toggleType(t.key)}
                className="d-flex align-items-center gap-2 px-3 py-1 rounded"
                style={{
                  cursor: "pointer", userSelect: "none", fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${on ? BRAND_META[t.key].bg : "#e0e0e0"}`,
                  background: on ? `${BRAND_META[t.key].bg}14` : "#fafafa",
                  color: on ? BRAND_META[t.key].bg : "#767676",
                }}>
                <span className="rounded-circle" style={{ width: 8, height: 8, background: on ? t.dot : "#d4d4d4", display: "inline-block" }} />
                {t.label}
              </div>
            );
          })}
        </div>
        {errors.types && <div className="text-danger mt-1" style={{ fontSize: 11 }}>{errors.types}</div>}
      </div>

      {/* Save toggle */}
      <div onClick={() => setSave(v => !v)}
        className="d-flex align-items-center gap-3 p-3 rounded mb-4"
        style={{
          cursor: "pointer", border: `1.5px solid ${saveForLater ? "#c0d4ff" : "#e0e0e0"}`,
          background: saveForLater ? "#f0f5ff" : "#fafafa",
        }}>
        <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
          style={{ width: 16, height: 16, border: `2px solid ${saveForLater ? "#2164f3" : "#d4d4d4"}`, background: saveForLater ? "#2164f3" : "#fff" }}>
          {saveForLater && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <div className="fw-semibold" style={{ fontSize: 13 }}>Save card for future payments</div>
          <div className="text-secondary" style={{ fontSize: 11 }}>Full card number is never stored</div>
        </div>
      </div>

      <button className="btn w-100 text-white mb-3 py-2 fw-bold" style={{ background: "#36565f", borderRadius: 8 }} onClick={handleSubmit}>
        🔒 Save Payment Method
      </button>
      <hr />
      <button className="btn btn-outline-secondary w-100" onClick={onBrowse}>Browse Packages Instead</button>
    </>
  );
}

// ─── Compare Spend By Type ────────────────────────────────────────────────────
function CompareSpendByType({ packages }) {
  const [timeRange, setTimeRange] = React.useState("30days");
  const [chartType, setChartType] = React.useState("pie");

  const spendByType = packages.reduce((acc, pkg) => {
    const type = pkg.type || "other";
    const meta = TYPE_META[type] || TYPE_META.bundle;
    if (!acc[type]) acc[type] = { label: meta.label, color: meta.color, light: meta.light, totalSpend: 0, totalUnits: 0, totalUsed: 0, packages: [] };
    acc[type].totalSpend += Number(pkg.price) || 0;
    acc[type].totalUnits += pkg.total || 0;
    acc[type].totalUsed  += pkg.used || 0;
    acc[type].packages.push(pkg);
    return acc;
  }, {});

  const sortedTypes   = Object.values(spendByType).sort((a, b) => b.totalSpend - a.totalSpend);
  const totalSpendAll = sortedTypes.reduce((sum, t) => sum + t.totalSpend, 0);

  const getROI = (type) => {
    const data = spendByType[type];
    if (!data || data.totalSpend === 0) return 0;
    return ((data.totalUsed / data.totalUnits) * 100 / 100) * (data.totalSpend / totalSpendAll);
  };

  const pieData = {
    labels: sortedTypes.map(t => t.label),
    datasets: [{ data: sortedTypes.map(t => t.totalSpend), backgroundColor: sortedTypes.map(t => t.color), borderColor: "#fff", borderWidth: 2 }],
  };

  const barData = {
    labels: sortedTypes.map(t => t.label),
    datasets: [
      { label: "Total Spend (PKR)", data: sortedTypes.map(t => t.totalSpend), backgroundColor: sortedTypes.map(t => t.color), borderRadius: 6 },
      { label: "Usage Rate (%)", data: sortedTypes.map(t => (t.totalUsed / t.totalUnits) * 100), backgroundColor: "#36565f", borderRadius: 6, type: "line" },
    ],
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: true,
    plugins: { tooltip: { callbacks: { label: (ctx) => ctx.dataset.label === "Usage Rate (%)" ? `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%` : `${ctx.dataset.label}: PKR ${ctx.raw.toLocaleString()}` } } },
    scales: { y: { beginAtZero: true, title: { display: true, text: "Amount (PKR) / Usage %", color: "#767676", font: { size: 11 } } } },
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <div className="btn-group">
            <button className={`btn btn-sm ${chartType === "pie" ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => setChartType("pie")}>Pie</button>
            <button className={`btn btn-sm ${chartType === "bar" ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => setChartType("bar")}>Bar</button>
          </div>
        </div>
      </div>

      {sortedTypes.length === 0 ? (
        <div className="text-center py-5 text-secondary">No spend data available to compare</div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-6" style={{ height: 260 }}>
              {chartType === "pie"
                ? <Doughnut data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
                : <Bar data={barData} options={barOptions} />
              }
            </div>
            <div className="col-md-6">
              <p className="fw-bold mb-3" style={{ fontSize: 13 }}>Spending Breakdown</p>
              {sortedTypes.map(type => {
                const percentage = ((type.totalSpend / totalSpendAll) * 100).toFixed(1);
                const usageRate  = ((type.totalUsed / type.totalUnits) * 100).toFixed(1);
                return (
                  <div key={type.label} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="d-flex align-items-center gap-2 small fw-semibold text-secondary">
                        <span className="rounded-circle" style={{ width: 10, height: 10, background: type.color, display: "inline-block" }} />
                        {type.label}
                      </span>
                      <span className="small fw-bold">{fmtPrice(type.totalSpend)} ({percentage}%)</span>
                    </div>
                    <div className="progress mb-1" style={{ height: 6 }}>
                      <div className="progress-bar" style={{ width: `${percentage}%`, background: type.color }} />
                    </div>
                    <div className="d-flex justify-content-between" style={{ fontSize: 10, color: "#767676" }}>
                      <span>Usage: {usageRate}%</span>
                      <span>ROI Score: {(getROI(Object.keys(spendByType).find(k => spendByType[k].label === type.label)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed table */}
          <div className="border-top pt-3">
            <p className="fw-bold mb-3" style={{ fontSize: 13 }}>Detailed Breakdown by Package</p>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle small">
                <thead className="table-light text-secondary">
                  <tr>
                    <th>Package Name</th><th>Type</th><th>Spend</th><th>Usage</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map(pkg => {
                    const meta  = TYPE_META[pkg.type] || TYPE_META.bundle;
                    const usage = pct(pkg.used, pkg.total);
                    return (
                      <tr key={pkg.id}>
                        <td className="fw-medium">{pkg.name}</td>
                        <td><span className="badge" style={{ background: meta.light, color: meta.color, fontSize: 10 }}>{meta.label}</span></td>
                        <td className="fw-semibold">{fmtPrice(pkg.price)}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span>{usage}%</span>
                            <div className="progress flex-fill" style={{ height: 4, width: 50 }}>
                              <div className="progress-bar" style={{ width: `${usage}%`, background: meta.color }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="rounded-circle me-1" style={{ width: 7, height: 7, background: pkg.status === "expired" ? "#ef4444" : "#10b981", display: "inline-block" }} />
                          <span style={{ fontSize: 11, color: pkg.status === "expired" ? "#ef4444" : "#059669" }}>
                            {pkg.status === "expired" ? "Expired" : "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="rounded p-3 mt-3 border small text-secondary" style={{ background: "#f9fafb" }}>
            <p className="fw-bold text-dark mb-2" style={{ fontSize: 12 }}>📊 Spending Insights</p>
            <div className="d-flex flex-wrap gap-3">
              <span>💰 Most spent: <strong>{sortedTypes[0]?.label} ({fmtPrice(sortedTypes[0]?.totalSpend)})</strong></span>
              <span>📈 Highest usage: <strong>{sortedTypes.reduce((best, t) => ((t.totalUsed / t.totalUnits) > (best?.totalUsed / best?.totalUnits) ? t : best), sortedTypes[0])?.label || "N/A"}</strong></span>
              <span>💡 Total packages: <strong>{packages.length}</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Set Usage Alerts ─────────────────────────────────────────────────────────
function SetUsageAlerts({ packages, onSave, initialSettings }) {
  const [alerts, setAlerts] = React.useState(
    initialSettings || {
      lowCredits:       { enabled: true,  threshold: 20 },
      packageExpiry:    { enabled: true,  daysBefore: 7 },
      budgetThreshold:  { enabled: false, threshold: 80 },
      unusualSpending:  { enabled: true,  sensitivity: "medium" },
    }
  );

  const [deliveryMethods, setDeliveryMethods] = React.useState({ email: true, inApp: true, sms: false });
  const [showHistory, setShowHistory] = React.useState(false);

  const calculateLowestPackages = () =>
    packages.map(p => ({ ...p, usagePct: pct(p.used, p.total) }))
      .filter(p => p.usagePct >= (alerts.lowCredits?.threshold || 80) && p.remaining > 0)
      .sort((a, b) => b.usagePct - a.usagePct);

  const calculateExpiringPackages = () => {
    const now = new Date();
    return packages
      .filter(p => p.expiresRaw)
      .map(p => ({ ...p, daysLeft: Math.ceil((new Date(p.expiresRaw) - now) / 86400000) }))
      .filter(p => p.daysLeft <= (alerts.packageExpiry?.daysBefore || 7) && p.daysLeft > 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const handleSave = () => onSave && onSave({ alerts, deliveryMethods });

  const alertCards = [
    {
      key: "lowCredits", icon: "⚡", title: "Low Credits Alert",
      bg: "#f0fdf4", field: "threshold", label: "Alert when remaining credits below:", min: 0, max: 100, unit: "%",
      warning: calculateLowestPackages().length > 0 ? `⚠️ ${calculateLowestPackages().length} package(s) currently below threshold` : null,
    },
    {
      key: "packageExpiry", icon: "⏰", title: "Package Expiry",
      bg: "#eff6ff", field: "daysBefore", label: "Alert before expiry (days):", min: 1, max: 30, unit: " days",
      warning: calculateExpiringPackages().length > 0 ? `⚠️ ${calculateExpiringPackages().length} package(s) expiring soon` : null,
    },
    {
      key: "budgetThreshold", icon: "💰", title: "Budget Threshold",
      bg: "#fefce8", field: "threshold", label: "Alert when budget used exceeds:", min: 50, max: 100, unit: "%",
      warning: null,
    },
  ];

  return (
    <div>
      <p className="fw-bold mb-1" style={{ fontSize: 16 }}>Set Usage Alerts</p>
      <p className="text-secondary small mb-4">Get notified when your packages need attention</p>

      <div className="row g-3 mb-4">
        {alertCards.map(({ key, icon, title, bg, field, label, min, max, unit, warning }) => {
          const enabled = alerts[key]?.enabled || false;
          const val     = alerts[key]?.[field] || min;
          return (
            <div className="col-md-4" key={key}>
              <div className="rounded p-3 border h-100" style={{ background: enabled ? bg : "#fff" }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold" style={{ fontSize: 14 }}>{icon} {title}</span>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" role="switch" checked={enabled}
                      onChange={e => setAlerts(prev => ({ ...prev, [key]: { ...prev[key], enabled: e.target.checked, [field]: prev[key]?.[field] || min } }))} />
                  </div>
                </div>
                {enabled && (
                  <>
                    <div className="small text-secondary mb-2">{label}</div>
                    <div className="d-flex align-items-center gap-2">
                      <input type="range" className="form-range flex-fill" min={min} max={max} value={val}
                        onChange={e => setAlerts(prev => ({ ...prev, [key]: { ...prev[key], [field]: parseInt(e.target.value) } }))} />
                      <span className="fw-semibold small" style={{ minWidth: 45 }}>{val}{unit}</span>
                    </div>
                    {warning && <div className="alert alert-warning py-1 mt-2 small">{warning}</div>}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* In-app notification badge */}
      {/* <div className="rounded p-3 border mb-4 d-flex align-items-center gap-2" style={{ background: "#f0fdf4" }}>
        <span style={{ fontSize: 18 }}>📱</span>
        <div>
          <span className="fw-bold me-2" style={{ fontSize: 14 }}>In-App Notifications</span>
          <span className="badge bg-success">ACTIVE</span>
        </div>
        <div className="small text-secondary ms-1">Alerts will appear inside your dashboard notification center</div>
      </div> */}

      <div className="d-flex justify-content-end">
        <button className="btn text-white px-4 fw-bold" style={{ background: "#36565f" }} onClick={handleSave}>
          Save Alert Settings
        </button>
      </div>
    </div>
  );
}

// // ─── Notification Center Component ──────────────────────────────────────────
// function NotificationCenter({ packages, alertSettings }) { ... }

// ─── Main Component ────────────────────────────────────────────────────────────
class CompanyWallet extends Component {
  constructor(props) {
    super(props);
    let savedAlertSettings = null;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wallet_alert_settings");
      if (saved) { try { savedAlertSettings = JSON.parse(saved); } catch (e) {} }
    }
    this.state = {
      showAddCard:    false,
      notifSelectedId: null,
      packages:       [],
      selectedCard:   0,
      activeRoiTab:   0,
      loading:        true,
      error:          null,
      activeTab:      "overview",
      savedMethod:    null,
      cardSaved:      false,
      showCompareSpend: false,
      activePackageType: null,
      showSetAlerts:  false,
      alertSettings: {
        lowCredits:      { enabled: true,  threshold: 20 },
        packageExpiry:   { enabled: true,  daysBefore: 7 },
        budgetThreshold: { enabled: false, threshold: 80 },
      },
    };
    this.userId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
  }

  componentDidMount() {
    this.fetchPackages();
    this.fetchPaymentMethod();
    this.fetchAlertSettings();

    if (this.props.initialNotifId != null) {
      this.setState({ activeTab: "notifications", notifSelectedId: this.props.initialNotifId });
    }

    this._openNotifHandler = (e) => this.setState({ activeTab: "notifications", notifSelectedId: e?.detail?.selectedId || null });
    window.addEventListener("openNotifications",       this._openNotifHandler);
    window.addEventListener("walletOpenNotifications", this._openNotifHandler);
  }

  componentWillUnmount() {
    window.removeEventListener("openNotifications",       this._openNotifHandler);
    window.removeEventListener("walletOpenNotifications", this._openNotifHandler);
  }

  fetchAlertSettings = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}alert-settings/get/${this.userId}`);
      if (res.data.success && res.data.data) this.setState({ alertSettings: res.data.data });
    } catch (err) { console.error("Failed to fetch alert settings:", err); }
  };

  fetchPackages = async () => {
    this.setState({ loading: true, error: null });
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const { userId } = this;
      if (!userId || userId === "undefined") { this.setState({ error: "User ID missing.", loading: false }); return; }

      const res = await axios.get(`${apiBaseUrl}job/getUserPackages/${userId}`);

      const subPackages = res.data.filter(p => !p.is_daily_budget).map(p => {
        const pkg = (() => { try { return typeof p.package === "string" ? JSON.parse(p.package) : (p.package || {}); } catch { return {}; } })();
        let total = 0;
        if      (pkg.pricing_model === "featured_boost") total = pkg.boost_duration_days || 0;
        else if (pkg.pricing_model === "job_slot")        total = pkg.slot_count || 0;
        else if (pkg.pricing_model === "cv_credits")      total = pkg.credit_count || 0;
        else                                              total = pkg.num_posts || pkg.slot_count || pkg.credit_count || 0;
        const used = p.used_posts || p.used_credits || p.used_slots || 0;
        return { id: p.subscription_id, name: pkg.name || "Package", type: pkg.pricing_model || "bundle", total, used, remaining: Math.max(total - used, 0), price: pkg.price || 0, status: p.status || "active", expiresRaw: p.end_date || null, isDailyBudget: false };
      });

      const dailyPackages = res.data.filter(p => p.is_daily_budget).map(p => {
        const pkg = p.package || {};
        return { id: p.subscription_id, name: pkg.name || "Job Post", type: "daily_budget", total: pkg.daily_budget_cap || 0, used: pkg.total_spend || 0, remaining: Math.max((pkg.daily_budget_cap || 0) - (pkg.total_spend || 0), 0), price: pkg.total_spend || 0, status: p.status, expiresRaw: p.end_date || null, isDailyBudget: true, billingModel: pkg.billing_model, ratePerUnit: pkg.rate_per_unit, dailyCapToday: pkg.daily_budget_cap, dailySpendToday: pkg.daily_spend_today || 0 };
      });

      this.setState({ packages: [...subPackages, ...dailyPackages], loading: false });
    } catch (err) {
      console.error("Wallet API ERROR:", err.response?.data || err.message);
      this.setState({ error: "Failed to load packages. Please try again.", loading: false });
    }
  };

  fetchPaymentMethod = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}payment/getSavedCards/${this.userId}`);
      const cards = res.data?.cards || [];
      if (cards.length > 0) {
        this.setState({ savedMethod: { last4: cards[0].card_last4, brand: cards[0].card_brand, holder: cards[0].card_holder, acceptedTypes: cards[0].accepted_types, expiry: cards[0].card_expiry, token: cards[0].payment_token } });
      }
    } catch (err) { console.error("Failed to fetch saved cards", err); }
  };

  // savePaymentMethod = async () => {
  //   const { cardInput } = this.state;
  //   const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  //   try {
  //     await axios.post(`${apiBaseUrl}payment/addpayment/${this.userId}`, {
  //       paymentDetails: { method: "card", cardLast4: cardInput.last4, cardName: cardInput.holder, saveForLater: true },
  //       amount: 0, currency: "PKR", packageId: null, jobId: null,
  //     });
  //     this.setState({ savedMethod: { last4: cardInput.last4, brand: cardInput.brand, holder: cardInput.holder }, showAddPayment: false, cardInput: { last4: "", holder: "", brand: "card" } });
  //   } catch (err) { console.error("Failed to save card", err); }
  // };

  handleSaveCard = async (cardInput) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}payment/addpayment/${this.userId}`, {
        paymentDetails: { method: "card", cardLast4: cardInput.last4, cardName: cardInput.holder, saveForLater: cardInput.saveForLater, cardExpiry: cardInput.expiry, acceptedTypes: cardInput.acceptedTypes },
        amount: 0, currency: "PKR", packageId: null, jobId: null,
      });
      this.setState({ cardSaved: true, showAddCard: false, savedMethod: { last4: cardInput.last4, brand: cardInput.brand, holder: cardInput.holder, expiry: cardInput.expiry, acceptedTypes: cardInput.acceptedTypes } });
    } catch (err) {
      console.error("Failed to save card", err);
      alert("Could not save card. Please try again.");
    }
  };

  render() {
    const { packages, selectedCard, activeRoiTab, loading, error, savedMethod, activeTab, alertSettings } = this.state;

    if (loading) return <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 400 }}><IconSpinner /><span className="ms-2 text-secondary">Loading wallet…</span></div>;
    if (error)   return <div className="alert alert-danger m-4">{error}</div>;

    const Topbar = (
      <nav className="navbar navbar-expand bg-white border-bottom px-3" style={{ height: 52 }}>
        <div className="d-flex align-items-center h-100 overflow-auto flex-fill" style={{ scrollbarWidth: "none" }}>
          {["overview", "transactions", "packages"].map(tab => (
            <button key={tab} onClick={() => this.setState({ activeTab: tab })}
              className="btn btn-link text-decoration-none fw-semibold px-3 h-100 d-flex align-items-center rounded-0"
              style={{ fontSize: 13.5, color: activeTab === tab ? "#1a1a1a" : "#595959", borderBottom: activeTab === tab ? "3px solid #36565f" : "3px solid transparent", whiteSpace: "nowrap" }}>
              {tab === "overview" ? "Overview" : tab === "transactions" ? "Transactions" : "Packages"}
            </button>
          ))}
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <NotificationCenter userId={this.userId} apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL} />
          <button className="btn btn-outline-secondary btn-sm d-none d-md-flex" onClick={this.fetchPackages}>Refresh</button>
          <button className="btn btn-sm text-white d-flex align-items-center gap-1" style={{ background: "#36565f" }} onClick={() => this.setState({ activeTab: "packages" })}>
            <IconPlus /><span className="d-none d-sm-inline">Buy Packages</span>
          </button>
        </div>
      </nav>
    );

    // ── Empty state (no packages) ──
    if (!packages.length) return (
      <div className="bg-light min-vh-100">
        <Head><title>Wallets</title></Head>
        {Topbar}

        {activeTab === "transactions" && <div className="p-4"><TransactionHistory /></div>}
        {activeTab === "packages"     && <div className="p-4"><PricingPage /></div>}
        {activeTab === "notifications" && (
          <NotificationsPage userId={this.userId} apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
            onTabChange={tab => this.setState({ activeTab: tab })} initialSelectedId={this.state.notifSelectedId} />
        )}
        {activeTab === "overview" && (
          <div className="d-flex justify-content-center p-4">
            <div className="card shadow-sm" style={{ width: "100%", maxWidth: 480, overflow: "hidden" }}>
              <div className="text-center text-white p-5" style={{ background: "linear-gradient(135deg,#36565f,#1e3a42)" }}>
                <div className="rounded-3 d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 64, height: 64, background: "rgba(255,255,255,.15)", fontSize: 32 }}>💳</div>
                <h5 className="fw-bold mb-2">{savedMethod ? "Your Wallet" : "Set Up Your Wallet"}</h5>
                <p className="mb-0 opacity-75" style={{ fontSize: 13 }}>
                  {savedMethod ? "Card saved. Buy a package to start posting jobs." : "Add a payment method to activate packages and start posting jobs."}
                </p>
              </div>
              <div className="card-body p-4">
                {savedMethod ? (
                  <>
                    <div className="border rounded p-3 mb-3 d-flex align-items-center gap-3">
                      <div className="rounded d-flex align-items-center justify-content-center bg-light fw-bold small" style={{ width: 44, height: 30 }}>
                        {savedMethod.brand?.toUpperCase() || "CARD"}
                      </div>
                      <div className="flex-fill">
                        <div className="fw-bold">•••• •••• •••• {savedMethod.last4}</div>
                        <div className="text-secondary small">{savedMethod.holder}</div>
                      </div>
                      <span className="badge text-success bg-success bg-opacity-10 small">SAVED</span>
                    </div>
                    {savedMethod.acceptedTypes?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-secondary small mb-2">Accepted types</div>
                        <div className="d-flex flex-wrap gap-2">
                          {savedMethod.acceptedTypes.map(t => (
                            <span key={t} className="badge border border-primary text-primary small text-uppercase">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button className="btn text-white w-100 mb-2 fw-bold" style={{ background: "#36565f" }} onClick={() => this.setState({ activeTab: "packages" })}>Browse Packages →</button>
                    <button className="btn btn-outline-secondary w-100" onClick={() => this.setState({ savedMethod: null, cardSaved: false })}>Change Card</button>
                  </>
                ) : this.state.cardSaved ? (
                  <div className="text-center py-4">
                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 56, height: 56, background: "#d1fae5" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <h6 className="fw-bold mb-2">Card Saved!</h6>
                    <p className="text-secondary small mb-4">You can now buy packages and start posting jobs.</p>
                    <button className="btn text-white fw-bold" style={{ background: "#36565f" }} onClick={() => this.setState({ activeTab: "packages" })}>Browse Packages →</button>
                  </div>
                ) : (
                  <AddCardForm onSave={this.handleSaveCard} onBrowse={() => this.setState({ activeTab: "packages" })} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );

    // ── Normal state (has packages) ──
    const pkg     = packages[selectedCard];
    const now     = new Date();
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
    const rangeStr = `${monthAgo.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })} – ${now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`;

    return (
      <div className="bg-light min-vh-100">
        <Head><title>Wallets</title></Head>
        {Topbar}

        {activeTab === "transactions" && <div className="p-4"><TransactionHistory /></div>}
        {activeTab === "packages"     && <div className="p-4"><PricingPage /></div>}
        {activeTab === "notifications" && (
          <NotificationsPage userId={this.userId} apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
            onTabChange={tab => this.setState({ activeTab: tab })} initialSelectedId={this.state.notifSelectedId} />
        )}

        {activeTab === "overview" && (
          <div className="container-fluid py-4 px-4">
            {/* Page header */}
            <div className="d-flex flex-wrap justify-content-between align-items-start mb-4 gap-3">
              <div>
                <h4 className="fw-bold mb-1">Company Wallet</h4>
                <p className="text-secondary small mb-0">Monitor and analyse spend across all your packages</p>
              </div>
              {/* <div className="d-flex align-items-center gap-2 text-secondary small">
                <span>Date range</span>
                <span className="border rounded px-3 py-1 fw-semibold bg-white d-flex align-items-center gap-2">
                  <IconCalendar /> {rangeStr}
                </span>
              </div> */}
            </div>

           {/* Packages grid */}
<div className="card mb-4">
  <div className="card-body">
    <p className="fw-bold mb-1">Your Packages</p>
    <p className="text-secondary small mb-3">
      {packages.filter(p => !p.expiresRaw || new Date(p.expiresRaw) > new Date()).length} active package{packages.length !== 1 ? "s" : ""} — select a type to view
    </p>

    {/* Type tabs */}
    <div className="d-flex flex-wrap gap-2 mb-3">
      {[...new Set(packages.filter(p => !p.expiresRaw || new Date(p.expiresRaw) > new Date()).map(p => p.type))].map(type => {
  const meta  = TYPE_META[type] || TYPE_META.bundle;
  const count = packages.filter(p => p.type === type && (!p.expiresRaw || new Date(p.expiresRaw) > new Date())).length;
        const isActive = this.state.activePackageType === type;
        return (
          <div
            key={type}
            onClick={() => this.setState({ activePackageType: isActive ? null : type, selectedCard: 0 })}
            className="d-flex align-items-center gap-2 px-3 py-2 rounded"
            style={{
              cursor: "pointer",
              border: `2px solid ${isActive ? meta.color : "#e0e0e0"}`,
              background: isActive ? meta.light : "#fff",
              transition: "all .15s",
            }}
          >
            <span className="rounded-circle flex-shrink-0"
              style={{ width: 8, height: 8, background: meta.color, display: "inline-block" }} />
            <span className="fw-semibold" style={{ fontSize: 13, color: isActive ? meta.color : "#595959" }}>
              {meta.label}
            </span>
            <span className="badge rounded-pill"
              style={{ background: isActive ? meta.color : "#f0f0f0", color: isActive ? "#fff" : "#595959", fontSize: 11 }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>

    {/* Cards for selected type */}
    {this.state.activePackageType && (() => {
      const now = new Date();
const filtered = packages.filter(p => 
  p.type === this.state.activePackageType && 
  (!p.expiresRaw || new Date(p.expiresRaw) > now)
);
      return (
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
          {filtered.map((p) => {
            const globalIndex = packages.indexOf(p);
            return (
              <div key={p.id} className="col">
                <PackageCard
                  pkg={p}
                  isSelected={selectedCard === globalIndex}
                  onClick={() => this.setState({ selectedCard: globalIndex })}
                />
              </div>
            );
          })}
        </div>
      );
    })()}

    {!this.state.activePackageType && (
      <div className="text-center py-3 text-secondary small">
        👆 Click a type above to see packages
      </div>
    )}
  </div>
</div>

            {/* Spend snapshot + (ROI commented) */}
            <div className="row g-4 mb-4">
              <div className="col-lg-12">
                <div className="card h-100">
                  <div className="card-body">
                    <p className="fw-bold mb-1">Spend Snapshot</p>
                    <p className="text-secondary small mb-3">Showing spend for {rangeStr}</p>
                    <SpendSnapshot packages={packages} activeType={this.state.activePackageType} />
                    <p className="text-secondary mt-3 mb-0" style={{ fontSize: 11 }}>This is not an invoice. Contact billing for official records.</p>
                  </div>
                </div>
              </div>
              {/* <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <UsageROI packages={packages} activeTab={activeRoiTab} onTab={i => this.setState({ activeRoiTab: i })} />
                  </div>
                </div>
              </div> */}
            </div>

            {/* Add card modal (commented) */}
            {this.state.showAddCard && (
              <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16 }}>
                <div className="card" style={{ width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",padding:"28px 32px",position:"relative" }}>
                  <button onClick={() => this.setState({ showAddCard: false })} style={{ position:"absolute",top:16,right:16,background:"#fee2e2",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",color:"#991b1b",fontWeight:700,fontSize:16 }}>×</button>
                  <h5 className="fw-bold mb-4">{savedMethod ? "Change Payment Card" : "Add Payment Method"}</h5>
                  <AddCardForm onSave={this.handleSaveCard} onBrowse={() => this.setState({ showAddCard: false, activeTab: "packages" })} />
                </div>
              </div>
            )}

            {/* Package details + payment + quick actions */}
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <p className="fw-bold mb-1 color-black">Package Details</p>
                    <p className="text-secondary small mb-3">{pkg.name}</p>
                    <PackageDetail pkg={pkg} />
                  </div>
                </div>
              </div>
              <div className="col-lg-6 d-flex flex-column gap-4">
                <div className="card">
                  <div className="card-body">
                    <PaymentMethodCard method={savedMethod} onAdd={() => this.setState({ showAddCard: true })} onChange={() => this.setState({ showAddCard: true })} />
                  </div>
                </div>
                <div className="card flex-fill">
                  <div className="card-body">
                    <p className="fw-bold mb-3">Quick Actions</p>
                    <QuickLinks
                      // onBuy={() => this.setState({ activeTab: "packages" })}
                      onHistory={() => this.setState({ activeTab: "transactions" })}
                      // onCompareSpend={() => this.setState({ showCompareSpend: true })}
                      onSetAlerts={() => this.setState({ showSetAlerts: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compare Spend Modal (commented) */}
        {/* {this.state.showCompareSpend && (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16 }}>
            <div className="card" style={{ width:"100%",maxWidth:900,maxHeight:"90vh",overflowY:"auto",padding:"28px 32px",position:"relative" }}>
              <button onClick={() => this.setState({ showCompareSpend: false })} style={{ position:"absolute",top:16,right:16,background:"#fee2e2",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",color:"#991b1b",fontWeight:700 }}>×</button>
              <CompareSpendByType packages={packages} />
            </div>
          </div>
        )} */}

        {/* Set Alerts Modal */}
        {this.state.showSetAlerts && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
            <div className="card" style={{ width: "100%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
              <button onClick={() => this.setState({ showSetAlerts: false })}
                className="btn-close position-absolute" style={{ top: 16, right: 16 }} />
              <div className="card-body p-4">
                <SetUsageAlerts
                  packages={packages}
                  initialSettings={alertSettings}
                  onSave={async (settings) => {
                    try {
                      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}alert-settings/save/${this.userId}`, settings.alerts);
                      this.setState({ alertSettings: settings.alerts, showSetAlerts: false }, () => alert("✅ Alert settings saved successfully!"));
                    } catch (err) {
                      console.error("Failed to save settings:", err);
                      alert("❌ Failed to save settings. Please try again.");
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default CompanyWallet;
export { AddCardForm };