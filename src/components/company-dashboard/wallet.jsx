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

// ─── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

  .aw-root {
    min-height: 100vh;
    background: #f3f2ef;
    font-family: 'Nunito Sans', ui-sans-serif, sans-serif;
    box-sizing: border-box;
    overflow-x: clip;  /* clip not hidden — doesn't affect scroll */
  max-width: 100%;
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
    gap: 8px;
    /* prevent topbar itself from overflowing */
    // overflow: hidden;
    max-width: 100vw;
  min-width: 0;
  }
  .aw-topbar > * {
  min-width: 0;
}

.aw-topbar-tabs {
  display: flex;
  align-items: center;
  height: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex: 1 1 0;        /* grow to fill space but shrink hard when needed */
  min-width: 0;
  max-width: calc(100% - 160px); /* always leave room for right-side buttons */
}
.aw-topbar-tabs::-webkit-scrollbar { display: none; }

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
    border-bottom-color: #36565f;
    font-weight: 700;
  }

.aw-topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;     /* never grow, never shrink, always visible */
  position: relative;
  z-index: 101;       /* above tab strip */
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
    white-space: nowrap;
  }
  .aw-btn-primary:hover { background: #2a454d; }

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
    white-space: nowrap;
  }
  .aw-btn-ghost:hover { background: #f5f5f5; }

  /* ── Page body ── */
  .aw-body { padding: 28px 32px 100px; }

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
    flex-wrap: wrap;
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
    min-width: 0;
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
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .aw-roi-tabs::-webkit-scrollbar { display: none; }
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
    white-space: nowrap;
  }
  .aw-roi-tab:hover { color: #1a1a1a; }
  .aw-roi-tab.active { color: #000; border-bottom: 2px solid #36565f; }

  .aw-roi-inner { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
  .aw-roi-stats { display: flex; flex-direction: column; gap: 16px; min-width: 160px; }
  .aw-roi-stat-label { font-size: 12px; color: #767676; margin-bottom: 1px; }
  .aw-roi-stat-val { font-size: 22px; font-weight: 800; color: #1a1a1a; }
  .aw-roi-stat-sub { font-size: 12px; color: #767676; }
  .aw-roi-chart { flex: 1; min-width: 0; }
  .aw-bar-wrap { position: relative; width: 100%; height: 180px; }

  /* ── Package cards ── */
  .aw-pkg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
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
  .aw-pkg-card.selected { border-color: #2164f3; background: #f0f5ff; }
  .aw-pkg-accent {
    position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 8px 8px 0 0;
  }
  .aw-pkg-type-badge {
    display: inline-block;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 3px; margin-bottom: 10px;
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
    gap: 8px;
  }
  .aw-detail-row:last-child { border-bottom: none; }
  .aw-detail-label { color: #595959; flex-shrink: 0; }
  .aw-detail-val { font-weight: 700; color: #1a1a1a; text-align: right; word-break: break-word; }

  /* ── Status badge ── */
  .aw-status { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; }
  .aw-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  /* ── Payment method ── */
  .aw-pm-card {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }
  .aw-pm-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .aw-pm-icon {
    width: 40px; height: 28px; background: #f0f0f0;
    border-radius: 4px; display: flex; align-items: center;
    justify-content: center; font-size: 18px; flex-shrink: 0;
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
    background: #fff; padding: 18px 20px;
    display: flex; align-items: center; justify-content: space-between;
    cursor: pointer; transition: background 0.1s;
  }
  .aw-ql-item:hover { background: #f9f9f9; }
  .aw-ql-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .aw-ql-icon {
    width: 36px; height: 36px; border-radius: 6px;
    background: #f0f5ff; display: flex;
    align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .aw-ql-name { font-size: 13.5px; font-weight: 700; color: #1a1a1a; }
  .aw-ql-sub { font-size: 12px; color: #767676; }
  .aw-ql-arrow { color: #aaa; font-size: 16px; flex-shrink: 0; }

  /* ── States ── */
  .aw-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 400px; color: #767676; font-size: 14px; gap: 10px;
    font-family: 'Nunito Sans', sans-serif;
  }
  .aw-error {
    margin: 32px; padding: 20px; background: #fef2f2;
    border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 14px;
  }
  .aw-empty { padding: 60px; text-align: center; color: #9e9e9e; font-size: 14px; }

  @keyframes aw-spin { to { transform: rotate(360deg); } }
  .aw-spin { animation: aw-spin 0.9s linear infinite; }

  /* ══════════════════════════════════════════════
     RESPONSIVE BREAKPOINTS
  ══════════════════════════════════════════════ */

  /* ── ≤ 1024px — tablets ── */
  @media (max-width: 1024px) {
    .aw-three-col { grid-template-columns: 1fr 1fr; }
  }

  /* ── ≤ 860px — small tablets / landscape phones ── */
  @media (max-width: 860px) {
    .aw-topbar { padding: 0 16px; }
    .aw-body { padding: 20px 16px 100px; }
    .aw-two-col, .aw-three-col { grid-template-columns: 1fr; }
    .aw-quicklinks { grid-template-columns: 1fr; }
    .aw-roi-stats { min-width: 100%; flex-direction: row; flex-wrap: wrap; gap: 12px; }
    .aw-roi-stats > div { min-width: 120px; }
  }

  /* ── ≤ 640px — portrait phones ── */
  @media (max-width: 640px) {
    /* Topbar: shrink text, hide Refresh, keep bell + icon */
    .aw-topbar { padding: 0 10px; height: 48px; }
  .aw-topbar-tabs { max-width: calc(100vw - 140px); }
  .aw-topbar-right { gap: 4px; }
  .aw-btn-ghost.aw-hide-mobile { display: none; }
  .aw-btn-primary .aw-label { display: none; }
  .aw-btn-primary { padding: 8px 10px; min-width: 36px; }
  .aw-body { padding: 16px 12px 120px; }

    /* Body */
    .aw-body { padding: 16px 12px 120px; }
    .aw-card-pad { padding: 16px; }

    /* Page header stacks */
    .aw-page-header { flex-direction: column; gap: 8px; }
    .aw-page-title { font-size: 18px; }

    /* Donut chart: center it */
    .aw-snapshot-inner { flex-direction: column; align-items: center; gap: 20px; }
    .aw-snapshot-legend { grid-template-columns: 1fr 1fr; gap: 10px 16px; width: 100%; }

    /* Package grid: 2 columns on phones */
    .aw-pkg-grid { grid-template-columns: 1fr 1fr; }

    /* Payment method card wraps */
    .aw-pm-card { flex-direction: column; align-items: flex-start; }

    /* Quick links single column */
    .aw-quicklinks { grid-template-columns: 1fr; }
    .aw-ql-item { padding: 14px 16px; }
    .aw-ql-name { font-size: 13px; }

    /* ROI inner stacks */
    .aw-roi-inner { flex-direction: column; }
    .aw-roi-stats { flex-direction: row; flex-wrap: wrap; }
    .aw-bar-wrap { height: 160px; }
  }

  /* ── ≤ 400px — very small phones ── */
  @media (max-width: 400px) {
    .aw-pkg-grid { grid-template-columns: 1fr; }
    .aw-snapshot-legend { grid-template-columns: 1fr; }
    .aw-topbar-tab { font-size: 11px; padding: 0 8px; }
  }

`;

if (typeof document !== "undefined" && !document.getElementById("aw-styles")) {
  const tag = document.createElement("style");
  tag.id = "aw-styles";
  tag.textContent = STYLES;
  document.head.appendChild(tag);

  // Hard-clamp document-level overflow so nothing bleeds right
  document.documentElement.style.overflowX = "hidden";
  document.documentElement.style.maxWidth = "100vw";
  document.body.style.overflowX = "hidden";
  document.body.style.maxWidth = "100vw";
}

// ─── Constants ────────────────────────────────────────────────────────────────
// const TYPE_META = {
//   cv_credits:   { label: "CV Credits",   color: "#2164f3", light: "#e8f0fe" },
//   job_slot:     { label: "Job Slots",    color: "#7c3aed", light: "#ede9fe" },
//   subscription: { label: "Subscription", color: "#0891b2", light: "#cffafe" },
//   bundle:       { label: "Bundle",       color: "#059669", light: "#d1fae5" },
// };

const pct = (used, total) => total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
const fmtPrice = (n) => `PKR ${Number(n).toLocaleString("en-PK")}`;
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
  : "N/A";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
// const IconHistory = () => (
//   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
//   </svg>
// );
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
  <svg className="aw-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2164f3" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);
const TYPE_META = {
  cv_credits: { label: "CV Credits", color: "#2164f3", light: "#e8f0fe" },
  job_slot: { label: "Job Slots", color: "#7c3aed", light: "#ede9fe" },
  subscription: { label: "Subscription", color: "#0891b2", light: "#cffafe" },
  bundle: { label: "Bundle", color: "#059669", light: "#d1fae5" },
  duration_bundle: { label: "Bundle", color: "#059669", light: "#d1fae5" },
  daily_budget: { label: "Daily Budget", color: "#854F0B", light: "#FAEEDA" },
  featured_boost: { label: "Featured Boost", color: "#d97706", light: "#fef3c7" },
};
// ─── PackageCard ──────────────────────────────────────────────────────────────
function PackageCard({ pkg, isSelected, onClick }) {
  const meta = TYPE_META[pkg.type] || TYPE_META.bundle;
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
  const validPackages = packages.filter(p => Number(p.price) > 0);
  const totalPaid = packages.reduce((s, p) => s + Number(p.price || 0), 0);

  if (validPackages.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#9e9e9e" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
        <div style={{ fontSize: 13 }}>No spend data available yet</div>
      </div>
    );
  }

  const colors = validPackages.map((p) => (TYPE_META[p.type] || TYPE_META.bundle).color);
  const data = {
    labels: validPackages.map((p) => p.name),
    datasets: [{
      data: validPackages.map((p) => Number(p.price)),
      backgroundColor: colors,
      borderColor: "#fff",
      borderWidth: 2,
      hoverOffset: 4,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmtPrice(ctx.raw)}` } }
    },
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
        {validPackages.map((p) => {
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

  const safeTab = tabs.length > 0 ? Math.min(activeTab, tabs.length - 1) : 0;

  if (tabs.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#9e9e9e", fontSize: 13 }}>
        No usage data available
      </div>
    );
  }

  const filtered = packages.filter((p) => {
    const label = (TYPE_META[p.type] || TYPE_META.bundle).label;
    return label === tabs[safeTab];
  });

  const totalUsed = filtered.reduce((s, p) => s + p.used, 0);
  const totalRemaining = filtered.reduce((s, p) => s + p.remaining, 0);
  const usagePct = pct(totalUsed, totalUsed + totalRemaining);

  const barData = {
    labels: filtered.map((p) => p.name),
    datasets: [
      {
        label: "Used",
        data: filtered.map((p) => p.used),
        backgroundColor: "#36565f",
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
          <button key={t} className={`aw-roi-tab${safeTab === i ? " active" : ""}`} onClick={() => onTab(i)}>
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
  const meta = TYPE_META[pkg.type] || TYPE_META.bundle;
  const isExp = pkg.status === "expired";
  const isPending = pkg.status === "pending_payment";

  const billingLabel = {
    cpc: "Cost per Profile View",
    cpm: "Cost per 1,000 Profiles",
    cpa: "Cost per Application",
  }[pkg.billingModel] || "—";

  const rows = pkg.isDailyBudget ? [
    { label: "Job title", value: pkg.name },
    {
      label: "Type", value: (
        <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 3, background: meta.light, color: meta.color }}>
          Daily Budget
        </span>
      )
    },
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
    { label: "Billing model", value: billingLabel },
    { label: "Rate per unit", value: `PKR ${pkg.ratePerUnit}` },
    { label: "Daily cap", value: `PKR ${pkg.dailyCapToday}` },
    { label: "Spent today", value: `PKR ${pkg.dailySpendToday}` },
    { label: "Total spend", value: fmtPrice(pkg.used) },
    { label: "Deadline", value: fmtDate(pkg.expiresRaw) },
  ] : [
    { label: "Package name", value: pkg.name },
    {
      label: "Type", value: (
        <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 3, background: meta.light, color: meta.color, textTransform: "uppercase" }}>
          {meta.label}
        </span>
      )
    },
    { label: "Amount paid", value: fmtPrice(pkg.price) },
    {
      label: "Status", value: (
        <span className="aw-status">
          <span className="aw-status-dot" style={{ background: isExp ? "#ef4444" : "#10b981" }} />
          <span style={{ color: isExp ? "#ef4444" : "#059669" }}>{isExp ? "Expired" : "Active"}</span>
        </span>
      )
    },
    { label: "Expiry date", value: fmtDate(pkg.expiresRaw) },
    { label: "Total units", value: pkg.total },
    { label: "Units used", value: pkg.used },
    { label: "Units left", value: pkg.remaining },
    { label: "Usage", value: `${pct(pkg.used, pkg.total)}%` },
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
    visa: "💳",
    mastercard: "💳",
    unknown: "💳",
    card: "💳",
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
                {method.holder || ""} · {method.brand?.toUpperCase() || "CARD"} · {method.expiry || ""}
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
function QuickLinks({ onBuy, onHistory, onCompareSpend, onSetAlerts }) {
  const links = [
    { icon: "📈", name: "Buy More Packages", sub: "Add credits or slots", action: onBuy },
    { icon: "🧾", name: "Transaction History", sub: "View all past payments", action: onHistory },
    { icon: "📊", name: "Compare spend by type", sub: "Analyse usage patterns", action: onCompareSpend },
    { icon: "🔔", name: "Set usage alerts", sub: "Get notified on low credits", action: onSetAlerts },
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


function detectBrand(raw) {
  const n = raw.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  return "";
}

const BRAND_META = {
  visa: { label: "VISA", bg: "#0D3880", color: "#fff" },
  mastercard: { label: "MC", bg: "#EB001B", color: "#fff" },
  amex: { label: "AMEX", bg: "#007BC1", color: "#fff" },
  discover: { label: "DISC", bg: "#FF6600", color: "#fff" },
};

const ALL_TYPES = [
  { key: "visa", label: "Visa", dot: "#0D3880" },
  { key: "mastercard", label: "Mastercard", dot: "#EB001B" },
  { key: "amex", label: "Amex", dot: "#007BC1" },
  { key: "discover", label: "Discover", dot: "#FF6600" },
];

function AddCardForm({ onSave, onBrowse }) {
  const [holder, setHolder] = React.useState("");
  const [rawNum, setRawNum] = React.useState("");   // digits only
  const [displayNum, setDisplay] = React.useState("");   // formatted
  const [expiry, setExpiry] = React.useState("");
  const [cvv, setCvv] = React.useState("");
  const [saveForLater, setSave] = React.useState(true);
  const [accepted, setAccepted] = React.useState(["visa", "mastercard"]);
  const [errors, setErrors] = React.useState({});

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
    if (!holder.trim()) errs.holder = "Required";
    if (rawNum.length < 16) errs.num = "Enter a valid 16-digit number";
    if (expiry.length < 7) errs.exp = "Invalid expiry";
    const minCvv = brand === "amex" ? 4 : 3;
    if (cvv.length < minCvv) errs.cvv = `Enter ${minCvv} digits`;
    if (!accepted.length) errs.types = "Select at least one card type";
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
      expiry,
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
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
const errStyle = { fontSize: 11, color: "#ef4444", marginTop: 4 };

// ─── Compare Spend By Type Component ──────────────────────────────────────────
function CompareSpendByType({ packages }) {
  const [timeRange, setTimeRange] = React.useState("30days");
  const [chartType, setChartType] = React.useState("pie"); // pie or bar

  // Group packages by type
  const spendByType = packages.reduce((acc, pkg) => {
    const type = pkg.type || "other";
    const meta = TYPE_META[type] || TYPE_META.bundle;
    if (!acc[type]) {
      acc[type] = {
        label: meta.label,
        color: meta.color,
        light: meta.light,
        totalSpend: 0,
        totalUnits: 0,
        totalUsed: 0,
        packages: [],
      };
    }
    acc[type].totalSpend += Number(pkg.price) || 0;
    acc[type].totalUnits += pkg.total || 0;
    acc[type].totalUsed += pkg.used || 0;
    acc[type].packages.push(pkg);
    return acc;
  }, {});

  const sortedTypes = Object.values(spendByType).sort((a, b) => b.totalSpend - a.totalSpend);
  const totalSpendAll = sortedTypes.reduce((sum, t) => sum + t.totalSpend, 0);

  // ROI calculation per type
  const getROI = (type) => {
    const data = spendByType[type];
    if (!data || data.totalSpend === 0) return 0;
    const usageRate = (data.totalUsed / data.totalUnits) * 100;
    return (usageRate / 100) * (data.totalSpend / totalSpendAll);
  };

  // Chart data for pie chart
  const pieData = {
    labels: sortedTypes.map(t => t.label),
    datasets: [{
      data: sortedTypes.map(t => t.totalSpend),
      backgroundColor: sortedTypes.map(t => t.color),
      borderColor: "#fff",
      borderWidth: 2,
    }],
  };

  // Chart data for bar chart
  const barData = {
    labels: sortedTypes.map(t => t.label),
    datasets: [
      {
        label: "Total Spend (PKR)",
        data: sortedTypes.map(t => t.totalSpend),
        backgroundColor: sortedTypes.map(t => t.color),
        borderRadius: 6,
      },
      {
        label: "Usage Rate (%)",
        data: sortedTypes.map(t => (t.totalUsed / t.totalUnits) * 100),
        backgroundColor: "#36565f",
        borderRadius: 6,
        type: "line",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.label === "Usage Rate (%)") {
              return `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`;
            }
            return `${ctx.dataset.label}: PKR ${ctx.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: chartType === "pie" ? "Amount (PKR)" : "Amount (PKR) / Usage %",
          color: "#767676",
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="aw-card-title">Compare Spend by Type</div>
          <div className="aw-card-range">Analyze spending patterns across package categories</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: "6px 12px",
              border: "1.5px solid #e0e0e0",
              borderRadius: 6,
              fontSize: 12,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <div style={{
            display: "flex",
            border: "1.5px solid #e0e0e0",
            borderRadius: 6,
            overflow: "hidden",
          }}>
            <button
              onClick={() => setChartType("pie")}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: chartType === "pie" ? "#36565f" : "#fff",
                color: chartType === "pie" ? "#fff" : "#595959",
                border: "none",
                cursor: "pointer",
              }}
            >
              Pie
            </button>
            <button
              onClick={() => setChartType("bar")}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                background: chartType === "bar" ? "#36565f" : "#fff",
                color: chartType === "bar" ? "#fff" : "#595959",
                border: "none",
                cursor: "pointer",
              }}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {sortedTypes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9e9e9e" }}>
          No spend data available to compare
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            <div style={{ height: 260 }}>
              {chartType === "pie" ? (
                <Doughnut data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
              ) : (
                <Bar data={barData} options={barOptions} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
                Spending Breakdown
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sortedTypes.map((type) => {
                  const percentage = ((type.totalSpend / totalSpendAll) * 100).toFixed(1);
                  const usageRate = ((type.totalUsed / type.totalUnits) * 100).toFixed(1);
                  return (
                    <div key={type.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: type.color }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#595959" }}>{type.label}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>
                          {fmtPrice(type.totalSpend)} ({percentage}%)
                        </div>
                      </div>
                      <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${percentage}%`, height: "100%", background: type.color }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#767676" }}>
                        <span>Usage: {usageRate}%</span>
                        <span>ROI Score: {(getROI(Object.keys(spendByType).find(k => spendByType[k].label === type.label)) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed table */}
          <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
              Detailed Breakdown by Package
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e0e0e0", textAlign: "left", color: "#767676" }}>
                    <th style={{ padding: "8px 4px" }}>Package Name</th>
                    <th style={{ padding: "8px 4px" }}>Type</th>
                    <th style={{ padding: "8px 4px" }}>Spend</th>
                    <th style={{ padding: "8px 4px" }}>Usage</th>
                    <th style={{ padding: "8px 4px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => {
                    const meta = TYPE_META[pkg.type] || TYPE_META.bundle;
                    const usage = pct(pkg.used, pkg.total);
                    return (
                      <tr key={pkg.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td style={{ padding: "8px 4px", fontWeight: 500, color: "#1a1a1a" }}>{pkg.name}</td>
                        <td style={{ padding: "8px 4px" }}>
                          <span style={{
                            fontSize: 10, padding: "2px 6px", borderRadius: 3,
                            background: meta.light, color: meta.color,
                          }}>
                            {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: "8px 4px", fontWeight: 600 }}>{fmtPrice(pkg.price)}</td>
                        <td style={{ padding: "8px 4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{usage}%</span>
                            <div style={{ width: 50, background: "#f0f0f0", borderRadius: 4, height: 4, overflow: "hidden" }}>
                              <div style={{ width: `${usage}%`, height: "100%", background: meta.color }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "8px 4px" }}>
                          <span className="aw-status-dot" style={{
                            background: pkg.status === "expired" ? "#ef4444" : "#10b981",
                            display: "inline-block",
                            marginRight: 4,
                          }} />
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

          {/* Insights section */}
          <div style={{
            marginTop: 20,
            padding: 12,
            background: "#f9fafb",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
              📊 Spending Insights
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 11, color: "#595959" }}>
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

// ─── Set Usage Alerts Component ───────────────────────────────────────────────
function SetUsageAlerts({ packages, onSave, initialSettings }) {
  // Use props for initial values if provided
  const [alerts, setAlerts] = React.useState(
    initialSettings || {
      lowCredits: { enabled: true, threshold: 20 },
      packageExpiry: { enabled: true, daysBefore: 7 },
      budgetThreshold: { enabled: false, threshold: 80 },
      unusualSpending: { enabled: true, sensitivity: "medium" },
    }
  );

  const [deliveryMethods, setDeliveryMethods] = React.useState({
    email: true,
    inApp: true,
    sms: false,
  });

  const [showHistory, setShowHistory] = React.useState(false);

  const calculateLowestPackages = () => {
    const lowPackages = packages
      .map(p => ({ ...p, usagePct: pct(p.used, p.total) }))
      .filter(p => p.usagePct >= (alerts.lowCredits?.threshold || 80) && p.remaining > 0)
      .sort((a, b) => b.usagePct - a.usagePct);
    return lowPackages;
  };

  const calculateExpiringPackages = () => {
    const now = new Date();
    const expiringSoon = packages
      .filter(p => p.expiresRaw)
      .map(p => ({
        ...p,
        daysLeft: Math.ceil((new Date(p.expiresRaw) - now) / (1000 * 60 * 60 * 24)),
      }))
      .filter(p => p.daysLeft <= (alerts.packageExpiry?.daysBefore || 7) && p.daysLeft > 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
    return expiringSoon;
  };

  const handleSave = () => {
    const settings = { alerts, deliveryMethods };
    if (onSave) onSave(settings);
  };

  const markAsRead = (id) => {
    setAlertHistory(prev => prev.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="aw-card-title">Set Usage Alerts</div>
          <div className="aw-card-range">Get notified when your packages need attention</div>
        </div>
      </div>

      {/* Alert History Panel */}
      {showHistory && (
        <div style={{
          marginBottom: 24,
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          <div style={{
            background: "#f9fafb",
            padding: "12px 16px",
            borderBottom: "1px solid #e0e0e0",
            fontWeight: 700,
            fontSize: 13,
            color: "#1a1a1a",
          }}>
            Recent Alert History
          </div>
          {alertHistory.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#9e9e9e", fontSize: 12 }}>
              No alerts received yet
            </div>
          ) : (
            <div>
              {alertHistory.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => markAsRead(alert.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    background: alert.read ? "#fff" : "#fef3c7",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 3,
                          background: "#e5e7eb",
                          color: "#374151",
                        }}>
                          {alert.type}
                        </span>
                        {!alert.read && (
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: "#ef4444",
                            color: "#fff",
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#1a1a1a", marginBottom: 4 }}>{alert.message}</div>
                      <div style={{ fontSize: 10, color: "#9e9e9e" }}>{alert.date}</div>
                    </div>
                    {!alert.read && (
                      <span style={{ fontSize: 10, color: "#f59e0b" }}>● Unread</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alert Configuration */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>

        {/* Low Credits Alert */}
        <div style={{
          padding: 16,
          border: "1.5px solid #e0e0e0",
          borderRadius: 8,
          background: alerts.lowCredits?.enabled ? "#f0fdf4" : "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Low Credits Alert</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{ fontSize: 12, color: "#767676" }}>Enable</span>
              <input
                type="checkbox"
                checked={alerts.lowCredits?.enabled || false}
                onChange={(e) => setAlerts(prev => ({
                  ...prev,
                  lowCredits: { ...prev.lowCredits, enabled: e.target.checked, threshold: prev.lowCredits?.threshold || 20 }
                }))}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
            </label>
          </div>
          {alerts.lowCredits?.enabled && (
            <>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#595959", marginBottom: 4 }}>Alert when remaining credits below:</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={alerts.lowCredits?.threshold || 20}
                    onChange={(e) => setAlerts(prev => ({
                      ...prev,
                      lowCredits: { ...prev.lowCredits, threshold: parseInt(e.target.value) }
                    }))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40 }}>{alerts.lowCredits?.threshold || 20}%</span>
                </div>
              </div>
              {calculateLowestPackages().length > 0 && (
                <div style={{
                  padding: 8,
                  background: "#fef3c7",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#92400e",
                  marginTop: 8,
                }}>
                  ⚠️ {calculateLowestPackages().length} package(s) currently below threshold
                </div>
              )}
            </>
          )}
        </div>

        {/* Package Expiry Alert */}
        <div style={{
          padding: 16,
          border: "1.5px solid #e0e0e0",
          borderRadius: 8,
          background: alerts.packageExpiry?.enabled ? "#eff6ff" : "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>⏰</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Package Expiry</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{ fontSize: 12, color: "#767676" }}>Enable</span>
              <input
                type="checkbox"
                checked={alerts.packageExpiry?.enabled || false}
                onChange={(e) => setAlerts(prev => ({
                  ...prev,
                  packageExpiry: { ...prev.packageExpiry, enabled: e.target.checked, daysBefore: prev.packageExpiry?.daysBefore || 7 }
                }))}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
            </label>
          </div>
          {alerts.packageExpiry?.enabled && (
            <>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#595959", marginBottom: 4 }}>Alert before expiry (days):</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={alerts.packageExpiry?.daysBefore || 7}
                    onChange={(e) => setAlerts(prev => ({
                      ...prev,
                      packageExpiry: { ...prev.packageExpiry, daysBefore: parseInt(e.target.value) }
                    }))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40 }}>{alerts.packageExpiry?.daysBefore || 7} days</span>
                </div>
              </div>
              {calculateExpiringPackages().length > 0 && (
                <div style={{
                  padding: 8,
                  background: "#fef3c7",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#92400e",
                  marginTop: 8,
                }}>
                  ⚠️ {calculateExpiringPackages().length} package(s) expiring within {alerts.packageExpiry?.daysBefore || 7} days
                </div>
              )}
            </>
          )}
        </div>

        {/* Budget Threshold Alert */}
        <div style={{
          padding: 16,
          border: "1.5px solid #e0e0e0",
          borderRadius: 8,
          background: alerts.budgetThreshold?.enabled ? "#fefce8" : "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>💰</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Budget Threshold</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{ fontSize: 12, color: "#767676" }}>Enable</span>
              <input
                type="checkbox"
                checked={alerts.budgetThreshold?.enabled || false}
                onChange={(e) => setAlerts(prev => ({
                  ...prev,
                  budgetThreshold: { ...prev.budgetThreshold, enabled: e.target.checked, threshold: prev.budgetThreshold?.threshold || 80 }
                }))}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
            </label>
          </div>
          {alerts.budgetThreshold?.enabled && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#595959", marginBottom: 4 }}>Alert when budget used exceeds:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={alerts.budgetThreshold?.threshold || 80}
                  onChange={(e) => setAlerts(prev => ({
                    ...prev,
                    budgetThreshold: { ...prev.budgetThreshold, threshold: parseInt(e.target.value) }
                  }))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 40 }}>{alerts.budgetThreshold?.threshold || 80}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Delivery Settings - SIRF IN-APP */}
      <div style={{
        padding: 16,
        border: "1.5px solid #e0e0e0",
        borderRadius: 8,
        marginBottom: 24,
        background: "#f0fdf4",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>📱</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
            In-App Notifications
          </div>
          <span style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 12,
            background: "#10b981",
            color: "#fff",
          }}>
            ACTIVE
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#595959" }}>
          Alerts will appear inside your dashboard notification center
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          className="aw-btn-primary"
          style={{ padding: "10px 24px", fontSize: 14 }}
        >
          Save Alert Settings
        </button>
      </div>
    </div>
  );
}

// // ─── Notification Center Component ──────────────────────────────────────────
// function NotificationCenter({ packages, alertSettings }) {
//   const [notifications, setNotifications] = React.useState([]);
//   const [showDropdown, setShowDropdown] = React.useState(false);
//   const lastCheckRef = React.useRef({});

//   // Helper function to check if alert already exists (avoid duplicates)
//   const alertExists = (type, packageName) => {
//     const key = `${type}-${packageName}`;
//     const lastCheck = lastCheckRef.current[key];
//     if (lastCheck && (Date.now() - lastCheck) < 3600000) { // 1 hour
//       return true;
//     }
//     lastCheckRef.current[key] = Date.now();
//     return false;
//   };

//   // Check for alerts based on package data
//   const checkAlerts = React.useCallback(() => {
//     if (!alertSettings) return;

//     const newAlerts = [];
//     const now = new Date();

//     // 1. Low Credits Check
//     if (alertSettings.lowCredits?.enabled) {
//       packages.forEach(pkg => {
//         const total = pkg.total || 1;
//         const used = pkg.used || 0;
//         const usagePct = (used / total) * 100;
//         if (usagePct >= alertSettings.lowCredits.threshold && pkg.remaining > 0) {
//           if (!alertExists("low_credits", pkg.name)) {
//             newAlerts.push({
//               id: `low-${pkg.id}-${Date.now()}-${Math.random()}`,
//               type: "low_credits",
//               title: "⚠️ Low Credits Alert",
//               message: `${pkg.name} is ${Math.round(usagePct)}% used. Only ${pkg.remaining} ${pkg.type === 'cv_credits' ? 'credits' : 'units'} remaining.`,
//               packageName: pkg.name,
//               severity: "warning",
//               timestamp: new Date(),
//               read: false,
//             });
//           }
//         }
//       });
//     }

//     // 2. Package Expiry Check
//     if (alertSettings.packageExpiry?.enabled) {
//       packages.forEach(pkg => {
//         if (pkg.expiresRaw) {
//           const daysLeft = Math.ceil((new Date(pkg.expiresRaw) - now) / (1000 * 60 * 60 * 24));
//           if (daysLeft <= alertSettings.packageExpiry.daysBefore && daysLeft > 0) {
//             if (!alertExists("expiry", pkg.name)) {
//               newAlerts.push({
//                 id: `expiry-${pkg.id}-${Date.now()}-${Math.random()}`,
//                 type: "expiry",
//                 title: "⏰ Package Expiring Soon",
//                 message: `${pkg.name} will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to avoid interruption.`,
//                 packageName: pkg.name,
//                 severity: daysLeft <= 3 ? "critical" : "warning",
//                 timestamp: new Date(),
//                 read: false,
//               });
//             }
//           }
//         }
//       });
//     }

//     // 3. Budget Threshold Check (for daily budget packages)
//     if (alertSettings.budgetThreshold?.enabled) {
//       packages.filter(p => p.isDailyBudget).forEach(pkg => {
//         const usedPct = (pkg.used / pkg.total) * 100;
//         if (usedPct >= alertSettings.budgetThreshold.threshold) {
//           if (!alertExists("budget", pkg.name)) {
//             newAlerts.push({
//               id: `budget-${pkg.id}-${Date.now()}-${Math.random()}`,
//               type: "budget",
//               title: "💰 Budget Alert",
//               message: `${pkg.name} has used ${Math.round(usedPct)}% of your daily budget.`,
//               packageName: pkg.name,
//               severity: "warning",
//               timestamp: new Date(),
//               read: false,
//             });
//           }
//         }
//       });
//     }
//     if (newAlerts.length > 0) {
//       setNotifications(prev => {
//         // Remove any duplicate alerts before adding
//         const existingIds = new Set(prev.map(n => n.id));
//         const uniqueNewAlerts = newAlerts.filter(a => !existingIds.has(a.id));
//         const allAlerts = [...uniqueNewAlerts, ...prev];
//         return allAlerts.slice(0, 50); // Keep last 50 notifications
//       });
//     }
//   }, [packages, alertSettings]);

//   // Check for alerts every 60 seconds (instead of 30)
//   React.useEffect(() => {
//     if (packages.length > 0 && alertSettings) {
//       checkAlerts();
//       const interval = setInterval(checkAlerts, 60000); // 1 minute
//       return () => clearInterval(interval);
//     }
//   }, [checkAlerts, packages.length, alertSettings]);

//   const unreadCount = notifications.filter(n => !n.read).length;

//   const markAsRead = (id) => {
//     setNotifications(prev =>
//       prev.map(n => n.id === id ? { ...n, read: true } : n)
//     );
//   };

//   const markAllAsRead = () => {
//     setNotifications(prev => prev.map(n => ({ ...n, read: true })));
//   };

//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case 'critical': return '#ef4444';
//       case 'warning': return '#f59e0b';
//       default: return '#3b82f6';
//     }
//   };

//   const formatTime = (timestamp) => {
//     const diff = Date.now() - new Date(timestamp);
//     const minutes = Math.floor(diff / 60000);
//     if (minutes < 1) return 'Just now';
//     if (minutes < 60) return `${minutes} min ago`;
//     const hours = Math.floor(minutes / 60);
//     if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
//     const days = Math.floor(hours / 24);
//     return `${days} day${days !== 1 ? 's' : ''} ago`;
//   };

//   return (
//     <div style={{ position: "relative" }}>
//       {/* Bell Icon with Badge */}
//       <button
//         onClick={() => setShowDropdown(!showDropdown)}
//         style={{
//           position: "relative",
//           background: "none",
//           border: "none",
//           cursor: "pointer",
//           padding: "8px",
//           borderRadius: "8px",
//           background: showDropdown ? "#f0f0f0" : "transparent",
//           transition: "background 0.15s",
//         }}
//       >
//         <span style={{ fontSize: 20 }}>🔔</span>
//         {unreadCount > 0 && (
//           <span style={{
//             position: "absolute",
//             top: -2,
//             right: -2,
//             background: "#ef4444",
//             color: "#fff",
//             fontSize: 10,
//             fontWeight: 700,
//             padding: "2px 6px",
//             borderRadius: "10px",
//             minWidth: "18px",
//           }}>
//             {unreadCount > 9 ? "9+" : unreadCount}
//           </span>
//         )}
//       </button>

//       {/* Dropdown */}
//       {showDropdown && (
//         <>
//           <div
//             onClick={() => setShowDropdown(false)}
//             style={{
//               position: "fixed",
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               zIndex: 998,
//             }}
//           />
//           <div style={{
//             position: "absolute",
//             top: "100%",
//             right: 0,
//             width: 380,
//             maxHeight: 500,
//             background: "#fff",
//             borderRadius: 12,
//             boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)",
//             zIndex: 999,
//             overflow: "hidden",
//             marginTop: 8,
//           }}>
//             <div style={{
//               padding: "12px 16px",
//               borderBottom: "1px solid #e0e0e0",
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               background: "#f9fafb",
//             }}>
//               <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>
//                 Notifications
//                 {unreadCount > 0 && (
//                   <span style={{
//                     marginLeft: 8,
//                     fontSize: 11,
//                     background: "#ef4444",
//                     color: "#fff",
//                     padding: "2px 8px",
//                     borderRadius: 12,
//                   }}>
//                     {unreadCount} new
//                   </span>
//                 )}
//               </div>
//               {unreadCount > 0 && (
//                 <button
//                   onClick={markAllAsRead}
//                   style={{
//                     fontSize: 11,
//                     color: "#3b82f6",
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                   }}
//                 >
//                   Mark all as read
//                 </button>
//               )}
//             </div>

//             <div style={{ overflowY: "auto", maxHeight: 420 }}>
//               {notifications.length === 0 ? (
//                 <div style={{
//                   padding: "40px 20px",
//                   textAlign: "center",
//                   color: "#9e9e9e",
//                   fontSize: 13,
//                 }}>
//                   <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
//                   No notifications yet
//                 </div>
//               ) : (
//                 notifications.map(notification => (
//                   <div
//                     key={notification.id}
//                     onClick={() => markAsRead(notification.id)}
//                     style={{
//                       padding: "12px 16px",
//                       borderBottom: "1px solid #f0f0f0",
//                       background: notification.read ? "#fff" : "#fef3c7",
//                       cursor: "pointer",
//                       transition: "background 0.15s",
//                     }}
//                   >
//                     <div style={{ display: "flex", gap: 10 }}>
//                       <div style={{
//                         width: 32,
//                         height: 32,
//                         borderRadius: "50%",
//                         background: `${getSeverityColor(notification.severity)}20`,
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         fontSize: 16,
//                       }}>
//                         {notification.type === "low_credits" && "⚡"}
//                         {notification.type === "expiry" && "⏰"}
//                         {notification.type === "budget" && "💰"}
//                         {notification.type === "unusual" && "📊"}
//                       </div>
//                       <div style={{ flex: 1 }}>
//                         <div style={{
//                           fontSize: 13,
//                           fontWeight: 600,
//                           color: "#1a1a1a",
//                           marginBottom: 2,
//                         }}>
//                           {notification.title}
//                         </div>
//                         <div style={{
//                           fontSize: 12,
//                           color: "#595959",
//                           marginBottom: 4,
//                         }}>
//                           {notification.message}
//                         </div>
//                         <div style={{
//                           fontSize: 10,
//                           color: "#9e9e9e",
//                           display: "flex",
//                           gap: 12,
//                         }}>
//                           <span>
//                             {formatTime(notification.timestamp)}
//                           </span>
//                           {!notification.read && (
//                             <span style={{ color: "#f59e0b" }}>● Unread</span>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// ─── Main Component ────────────────────────────────────────────────────────────
class CompanyWallet extends Component {
  constructor(props) {
    super(props);
    let savedAlertSettings = null;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wallet_alert_settings");
      if (saved) {
        try {
          savedAlertSettings = JSON.parse(saved);
        } catch (e) { }
      }
    }
    this.state = {
      showAddCard: false,
      notifSelectedId: null,
      packages: [],
      selectedCard: 0,
      activeRoiTab: 0,
      loading: true,
      error: null,
      activeTab: "overview",
      savedMethod: null,
      cardSaved: false,
      showCompareSpend: false,
      showSetAlerts: false,
      alertSettings: {
        lowCredits: { enabled: true, threshold: 20 },
        packageExpiry: { enabled: true, daysBefore: 7 },
        budgetThreshold: { enabled: false, threshold: 80 },
      },
    };
    this.userId =
      typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
  }

componentDidMount() {
  this.fetchPackages();
  this.fetchPaymentMethod();
  this.fetchAlertSettings();

  // if opened with a notif id from outside (e.g. from another page)
  if (this.props.initialNotifId !== null && this.props.initialNotifId !== undefined) {
    this.setState({
      activeTab: "notifications",
      notifSelectedId: this.props.initialNotifId,
    });
  }

  this._openNotifHandler = (e) => {
    this.setState({
      activeTab: "notifications",
      notifSelectedId: e?.detail?.selectedId || null,
    });
  };
  // listen on both — direct (when already on wallet) and routed (from other pages)
  window.addEventListener("openNotifications", this._openNotifHandler);
  window.addEventListener("walletOpenNotifications", this._openNotifHandler);
}

componentWillUnmount() {
  window.removeEventListener("openNotifications", this._openNotifHandler);
  window.removeEventListener("walletOpenNotifications", this._openNotifHandler);

  // Restore overflow when leaving wallet page
  document.documentElement.style.overflowX = "";
  document.documentElement.style.maxWidth = "";
  document.body.style.overflowX = "";
  document.body.style.maxWidth = "";
}
  fetchAlertSettings = async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await axios.get(`${apiBaseUrl}alert-settings/get/${this.userId}`);
      if (res.data.success && res.data.data) {
        this.setState({ alertSettings: res.data.data });
      }
    } catch (err) {
      console.error("Failed to fetch alert settings:", err);
    }
  };

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
          const pkg = (() => {
            try {
              return typeof p.package === "string"
                ? JSON.parse(p.package)
                : (p.package || {});
            } catch { return {}; }
          })();

          let total = 0;
          if (pkg.pricing_model === "featured_boost") {
            total = pkg.boost_duration_days || 0;
          } else if (pkg.pricing_model === "job_slot") {
            total = pkg.slot_count || 0;
          } else if (pkg.pricing_model === "cv_credits") {
            total = pkg.credit_count || 0;
          } else {
            total = pkg.num_posts || pkg.slot_count || pkg.credit_count || 0;
          }

          const used = p.used_posts || p.used_credits || p.used_slots || 0;

          return {
            id: p.subscription_id,
            name: pkg.name || "Package",
            type: pkg.pricing_model || "bundle",
            total,
            used,
            remaining: Math.max(total - used, 0),
            price: pkg.price || 0,
            status: p.status || "active",
            expiresRaw: p.end_date || null,
            isDailyBudget: false,
          };
        });

      const dailyPackages = res.data
        .filter(p => p.is_daily_budget)
        .map((p) => {
          const pkg = p.package || {};
          return {
            id: p.subscription_id,
            name: pkg.name || "Job Post",
            type: "daily_budget",
            total: pkg.daily_budget_cap || 0,
            used: pkg.total_spend || 0,
            remaining: Math.max((pkg.daily_budget_cap || 0) - (pkg.total_spend || 0), 0),
            price: pkg.total_spend || 0,
            status: p.status,
            expiresRaw: p.end_date || null,
            isDailyBudget: true,
            billingModel: pkg.billing_model,
            ratePerUnit: pkg.rate_per_unit,
            dailyCapToday: pkg.daily_budget_cap,
            dailySpendToday: pkg.daily_spend_today || 0,
          };
        });

      this.setState({
        packages: [...subPackages, ...dailyPackages],
        loading: false,
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
            last4: cards[0].card_last4,
            brand: cards[0].card_brand,
            holder: cards[0].card_holder,
            acceptedTypes: cards[0].accepted_types,
            expiry: cards[0].card_expiry,
            token: cards[0].payment_token,  // ← add this
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch saved cards", err);
    }
  };
  // savePaymentMethod = async () => {
  //   const { cardInput } = this.state;
  //   const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  //   try {
  //     await axios.post(`${apiBaseUrl}payment/addpayment/${this.userId}`, {
  //       paymentDetails: {
  //         method: "card",
  //         cardLast4: cardInput.last4,
  //         cardName: cardInput.holder,
  //         saveForLater: true,       // ← triggers saved_cards insert
  //       },
  //       amount: 0,                // no charge, just saving card
  //       currency: "PKR",
  //       packageId: null,
  //       jobId: null,
  //     });

  //     this.setState({
  //       savedMethod: { last4: cardInput.last4, brand: cardInput.brand, holder: cardInput.holder },
  //       showAddPayment: false,
  //       cardInput: { last4: "", holder: "", brand: "card" },
  //     });
  //   } catch (err) {
  //     console.error("Failed to save card", err);
  //   }
  // };
  render() {
    const { packages, selectedCard, activeRoiTab, loading, error, savedMethod, activeTab, alertSettings } = this.state;

    if (loading) return <div className="aw-loading"><IconSpinner /> Loading wallet…</div>;
    if (error) return <div className="aw-error">{error}</div>;

    // ── Shared topbar (always the same) ──
   // ─── In CompanyWallet.render() ────────────────────────────────────────────────
// Replace your existing `const Topbar = (...)` block with this.
// The only change is adding <NotificationCenter> into .aw-topbar-right.

const Topbar = (
  <div className="aw-topbar">
    <div className="aw-topbar-tabs">
      {["overview", "transactions", "packages"].map((tab) => (
        <button
          key={tab}
          className={`aw-topbar-tab${activeTab === tab ? " active" : ""}`}
          onClick={() => this.setState({ activeTab: tab })}
        >
          {tab === "overview"
            ? "Overview"
            : tab === "transactions"
            ? "Transactions"          // shorter label on mobile
            : "Packages"}
        </button>
      ))}
    </div>

    <div className="aw-topbar-right">
      <NotificationCenter
        userId={this.userId}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
      />

      {/* hidden on mobile via .aw-hide-mobile CSS rule */}
      <button className="aw-btn-ghost aw-hide-mobile" onClick={this.fetchPackages}>
        Refresh
      </button>

      <button
        className="aw-btn-primary"
        onClick={() => this.setState({ activeTab: "packages" })}
      >
        <IconPlus />
        {/* .aw-label is hidden on mobile, keeping only the + icon */}
        <span className="aw-label">Buy Packages</span>
      </button>
    </div>
  </div>
);


    // ── Empty state (no packages yet) ──
    if (!packages.length) return (
      <div className="aw-root">
        <Head><title>Wallets</title></Head>
        {Topbar}

        {activeTab === "transactions" && (
          <div style={{ padding: 32 }}><TransactionHistory /></div>
        )}

        {activeTab === "packages" && (
          <div style={{ padding: 32 }}><PricingPage /></div>
        )}
{activeTab === "notifications" && (
  <NotificationsPage
    userId={this.userId}
    apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
    onTabChange={(tab) => this.setState({ activeTab: tab })}
    initialSelectedId={this.state.notifSelectedId}
  />
)}
        {activeTab === "overview" && (
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
                      onClick={() => this.setState({ activeTab: "packages" })}>
                      Browse Packages →
                    </button>
                    <button className="aw-btn-ghost"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => this.setState({ savedMethod: null, cardSaved: false })}>
                      Change Card
                    </button>
                  </>
                ) : this.state.cardSaved ? (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div style={{
                      width: 56, height: 56, background: "#d1fae5", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 14px"
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13L9 17L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>Card Saved!</div>
                    <div style={{ fontSize: 13, color: "#767676", marginBottom: 20 }}>
                      You can now buy packages and start posting jobs.
                    </div>
                    <button className="aw-btn-primary"
                      style={{ margin: "0 auto", justifyContent: "center" }}
                      onClick={() => this.setState({ activeTab: "packages" })}>
                      Browse Packages →
                    </button>
                  </div>
                ) : (
                  <AddCardForm
                    onSave={async (cardInput) => {
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                      try {
                        await axios.post(`${apiBaseUrl}payment/addpayment/${this.userId}`, {
                          paymentDetails: {
                            method: "card", cardLast4: cardInput.last4,
                            cardName: cardInput.holder, saveForLater: cardInput.saveForLater, expiry: cardInput.expiry,
                            acceptedTypes: cardInput.acceptedTypes,
                          },
                          amount: 0, currency: "PKR", packageId: null, jobId: null,
                        });
                        this.setState({
                          cardSaved: true,
                          savedMethod: {
                            last4: cardInput.last4, brand: cardInput.brand,
                            holder: cardInput.holder, expiry: cardInput.expiry, acceptedTypes: cardInput.acceptedTypes,

                          },
                        });
                      } catch (err) {
                        console.error("Failed to save card", err);
                        alert("Could not save card. Please try again.");
                      }
                    }}
                    onBrowse={() => this.setState({ activeTab: "packages" })}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );

    // ── Normal state (has packages) ──
    const pkg = packages[selectedCard];
    const now = new Date();
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
    const rangeStr = `${monthAgo.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })} – ${now.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`;

    return (
      <div className="aw-root">
        <Head><title>Wallets</title></Head>
        {Topbar}

        {activeTab === "transactions" && (
          <div style={{ padding: 32 }}><TransactionHistory /></div>
        )}

        {activeTab === "packages" && (
          <div style={{ padding: 32 }}><PricingPage /></div>
        )}
 {activeTab === "notifications" && (
      <NotificationsPage
        userId={this.userId}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
        onTabChange={(tab) => this.setState({ activeTab: tab })}
        initialSelectedId={this.state.notifSelectedId}
      />
    )}
        {activeTab === "overview" && (
          <div className="aw-body">
            <div className="aw-page-header">
              <div>
                <div className="aw-page-title">Company Wallet</div>
                <div className="aw-page-sub">Monitor and analyse spend across all your packages</div>
              </div>
              <div className="aw-date-range">
                <span style={{ fontSize: 13, color: "#767676" }}>Date range</span>
                <div className="aw-date-badge"><IconCalendar /> {rangeStr}</div>
              </div>
            </div>

            <div className="aw-full aw-card aw-card-pad">
              <div className="aw-card-title" style={{ marginBottom: 4 }}>Your Packages</div>
              <div className="aw-card-range">{packages.length} package{packages.length !== 1 ? "s" : ""} found — select one to see details</div>
              <div className="aw-pkg-grid">
                {packages.map((p, i) => (
                  <PackageCard key={p.id} pkg={p} isSelected={selectedCard === i} onClick={() => this.setState({ selectedCard: i })} />
                ))}
              </div>
            </div>

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
                <UsageROI packages={packages} activeTab={activeRoiTab} onTab={(i) => this.setState({ activeRoiTab: i })} />
              </div>
            </div>

            {this.state.showAddCard && (
              <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 9999, padding: 16,
              }}>
                <div className="aw-card" style={{
                  width: "100%", maxWidth: 480,
                  maxHeight: "90vh", overflowY: "auto",
                  padding: "28px 32px", position: "relative",
                }}>
                  {/* Close button */}
                  <button
                    onClick={() => this.setState({ showAddCard: false })}
                    style={{
                      position: "absolute", top: 16, right: 16,
                      background: "#fee2e2", border: "none", borderRadius: "50%",
                      width: 32, height: 32, cursor: "pointer",
                      color: "#991b1b", fontWeight: 700, fontSize: 16,
                    }}
                  >×</button>

                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", marginBottom: 20 }}>
                    {savedMethod ? "Change Payment Card" : "Add Payment Method"}
                  </div>

                  <AddCardForm
                    onSave={async (cardInput) => {
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                      try {
                        await axios.post(`${apiBaseUrl}payment/addpayment/${this.userId}`, {
                          paymentDetails: {
                            method: "card",
                            cardLast4: cardInput.last4,
                            cardName: cardInput.holder,
                            saveForLater: cardInput.saveForLater,
                            expiry: cardInput.expiry,
                            acceptedTypes: cardInput.acceptedTypes,
                          },
                          amount: 0, currency: "PKR", packageId: null, jobId: null,
                        });
                        this.setState({
                          showAddCard: false,
                          savedMethod: {
                            last4: cardInput.last4,
                            brand: cardInput.brand,
                            holder: cardInput.holder,
                            expiry: cardInput.expiry,
                            acceptedTypes: cardInput.acceptedTypes,
                          },
                        });
                      } catch (err) {
                        console.error("Failed to save card", err);
                        alert("Could not save card. Please try again.");
                      }
                    }}
                    onBrowse={() => this.setState({ showAddCard: false, activeTab: "packages" })}
                  />
                </div>
              </div>
            )}

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
                    onAdd={() => this.setState({ showAddCard: true })}
                    onChange={() => this.setState({ showAddCard: true })}
                  />
                </div>
                <div className="aw-card aw-card-pad" style={{ flex: 1 }}>
                  <div className="aw-card-title" style={{ marginBottom: 14 }}>Quick Actions</div>
                  <QuickLinks
                    onBuy={() => this.setState({ activeTab: "packages" })}
                    onHistory={() => this.setState({ activeTab: "transactions" })}
                    onCompareSpend={() => this.setState({ showCompareSpend: true })}
                    onSetAlerts={() => this.setState({ showSetAlerts: true })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Compare Spend Modal */}
        {this.state.showCompareSpend && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 16,
          }}>
            <div className="aw-card" style={{
              width: "100%", maxWidth: 900,
              maxHeight: "90vh", overflowY: "auto",
              padding: "28px 32px", position: "relative",
            }}>
              <button
                onClick={() => this.setState({ showCompareSpend: false })}
                style={{
                  position: "absolute", top: 16, right: 16,
                  background: "#fee2e2", border: "none", borderRadius: "50%",
                  width: 32, height: 32, cursor: "pointer",
                  color: "#991b1b", fontWeight: 700, fontSize: 16,
                }}
              >×</button>
              <CompareSpendByType packages={packages} />
            </div>
          </div>
        )}

        {/* Set Alerts Modal */}
        {this.state.showSetAlerts && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 16,
          }}>
            <div className="aw-card" style={{
              width: "100%", maxWidth: 800,
              maxHeight: "90vh", overflowY: "auto",
              padding: "28px 32px", position: "relative",
            }}>
              <button
                onClick={() => this.setState({ showSetAlerts: false })}
                style={{
                  position: "absolute", top: 16, right: 16,
                  background: "#fee2e2", border: "none", borderRadius: "50%",
                  width: 32, height: 32, cursor: "pointer",
                  color: "#991b1b", fontWeight: 700, fontSize: 16,
                }}
              >×</button>
              <SetUsageAlerts
                packages={packages}
                initialSettings={alertSettings}
                onSave={async (settings) => {
                  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                  try {
                    await axios.post(`${apiBaseUrl}alert-settings/save/${this.userId}`, settings.alerts);

                    this.setState({
                      alertSettings: settings.alerts,
                      showSetAlerts: false
                    }, () => {
                      alert("✅ Alert settings saved successfully!");
                    });
                  } catch (err) {
                    console.error("Failed to save settings:", err);
                    alert("❌ Failed to save settings. Please try again.");
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default CompanyWallet;
export { AddCardForm};