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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ─── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

  .aw-root {
    min-height: 100vh;
    background: #f3f2ef;
    font-family: 'Nunito Sans', ui-sans-serif, sans-serif;
    box-sizing: border-box;
  }
  .aw-root *, .aw-root *::before, .aw-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }

  /* ── Top nav bar ── */
  .aw-topbar {
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
  }
  .aw-topbar-tabs {
    display: flex;
    align-items: center;
    gap: 0;
    height: 100%;
  }
  .aw-topbar-tab {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 13.5px;
    font-weight: 600;
    color: #595959;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s;
    text-decoration: none;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
  }
  .aw-topbar-tab:hover { color: #1a1a1a; }
  .aw-topbar-tab.active {
    color: #1a1a1a;
    border-bottom: 3px solid #2164f3;
    font-weight: 700;
  }
  .aw-topbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .aw-btn-primary {
    background: #36565f;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s;
    font-family: 'Nunito Sans', sans-serif;
  }
  .aw-btn-primary:hover { background: #36565f; }
  .aw-btn-ghost {
    background: #fff;
    color: #595959;
    border: 1.5px solid #d4d4d4;
    border-radius: 4px;
    padding: 7px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s;
    font-family: 'Nunito Sans', sans-serif;
  }
  .aw-btn-ghost:hover { background: #f5f5f5; }

  /* ── Page body ── */
  .aw-body { padding: 28px 32px; }

  /* ── Page header ── */
  .aw-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .aw-page-title { font-size: 22px; font-weight: 800; color: #1a1a1a; }
  .aw-page-sub { font-size: 13px; color: #767676; margin-top: 2px; }

  .aw-date-range {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #595959;
  }
  .aw-date-badge {
    background: #fff;
    border: 1.5px solid #d4d4d4;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── White card ── */
  .aw-card {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }
  .aw-card-pad { padding: 24px; }

  /* ── Section title inside card ── */
  .aw-card-title { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px; }
  .aw-card-range { font-size: 12px; color: #767676; margin-bottom: 20px; }

  /* ── Spend snapshot ── */
  .aw-snapshot-inner {
    display: flex;
    align-items: center;
    gap: 40px;
    flex-wrap: wrap;
  }
  .aw-donut-wrap {
    position: relative;
    width: 180px;
    height: 180px;
    flex-shrink: 0;
  }
  .aw-donut-center {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    text-align: center; pointer-events: none;
  }
  .aw-donut-total { font-size: 18px; font-weight: 800; color: #1a1a1a; display: block; line-height: 1.1; }
  .aw-donut-label { font-size: 11px; color: #767676; display: block; margin-top: 2px; }

  .aw-snapshot-legend {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 32px;
    flex: 1;
  }
  .aw-legend-item { display: flex; align-items: flex-start; gap: 8px; }
  .aw-legend-dot {
    width: 10px; height: 10px; border-radius: 50%;
    flex-shrink: 0; margin-top: 3px;
  }
  .aw-legend-name { font-size: 12px; color: #595959; margin-bottom: 2px; }
  .aw-legend-val { font-size: 17px; font-weight: 800; color: #1a1a1a; }

  /* ── Grid ── */
  .aw-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .aw-three-col {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }
  .aw-full { margin-bottom: 16px; }

  /* ── ROI / stats card ── */
  .aw-roi-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 20px;
  }
  .aw-roi-tab {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #595959;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: 'Nunito Sans', sans-serif;
    transition: color 0.15s;
  }
  .aw-roi-tab:hover { color: #1a1a1a; }
  .aw-roi-tab.active { color: #2164f3; border-bottom: 2px solid #2164f3; }

  .aw-roi-inner { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
  .aw-roi-stats { display: flex; flex-direction: column; gap: 16px; min-width: 200px; }
  .aw-roi-stat-label { font-size: 12px; color: #767676; margin-bottom: 1px; }
  .aw-roi-stat-val { font-size: 22px; font-weight: 800; color: #1a1a1a; }
  .aw-roi-stat-sub { font-size: 12px; color: #767676; }
  .aw-roi-chart { flex: 1; min-width: 200px; }
  .aw-bar-wrap { position: relative; width: 100%; height: 180px; }

  /* ── Package cards ── */
  .aw-pkg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 12px;
  }
  .aw-pkg-card {
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.15s;
    background: #fff;
    position: relative;
    overflow: hidden;
  }
  .aw-pkg-card:hover { border-color: #aaa; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
  .aw-pkg-card.selected {
    border-color: #2164f3;
    background: #f0f5ff;
  }
  .aw-pkg-accent {
    position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 8px 8px 0 0;
  }
  .aw-pkg-type-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 3px;
    margin-bottom: 10px;
  }
  .aw-pkg-name { font-size: 12px; color: #595959; font-weight: 600; margin-bottom: 4px; }
  .aw-pkg-num { font-size: 28px; font-weight: 800; color: #1a1a1a; line-height: 1; margin-bottom: 2px; }
  .aw-pkg-of { font-size: 11px; color: #767676; margin-bottom: 12px; }
  .aw-pkg-bar { height: 4px; background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
  .aw-pkg-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
  .aw-pkg-meta { display: flex; justify-content: space-between; font-size: 10px; color: #9e9e9e; }

  /* ── Detail rows table ── */
  .aw-detail-table { width: 100%; }
  .aw-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13.5px;
  }
  .aw-detail-row:last-child { border-bottom: none; }
  .aw-detail-label { color: #595959; }
  .aw-detail-val { font-weight: 700; color: #1a1a1a; }

  /* ── Status badge ── */
  .aw-status {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12.5px; font-weight: 700;
  }
  .aw-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  /* ── Payment method ── */
  .aw-pm-card {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }
  .aw-pm-left { display: flex; align-items: center; gap: 12px; }
  .aw-pm-icon {
    width: 40px; height: 28px; background: #f0f0f0;
    border-radius: 4px; display: flex; align-items: center;
    justify-content: center; font-size: 18px;
  }
  .aw-pm-num { font-size: 14px; font-weight: 700; color: #1a1a1a; }
  .aw-pm-exp { font-size: 12px; color: #767676; }

  /* ── Quick links grid ── */
  .aw-quicklinks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }
  .aw-ql-item {
    background: #fff;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: background 0.1s;
  }
  .aw-ql-item:hover { background: #f9f9f9; }
  .aw-ql-left { display: flex; align-items: center; gap: 12px; }
  .aw-ql-icon {
    width: 36px; height: 36px; border-radius: 6px;
    background: #f0f5ff; display: flex;
    align-items: center; justify-content: center; font-size: 18px;
  }
  .aw-ql-name { font-size: 13.5px; font-weight: 700; color: #1a1a1a; }
  .aw-ql-sub { font-size: 12px; color: #767676; }
  .aw-ql-arrow { color: #aaa; font-size: 16px; }

  /* ── States ── */
  .aw-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 400px; color: #767676; font-size: 14px; gap: 10px;
    font-family: 'Nunito Sans', sans-serif;
  }
  .aw-error {
    margin: 32px;
    padding: 20px; background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 8px; color: #dc2626; font-size: 14px;
  }
  .aw-empty {
    padding: 60px; text-align: center; color: #9e9e9e; font-size: 14px;
  }
  @keyframes aw-spin { to { transform: rotate(360deg); } }
  .aw-spin { animation: aw-spin 0.9s linear infinite; }

  /* ── Responsive ── */
  @media (max-width: 860px) {
    .aw-two-col, .aw-three-col { grid-template-columns: 1fr; }
    .aw-topbar { padding: 0 16px; }
    .aw-body { padding: 20px 16px; }
    .aw-quicklinks { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .aw-snapshot-legend { grid-template-columns: 1fr 1fr; gap: 10px 16px; }
    .aw-pkg-grid { grid-template-columns: 1fr 1fr; }
    .aw-topbar-tab { font-size: 12px; padding: 0 10px; }
    .aw-page-title { font-size: 18px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("aw-styles")) {
  const tag = document.createElement("style");
  tag.id = "aw-styles";
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

// ─── Constants ────────────────────────────────────────────────────────────────
// const TYPE_META = {
//   cv_credits:   { label: "CV Credits",   color: "#2164f3", light: "#e8f0fe" },
//   job_slot:     { label: "Job Slots",    color: "#7c3aed", light: "#ede9fe" },
//   subscription: { label: "Subscription", color: "#0891b2", light: "#cffafe" },
//   bundle:       { label: "Bundle",       color: "#059669", light: "#d1fae5" },
// };

const pct      = (used, total) => total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
const fmtPrice = (n)           => `PKR ${Number(n).toLocaleString("en-PK")}`;
const fmtDate  = (d)           => d
  ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
  : "N/A";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconHistory = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconSpinner = () => (
  <svg className="aw-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2164f3" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);
const TYPE_META = {
  cv_credits:    { label: "CV Credits",    color: "#2164f3", light: "#e8f0fe" },
  job_slot:      { label: "Job Slots",     color: "#7c3aed", light: "#ede9fe" },
  subscription:  { label: "Subscription",  color: "#0891b2", light: "#cffafe" },
  bundle:        { label: "Bundle",        color: "#059669", light: "#d1fae5" },
  duration_bundle: { label: "Bundle",      color: "#059669", light: "#d1fae5" },
  daily_budget:  { label: "Daily Budget",  color: "#854F0B", light: "#FAEEDA" },  // ← add this
};
// ─── PackageCard ──────────────────────────────────────────────────────────────
function PackageCard({ pkg, isSelected, onClick }) {
  const meta  = TYPE_META[pkg.type] || TYPE_META.bundle;
  const usage = pct(pkg.used, pkg.total);
  const isExp = pkg.status === "expired";

  return (
    <div className={`aw-pkg-card${isSelected ? " selected" : ""}`} onClick={onClick}>
      <div className="aw-pkg-accent" style={{ background: meta.color }} />
      <div className="aw-pkg-type-badge" style={{ background: meta.light, color: meta.color }}>
        {meta.label}
      </div>
      <p className="aw-pkg-name">{pkg.name}</p>
      <p className="aw-pkg-num">{pkg.remaining}</p>
      <p className="aw-pkg-of">of {pkg.total} remaining</p>
      <div className="aw-pkg-bar">
        <div className="aw-pkg-bar-fill" style={{ width: `${usage}%`, background: isExp ? "#d4d4d4" : meta.color }} />
      </div>
      <div className="aw-pkg-meta">
        <span>{usage}% used</span>
        <span style={{ color: isExp ? "#ef4444" : "#9e9e9e" }}>
          {isExp ? "Expired" : `Exp ${fmtDate(pkg.expiresRaw)}`}
        </span>
      </div>
    </div>
  );
}

// ─── SpendSnapshot (donut) ────────────────────────────────────────────────────
function SpendSnapshot({ packages }) {
  const totalPaid  = packages.reduce((s, p) => s + Number(p.price || 0), 0);

  const colors = packages.map((p) => (TYPE_META[p.type] || TYPE_META.bundle).color);
  const data = {
    labels: packages.map((p) => p.name),
    datasets: [{
      data: packages.map((p) => p.price || 1),
      backgroundColor: colors,
      borderColor: "#fff",
      borderWidth: 2,
      hoverOffset: 4,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: "72%",
    plugins: { legend: { display: false }, tooltip: {
      callbacks: { label: (ctx) => ` ${ctx.label}: ${fmtPrice(ctx.raw)}` }
    }},
  };

  return (
    <div className="aw-snapshot-inner">
      <div className="aw-donut-wrap">
        <Doughnut data={data} options={options} />
        <div className="aw-donut-center">
          <span className="aw-donut-total">{fmtPrice(totalPaid)}</span>
          <span className="aw-donut-label">Total spend</span>
        </div>
      </div>
      <div className="aw-snapshot-legend">
        {packages.map((p) => {
          const m = TYPE_META[p.type] || TYPE_META.bundle;
          return (
            <div key={p.id} className="aw-legend-item">
              <span className="aw-legend-dot" style={{ background: m.color }} />
              <div>
                <div className="aw-legend-name">{m.label}</div>
                <div className="aw-legend-val">{fmtPrice(p.price)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROI / Usage chart ────────────────────────────────────────────────────────
function UsageROI({ packages, activeTab, onTab }) {
  const tabs = packages.map((p) => (TYPE_META[p.type] || TYPE_META.bundle).label)
    .filter((v, i, a) => a.indexOf(v) === i);

  const filtered = packages.filter((p) => {
    const label = (TYPE_META[p.type] || TYPE_META.bundle).label;
    return label === tabs[activeTab];
  });

  const totalUsed      = filtered.reduce((s, p) => s + p.used, 0);
  const totalRemaining = filtered.reduce((s, p) => s + p.remaining, 0);
  const usagePct       = pct(totalUsed, totalUsed + totalRemaining);

  const barData = {
    labels: filtered.map((p) => p.name),
    datasets: [
      {
        label: "Used",
        data: filtered.map((p) => p.used),
        backgroundColor: "#2164f3",
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Remaining",
        data: filtered.map((p) => p.remaining),
        backgroundColor: "#dbeafe",
        borderRadius: 4,
        borderSkipped: false,
      },
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <div className="aw-card-title">Return on Investment</div>
          <div className="aw-card-range">Usage breakdown by package type</div>
        </div>
      </div>
      <div className="aw-roi-tabs">
        {tabs.map((t, i) => (
          <button key={t} className={`aw-roi-tab${activeTab === i ? " active" : ""}`} onClick={() => onTab(i)}>
            {t}
          </button>
        ))}
      </div>
      <div className="aw-roi-inner">
        <div className="aw-roi-stats">
          <div>
            <div className="aw-roi-stat-label">Total units used</div>
            <div className="aw-roi-stat-val">{totalUsed.toLocaleString()}</div>
          </div>
          <div>
            <div className="aw-roi-stat-label">Usage rate</div>
            <div className="aw-roi-stat-val">{usagePct}%</div>
            <div className="aw-roi-stat-sub">across {filtered.length} package{filtered.length !== 1 ? "s" : ""}</div>
          </div>
          <div>
            <div className="aw-roi-stat-label">Units remaining</div>
            <div className="aw-roi-stat-val">{totalRemaining.toLocaleString()}</div>
          </div>
        </div>
        <div className="aw-roi-chart">
          <div className="aw-bar-wrap">
            <Bar data={barData} options={barOpts} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {[{ label: "Used", color: "#2164f3" }, { label: "Remaining", color: "#dbeafe", border: "1px solid #93c5fd" }].map((l) => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#767676" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, border: l.border, display: "inline-block" }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PaymentDetails table ─────────────────────────────────────────────────────
function PackageDetail({ pkg }) {
  const meta  = TYPE_META[pkg.type] || TYPE_META.bundle;
  const isExp = pkg.status === "expired";
  const isPending = pkg.status === "pending_payment";

  const billingLabel = {
    cpc: "Cost per Profile View",
    cpm: "Cost per 1,000 Profiles",
    cpa: "Cost per Application",
  }[pkg.billingModel] || "—";

  const rows = pkg.isDailyBudget ? [
    { label: "Job title",        value: pkg.name },
    { label: "Type",             value: (
      <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 3, background: meta.light, color: meta.color }}>
        Daily Budget
      </span>
    )},
    {
      label: "Status",
      value: (
        <span className="aw-status">
          <span className="aw-status-dot" style={{ 
            background: isPending ? "#f59e0b" : isExp ? "#ef4444" : "#10b981" 
          }} />
          <span style={{ color: isPending ? "#854F0B" : isExp ? "#ef4444" : "#059669" }}>
            {isPending ? "Pending Payment" : isExp ? "Expired" : "Active"}
          </span>
        </span>
      ),
    },
    { label: "Billing model",    value: billingLabel },
    { label: "Rate per unit",    value: `PKR ${pkg.ratePerUnit}` },
    { label: "Daily cap",        value: `PKR ${pkg.dailyCapToday}` },
    { label: "Spent today",      value: `PKR ${pkg.dailySpendToday}` },
    { label: "Total spend",      value: fmtPrice(pkg.used) },
    { label: "Deadline",         value: fmtDate(pkg.expiresRaw) },
  ] : [
    { label: "Package name",  value: pkg.name },
    { label: "Type",          value: (
      <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 3, background: meta.light, color: meta.color, textTransform: "uppercase" }}>
        {meta.label}
      </span>
    )},
    { label: "Amount paid",   value: fmtPrice(pkg.price) },
    { label: "Status",        value: (
      <span className="aw-status">
        <span className="aw-status-dot" style={{ background: isExp ? "#ef4444" : "#10b981" }} />
        <span style={{ color: isExp ? "#ef4444" : "#059669" }}>{isExp ? "Expired" : "Active"}</span>
      </span>
    )},
    { label: "Expiry date",   value: fmtDate(pkg.expiresRaw) },
    { label: "Total units",   value: pkg.total },
    { label: "Units used",    value: pkg.used },
    { label: "Units left",    value: pkg.remaining },
    { label: "Usage",         value: `${pct(pkg.used, pkg.total)}%` },
  ];

  return (
    <div className="aw-detail-table">
      {/* pending payment banner */}
      {isPending && (
        <div style={{
          background: "#FAEEDA", border: "1px solid #f59e0b",
          borderRadius: "8px", padding: "10px 14px", marginBottom: "16px",
          fontSize: "12px", color: "#854F0B", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          ⚠️ This job is pending — add a payment method in your wallet to activate it.
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className="aw-detail-row">
          <span className="aw-detail-label">{r.label}</span>
          <span className="aw-detail-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Payment Method card ──────────────────────────────────────────────────────
function PaymentMethodCard({ method, onAdd, onChange }) {
  const brandIcon = {
    visa:       "💳",
    mastercard: "💳",
    unknown:    "💳",
    card:       "💳",
  }[method?.brand] || "💳";

  return (
    <div>
      <div className="aw-card-title" style={{ marginBottom: 16 }}>Payment Method</div>
      {method ? (
        <div className="aw-pm-card">
          <div className="aw-pm-left">
            <div className="aw-pm-icon">{brandIcon}</div>
            <div>
              <div className="aw-pm-num">•••• •••• •••• {method.last4}</div>
              <div className="aw-pm-exp">
                {method.holder || ""} · {method.brand?.toUpperCase() || "CARD"}
              </div>
            </div>
            <span style={{ fontSize: 11, background: "#f0f0f0", color: "#595959", padding: "2px 8px", borderRadius: 3, fontWeight: 700 }}>
              DEFAULT
            </span>
          </div>
          <button className="aw-btn-ghost" onClick={onChange}>Change Card</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#9e9e9e" }}>No payment method saved.</p>
          <button className="aw-btn-primary" onClick={onAdd}><IconPlus /> Add Method</button>
        </div>
      )}
    </div>
  );
}

// ─── Quick links ──────────────────────────────────────────────────────────────
function QuickLinks({ onBuy, onHistory }) {
  const links = [
    { icon: "📈", name: "Buy More Packages",      sub: "Add credits or slots",       action: onBuy },
    { icon: "🧾", name: "Transaction History",    sub: "View all past payments",      action: onHistory },
    { icon: "📊", name: "Compare spend by type",  sub: "Analyse usage patterns",      action: null },
    { icon: "🔔", name: "Set usage alerts",        sub: "Get notified on low credits", action: null },
  ];
  return (
    <div className="aw-quicklinks">
      {links.map((l, i) => (
        <div key={i} className="aw-ql-item" onClick={l.action || undefined}>
          <div className="aw-ql-left">
            <div className="aw-ql-icon">{l.icon}</div>
            <div>
              <div className="aw-ql-name">{l.name}</div>
              <div className="aw-ql-sub">{l.sub}</div>
            </div>
          </div>
          <span className="aw-ql-arrow"><IconArrow /></span>
        </div>
      ))}
    </div>
  );
}
function detectCardBrand(num) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "unknown";
}

function detectBrand(raw) {
  const n = raw.replace(/\s/g, "");
  if (/^4/.test(n))           return "visa";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n))       return "amex";
  if (/^6(?:011|5)/.test(n))  return "discover";
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

function AddCardForm({ onSave, onBrowse }) {
  const [holder,       setHolder]   = React.useState("");
  const [rawNum,       setRawNum]   = React.useState("");   // digits only
  const [displayNum,   setDisplay]  = React.useState("");   // formatted
  const [expiry,       setExpiry]   = React.useState("");
  const [cvv,          setCvv]      = React.useState("");
  const [saveForLater, setSave]     = React.useState(true);
  const [accepted,     setAccepted] = React.useState(["visa", "mastercard"]);
  const [errors,       setErrors]   = React.useState({});

  const brand = detectBrand(rawNum);
  const bMeta = BRAND_META[brand] || null;

  const handleNumber = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    setRawNum(digits);
    setDisplay(digits.replace(/(.{4})/g, "$1 ").trim());
    // reset CVV length if brand changes
    setCvv("");
  };

  const handleExpiry = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) raw = raw.slice(0, 2) + " / " + raw.slice(2);
    setExpiry(raw);
  };

  const handleCvv = (e) => {
    const max = brand === "amex" ? 4 : 3;
    setCvv(e.target.value.replace(/\D/g, "").slice(0, max));
  };

  const toggleType = (key) => {
    setAccepted(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const validate = () => {
    const errs = {};
    if (!holder.trim())    errs.holder = "Required";
    if (rawNum.length < 16) errs.num  = "Enter a valid 16-digit number";
    if (expiry.length < 7)  errs.exp  = "Invalid expiry";
    const minCvv = brand === "amex" ? 4 : 3;
    if (cvv.length < minCvv) errs.cvv = `Enter ${minCvv} digits`;
    if (!accepted.length)  errs.types = "Select at least one card type";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({
      last4: rawNum.slice(-4),
      brand,
      holder: holder.trim(),
      acceptedTypes: accepted,
      saveForLater,
    });
  };

  return (
    <>
      {/* Cardholder */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#595959", marginBottom: 5 }}>
          CARDHOLDER NAME
        </label>
        <input
          type="text"
          value={holder}
          onChange={e => setHolder(e.target.value)}
          placeholder="Full name on card"
          autoComplete="cc-name"
          style={inputStyle(errors.holder)}
        />
        {errors.holder && <div style={errStyle}>{errors.holder}</div>}
      </div>

      {/* Card number */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#595959", marginBottom: 5 }}>
          CARD NUMBER
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={displayNum}
            onChange={handleNumber}
            placeholder="•••• •••• •••• ••••"
            inputMode="numeric"
            autoComplete="cc-number"
            style={{ ...inputStyle(errors.num), paddingRight: 68, letterSpacing: "0.08em", fontSize: 15 }}
          />
          {/* Brand pill — only renders when detected */}
          {bMeta && (
            <div style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              height: 22, minWidth: 42, borderRadius: 4, background: bMeta.bg, color: bMeta.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, letterSpacing: "0.03em",
            }}>
              {bMeta.label}
            </div>
          )}
        </div>
        {errors.num && <div style={errStyle}>{errors.num}</div>}
      </div>

      {/* Expiry + CVV */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>EXPIRY DATE</label>
          <input
            type="text"
            value={expiry}
            onChange={handleExpiry}
            placeholder="MM / YY"
            inputMode="numeric"
            autoComplete="cc-exp"
            style={inputStyle(errors.exp)}
          />
          {errors.exp && <div style={errStyle}>{errors.exp}</div>}
        </div>
        <div>
          <label style={labelStyle}>CVV {brand === "amex" ? "(4 digits)" : ""}</label>
          <input
            type="password"
            value={cvv}
            onChange={handleCvv}
            placeholder={brand === "amex" ? "••••" : "•••"}
            inputMode="numeric"
            autoComplete="cc-csc"
            style={inputStyle(errors.cvv)}
          />
          {errors.cvv && <div style={errStyle}>{errors.cvv}</div>}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f0f0f0", margin: "16px 0" }} />

      {/* Accepted card types */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#767676", marginBottom: 8 }}>
          Accepted card types
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ALL_TYPES.map(t => {
            const on = accepted.includes(t.key);
            return (
              <div
                key={t.key}
                onClick={() => toggleType(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                  border: `1.5px solid ${on ? BRAND_META[t.key].bg : "#e0e0e0"}`,
                  background: on ? `${BRAND_META[t.key].bg}14` : "#fafafa",
                  fontSize: 12, fontWeight: 600,
                  color: on ? BRAND_META[t.key].bg : "#767676",
                  transition: "all 0.15s", userSelect: "none",
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: on ? t.dot : "#d4d4d4", flexShrink: 0,
                }} />
                {t.label}
              </div>
            );
          })}
        </div>
        {errors.types && <div style={errStyle}>{errors.types}</div>}
      </div>

      {/* Save toggle */}
      <div onClick={() => setSave(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
        padding: "10px 12px", borderRadius: 8,
        background: saveForLater ? "#f0f5ff" : "#fafafa",
        border: `1.5px solid ${saveForLater ? "#c0d4ff" : "#e0e0e0"}`,
        cursor: "pointer", transition: "all 0.15s",
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: `2px solid ${saveForLater ? "#2164f3" : "#d4d4d4"}`,
          background: saveForLater ? "#2164f3" : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {saveForLater && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>Save card for future payments</div>
          <div style={{ fontSize: 11, color: "#767676" }}>Full card number is never stored</div>
        </div>
      </div>

      <button className="aw-btn-primary" onClick={handleSubmit}
        style={{ width: "100%", justifyContent: "center", padding: 12, fontSize: 14, borderRadius: 8 }}>
        🔒 Save Payment Method
      </button>

      <div style={{ height: 1, background: "#f0f0f0", margin: "16px 0" }} />

      <button className="aw-btn-ghost" onClick={onBrowse}
        style={{ width: "100%", justifyContent: "center" }}>
        Browse Packages Instead
      </button>
    </>
  );
}

// helpers
const inputStyle = (err) => ({
  width: "100%", border: `1.5px solid ${err ? "#ef4444" : "#e0e0e0"}`,
  borderRadius: 6, padding: "10px 14px", fontSize: 14,
  fontFamily: "inherit", outline: "none", color: "#1a1a1a",
});
const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#595959", marginBottom: 5 };
const errStyle   = { fontSize: 11, color: "#ef4444", marginTop: 4 };
// ─── Main Component ────────────────────────────────────────────────────────────
class CompanyWallet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      packages:         [],
      selectedCard:     0,
      activeRoiTab:     0,
      loading:          true,
      error:            null,
      showPricing:      false,
      showTransactions: false,
      savedMethod:      null,
      cardSaved:        false, 
    };
    this.userId =
      typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
  }

  componentDidMount() { 
    this.fetchPackages(); 
    this.fetchPaymentMethod(); 
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

    const res = await axios.get(`${apiBaseUrl}job/getUserPackages/${userId}`);

    const subPackages = res.data
      .filter(p => !p.is_daily_budget)
      .map((p) => {
        const pkg = p.package || {};
        const total = pkg.num_posts || pkg.slot_count || pkg.credit_count || 0;
        const used = p.used_posts || p.used_credits || p.used_slots || 0;
        return {
          id:            p.subscription_id,
          name:          pkg.name || "Package",
          type:          pkg.pricing_model || "bundle",
          total,
          used,
          remaining:     Math.max(total - used, 0),
          price:         pkg.price || 0,
          status:        p.status || "active",
          expiresRaw:    p.end_date || null,
          isDailyBudget: false,
        };
      });

    const dailyPackages = res.data
      .filter(p => p.is_daily_budget)
      .map((p) => {
        const pkg = p.package || {};
        return {
          id:             p.subscription_id,
          name:           pkg.name || "Job Post",
          type:           "daily_budget",
          total:          pkg.daily_budget_cap || 0,
          used:           pkg.total_spend || 0,
          remaining:      Math.max((pkg.daily_budget_cap || 0) - (pkg.total_spend || 0), 0),
          price:          pkg.total_spend || 0,
          status:         p.status,
          expiresRaw:     p.end_date || null,
          isDailyBudget:  true,
          billingModel:   pkg.billing_model,
          ratePerUnit:    pkg.rate_per_unit,
          dailyCapToday:  pkg.daily_budget_cap,
          dailySpendToday: pkg.daily_spend_today || 0,
        };
      });

    this.setState({
      packages: [...subPackages, ...dailyPackages],
      loading:  false,
    });
  } catch (err) {
    console.error("Wallet API ERROR:", err.response?.data || err.message);
    this.setState({ error: "Failed to load packages. Please try again.", loading: false });
  }
};
fetchPaymentMethod = async () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await axios.get(`${apiBaseUrl}payment/getSavedCards/${this.userId}`);
    const cards = res.data?.cards || [];
    if (cards.length > 0) {
      this.setState({
        savedMethod: {
          last4:         cards[0].card_last4,
          brand:         cards[0].card_brand,
          holder:        cards[0].card_holder,
          acceptedTypes: cards[0].accepted_types,
          token:         cards[0].payment_token,  // ← add this
        }
      });
    }
  } catch (err) {
    console.error("Failed to fetch saved cards", err);
  }
};
savePaymentMethod = async () => {
  const { cardInput } = this.state;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    await axios.post(`${apiBaseUrl}payment/addPayment/${this.userId}`, {
      paymentDetails: {
        method:      "card",
        cardLast4:   cardInput.last4,
        cardName:    cardInput.holder,
        saveForLater: true,       // ← triggers saved_cards insert
      },
      amount:   0,                // no charge, just saving card
      currency: "PKR",
      packageId: null,
      jobId:     null,
    });

    this.setState({
      savedMethod:    { last4: cardInput.last4, brand: cardInput.brand, holder: cardInput.holder },
      showAddPayment: false,
      cardInput:      { last4: "", holder: "", brand: "card" },
    });
  } catch (err) {
    console.error("Failed to save card", err);
  }
};
  render() {
    const { packages, selectedCard, activeRoiTab, loading, error, savedMethod } = this.state;

    if (this.state.showPricing) return (
      <div className="aw-root">
        <div style={{ padding: "16px 32px", borderBottom: "1px solid #e0e0e0", background: "#fff" }}>
          <button className="aw-btn-ghost" onClick={() => this.setState({ showPricing: false })}>← Back to Wallet</button>
        </div>
        <div style={{ padding: 32 }}><PricingPage /></div>
      </div>
    );

    if (this.state.showTransactions) return (
      <div className="aw-root">
        <div style={{ padding: "16px 32px", borderBottom: "1px solid #e0e0e0", background: "#fff" }}>
          <button className="aw-btn-ghost" onClick={() => this.setState({ showTransactions: false })}>← Back to Wallet</button>
        </div>
        <div style={{ padding: 32 }}><TransactionHistory /></div>
      </div>
    );

    if (loading) return <div className="aw-loading"><IconSpinner /> Loading wallet…</div>;
    if (error)   return <div className="aw-error">{error}</div>;
    // replace the single empty check with this
if (!packages.length) return (
  <div className="aw-root">
    <div className="aw-topbar">
      <div className="aw-topbar-tabs">
        <button className="aw-topbar-tab active">Overview</button>
        <button className="aw-topbar-tab" onClick={() => this.setState({ showTransactions: true })}>Transaction History</button>
        <button className="aw-topbar-tab" onClick={() => this.setState({ showPricing: true })}>Packages</button>
      </div>
      <div className="aw-topbar-right">
        <button className="aw-btn-primary" onClick={() => this.setState({ showPricing: true })}>
          <IconPlus /> Buy Packages
        </button>
      </div>
    </div>

    <div style={{ padding: "40px 32px", display: "flex", justifyContent: "center" }}>
      <div className="aw-card" style={{ width: "100%", maxWidth: 480, overflow: "hidden" }}>

        <div style={{
          background: "linear-gradient(135deg, #36565f 0%, #1e3a42 100%)",
          padding: "36px 32px", textAlign: "center"
        }}>
          <div style={{
            width: 64, height: 64, background: "rgba(255,255,255,0.15)",
            borderRadius: 16, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 32, margin: "0 auto 16px"
          }}>💳</div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            {savedMethod ? "Your Wallet" : "Set Up Your Wallet"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6 }}>
            {savedMethod
              ? "Card saved. Buy a package to start posting jobs."
              : "Add a payment method to activate packages and start posting jobs."}
          </div>
        </div>

        <div style={{ padding: "28px 32px" }}>
          {savedMethod ? (
            // ── Card already saved ──
            <>
              <div style={{
                border: "1.5px solid #e0e0e0", borderRadius: 8,
                padding: "16px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 12
              }}>
                <div style={{
                  width: 44, height: 30, borderRadius: 4, background: "#f0f0f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#595959"
                }}>
                  {savedMethod.brand?.toUpperCase() || "CARD"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
                    •••• •••• •••• {savedMethod.last4}
                  </div>
                  <div style={{ fontSize: 12, color: "#767676" }}>{savedMethod.holder}</div>
                </div>
                <span style={{
                  fontSize: 11, background: "#d1fae5", color: "#059669",
                  padding: "3px 8px", borderRadius: 3, fontWeight: 700
                }}>SAVED</span>
              </div>

              {savedMethod.acceptedTypes?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "#767676", marginBottom: 8 }}>Accepted types</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {savedMethod.acceptedTypes.map(t => (
                      <span key={t} style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px",
                        borderRadius: 4, background: "#f0f5ff", color: "#2164f3",
                        border: "1px solid #c0d4ff", textTransform: "uppercase"
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <button className="aw-btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: 12, fontSize: 14, borderRadius: 8, marginBottom: 10 }}
                onClick={() => this.setState({ showPricing: true })}>
                Browse Packages →
              </button>
              <button className="aw-btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => this.setState({ savedMethod: null, cardSaved: false })}>
                Change Card
              </button>
            </>
          ) : this.state.cardSaved ? (
            // ── Just saved, show success ──
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                width: 56, height: 56, background: "#d1fae5", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13L9 17L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>Card Saved!</div>
              <div style={{ fontSize: 13, color: "#767676", marginBottom: 20 }}>
                You can now buy packages and start posting jobs.
              </div>
              <button className="aw-btn-primary"
                style={{ margin: "0 auto", justifyContent: "center" }}
                onClick={() => this.setState({ showPricing: true })}>
                Browse Packages →
              </button>
            </div>
          ) : (
            // ── No card yet, show form ──
            <AddCardForm
              onSave={async (cardInput) => {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                try {
                  await axios.post(`${apiBaseUrl}payment/addPayment/${this.userId}`, {
                    paymentDetails: {
                      method:        "card",
                      cardLast4:     cardInput.last4,
                      cardName:      cardInput.holder,
                      saveForLater:  cardInput.saveForLater,
                      acceptedTypes: cardInput.acceptedTypes,
                    },
                    amount: 0, currency: "PKR", packageId: null, jobId: null,
                  });
                  this.setState({
                    cardSaved:   true,
                    savedMethod: {
                      last4:         cardInput.last4,
                      brand:         cardInput.brand,
                      holder:        cardInput.holder,
                      acceptedTypes: cardInput.acceptedTypes,
                    },
                  });
                } catch (err) {
                  console.error("Failed to save card", err);
                  alert("Could not save card. Please try again.");
                }
              }}
              onBrowse={() => this.setState({ showPricing: true })}
            />
          )}
        </div>
      </div>
    </div>
  </div>
);
    const pkg  = packages[selectedCard];

    // Today's date range display
    const now      = new Date();
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
    const rangeStr = `${monthAgo.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })} – ${now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`;

    return (
      <div className="aw-root">
<Head>
          <title>Wallets</title>
        </Head>
        {/* ── Top Nav ── */}
        <div className="aw-topbar">
          <div className="aw-topbar-tabs">
            <button className="aw-topbar-tab active">Overview</button>
            <button className="aw-topbar-tab" onClick={() => this.setState({ showTransactions: true })}>Transaction History</button>
            <button className="aw-topbar-tab" onClick={() => this.setState({ showPricing: true })}>Packages</button>
          </div>
          <div className="aw-topbar-right">
            <button className="aw-btn-ghost" onClick={this.fetchPackages}>Refresh</button>
            <button className="aw-btn-primary" onClick={() => this.setState({ showPricing: true })}>
              <IconPlus /> Buy Packages
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="aw-body">

          {/* Page header */}
          <div className="aw-page-header">
            <div>
              <div className="aw-page-title">Company Wallet</div>
              <div className="aw-page-sub">Monitor and analyse spend across all your packages</div>
            </div>
            <div className="aw-date-range">
              <span style={{ fontSize: 13, color: "#767676" }}>Date range</span>
              <div className="aw-date-badge">
                <IconCalendar /> {rangeStr}
              </div>
            </div>
          </div>

          {/* Package selector row */}
          <div className="aw-full aw-card aw-card-pad">
            <div className="aw-card-title" style={{ marginBottom: 4 }}>Your Packages</div>
            <div className="aw-card-range">{packages.length} package{packages.length !== 1 ? "s" : ""} found — select one to see details</div>
            <div className="aw-pkg-grid">
              {packages.map((p, i) => (
                <PackageCard key={p.id} pkg={p} isSelected={selectedCard === i} onClick={() => this.setState({ selectedCard: i })} />
              ))}
            </div>
          </div>

          {/* Spend snapshot + ROI */}
          <div className="aw-two-col">
            <div className="aw-card aw-card-pad">
              <div className="aw-card-title">Spend Snapshot</div>
              <div className="aw-card-range">Showing spend for {rangeStr}</div>
              <SpendSnapshot packages={packages} />
              <p style={{ fontSize: 11, color: "#9e9e9e", marginTop: 16 }}>
                This is not an invoice. Contact billing for official records.
              </p>
            </div>

            <div className="aw-card aw-card-pad">
              <UsageROI
                packages={packages}
                activeTab={activeRoiTab}
                onTab={(i) => this.setState({ activeRoiTab: i })}
              />
            </div>
          </div>

          {/* Package detail + payment method */}
          <div className="aw-two-col">
            <div className="aw-card aw-card-pad">
              <div className="aw-card-title" style={{ marginBottom: 4 }}>Package Details</div>
              <div className="aw-card-range">{pkg.name}</div>
              <PackageDetail pkg={pkg} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="aw-card aw-card-pad">
                <PaymentMethodCard
                  method={savedMethod}
                  onAdd={() => console.log("Add payment method")}
                  onChange={() => console.log("Change payment method")}
                />
              </div>
              <div className="aw-card aw-card-pad" style={{ flex: 1 }}>
                <div className="aw-card-title" style={{ marginBottom: 14 }}>Quick Actions</div>
                <QuickLinks
                  onBuy={() => this.setState({ showPricing: true })}
                  onHistory={() => this.setState({ showTransactions: true })}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }
}

export default CompanyWallet;