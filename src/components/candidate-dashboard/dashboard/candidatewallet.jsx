import React, { Component } from "react";
import axios from "axios";
import Head from "next/head";
import api from "../../lib/api";
import Payment from "../../company-dashboard/payment";
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

// ─── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

.cw-root {
  min-height: 100vh;
  background: #f7f5f2;
  font-family: 'DM Sans', sans-serif;
  box-sizing: border-box;
  overflow-x: clip;
  max-width: 100%;
}
.cw-root *, .cw-root *::before, .cw-root *::after {
  box-sizing: border-box; margin: 0; padding: 0;
}

/* ── Topbar ── */
.cw-topbar {
  background: #ffffff;
  border-bottom: 1px solid #e8e4df;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  gap: 8px;
  max-width: 100vw;
  min-width: 0;
}
   .cw-topbar > * {
  min-width: 0;
}
.cw-topbar-tabs {
  display: flex;
  align-items: center;
  height: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1 1 0;
  min-width: 0;
  padding-top: 20px;
  max-width: calc(100% - 160px);
}
.cw-topbar-tabs::-webkit-scrollbar { display: none; }
.cw-topbar-tab {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.67);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  font-family: 'DM Sans', sans-serif;
}
.cw-topbar-tab:hover { color: rgba(0,0,0,0.75);}
.cw-topbar-tab.active {
  color: #1c2b30;
  border-bottom-color: #36565f;
  font-weight: 600;
}
.cw-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  padding-top: 20px;
}
.cw-btn-primary {
  background: #36565f;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
}
.cw-btn-primary:hover { background: #36565f; }
.cw-btn-ghost {
  background: transparent;
  color: #555;                
  border: 1px solid #ddd; 
  border-radius: 6px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
  transition: all 0.15s;
}
.cw-btn-ghost:hover { background: rgba(0,0,0,0.04); }

/* ── Body ── */
.cw-body { padding: 32px 32px 100px; margin-top: 0; }

/* ── Page header ── */
.cw-page-header {
  margin-bottom: 28px;
}
.cw-page-title {
  font-family: 'DM Serif Display', serif;
  font-size: 28px;
  color: #1c2b30;
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}
.cw-page-sub { font-size: 13px; color: #8a8a8a; }

/* ── Stat cards row ── */
.cw-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.cw-stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 22px;
  border: 1px solid #e8e4df;
  position: relative;
  overflow: hidden;
}
.cw-stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 12px 12px 0 0;
}
.cw-stat-card.teal::before { background: #0e5e42; }
.cw-stat-card.amber::before { background: #e8a84c; }
.cw-stat-card.rose::before { background: #d4756a; }
.cw-stat-card.slate::before { background: #8899aa; }

.cw-stat-label { font-size: 11px; font-weight: 600; color: #9a9a9a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.cw-stat-value { font-family: 'DM Serif Display', serif; font-size: 28px; color: #1c2b30; line-height: 1; margin-bottom: 4px; }
.cw-stat-sub { font-size: 12px; color: #aaa; }

/* ── Card ── */
.cw-card {
  background: #fff;
  border: 1px solid #e8e4df;
  border-radius: 12px;
}
.cw-card-pad { padding: 24px; }

/* ── Grid ── */
.cw-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.cw-full { margin-bottom: 20px; }

/* ── Package grid ── */
.cw-pkg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 16px;
}
.cw-pkg-card {
  border: 1.5px solid #e8e4df;
  border-radius: 10px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  position: relative;
  overflow: hidden;
}
.cw-pkg-card:hover { border-color: #7eb8a4; box-shadow: 0 4px 12px rgba(126,184,164,0.15); transform: translateY(-2px); }
.cw-pkg-card.selected { border-color: #7eb8a4; background: #f0f9f6; }
.cw-pkg-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 10px 10px 0 0; }

.cw-pkg-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 3px 9px; border-radius: 20px;
  margin-bottom: 10px;
}
.cw-pkg-status.active { background: #e8f5f1; color: #2e7d62; }
.cw-pkg-status.pending { background: #fef3e2; color: #b45309; }
.cw-pkg-status.expired { background: #fde8e8; color: #b91c1c; }
.cw-pkg-status.rejected { background: #f3f3f3; color: #666; }

.cw-pkg-name { font-size: 13px; font-weight: 600; color: #1c2b30; margin-bottom: 4px; }
.cw-pkg-type { font-size: 11px; color: #9a9a9a; margin-bottom: 12px; }
.cw-pkg-price { font-family: 'DM Serif Display', serif; font-size: 22px; color: #1c2b30; line-height: 1; margin-bottom: 2px; }
.cw-pkg-currency { font-size: 11px; color: #aaa; margin-bottom: 12px; }

.cw-pkg-progress { height: 4px; background: #f0ede9; border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
.cw-pkg-progress-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.cw-pkg-meta { display: flex; justify-content: space-between; font-size: 10px; color: #bbb; }

/* ── Detail rows ── */
.cw-detail-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid #f5f2ee;
  font-size: 13.5px; gap: 8px;
}
.cw-detail-row:last-child { border-bottom: none; }
.cw-detail-label { color: #7a7a7a; }
.cw-detail-val { font-weight: 600; color: #1c2b30; text-align: right; word-break: break-word; }

/* ── Status badge ── */
.cw-status { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; }
.cw-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* ── Boost badge ── */
.cw-boost-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
}

/* ── Timeline ── */
.cw-timeline { position: relative; padding-left: 24px; }
.cw-timeline::before {
  content: '';
  position: absolute; left: 7px; top: 6px; bottom: 6px;
  width: 2px; background: #e8e4df;
}
.cw-timeline-item { position: relative; margin-bottom: 20px; }
.cw-timeline-dot {
  position: absolute; left: -24px; top: 3px;
  width: 14px; height: 14px; border-radius: 50%;
  background: #7eb8a4; border: 2px solid #fff;
  box-shadow: 0 0 0 2px #e8e4df;
}
.cw-timeline-dot.pending { background: #e8a84c; }
.cw-timeline-dot.expired { background: #d4756a; }
.cw-timeline-dot.rejected { background: #ccc; }
.cw-timeline-title { font-size: 13px; font-weight: 600; color: #1c2b30; margin-bottom: 3px; }
.cw-timeline-sub { font-size: 12px; color: #9a9a9a; }

/* ── Empty state ── */
.cw-empty {
  text-align: center; padding: 60px 20px;
}
.cw-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
.cw-empty-title { font-family: 'DM Serif Display', serif; font-size: 20px; color: #1c2b30; margin-bottom: 6px; }
.cw-empty-sub { font-size: 13px; color: #aaa; margin-bottom: 24px; }

/* ── Loading ── */
.cw-loading {
  display: flex; align-items: center; justify-content: center;
  min-height: 400px; color: #9a9a9a; font-size: 14px; gap: 10px;
}
@keyframes cw-spin { to { transform: rotate(360deg); } }
.cw-spin { animation: cw-spin 0.9s linear infinite; }

/* ── Card title ── */
.cw-card-title { font-family: 'DM Serif Display', serif; font-size: 18px; color: #1c2b30; margin-bottom: 4px; }
.cw-card-sub { font-size: 12px; color: #aaa; margin-bottom: 20px; }

/* ── Donut ── */
.cw-donut-wrap { position: relative; width: 160px; height: 160px; flex-shrink: 0; }
.cw-donut-center {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center; pointer-events: none;
}
.cw-donut-total { font-family: 'DM Serif Display', serif; font-size: 16px; color: #1c2b30; display: block; }
.cw-donut-label { font-size: 10px; color: #aaa; display: block; margin-top: 2px; }
.cw-snapshot-inner { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
.cw-legend { display: flex; flex-direction: column; gap: 12px; flex: 1; min-width: 0; }
.cw-legend-item { display: flex; align-items: center; gap: 8px; }
.cw-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.cw-legend-name { font-size: 12px; color: #7a7a7a; }
.cw-legend-val { font-size: 15px; font-weight: 700; color: #1c2b30; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .cw-stats-row { grid-template-columns: 1fr 1fr; }
  .cw-two-col { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .cw-topbar { padding: 0 14px; }
  .cw-body { padding: 18px 14px 100px; }
  .cw-stats-row { grid-template-columns: 1fr 1fr; gap: 10px; }
  .cw-stat-card { padding: 14px 16px; }
  .cw-stat-value { font-size: 22px; }
  .cw-pkg-grid { grid-template-columns: 1fr 1fr; }
  .cw-btn-ghost { display: none; }
}
@media (max-width: 400px) {
  .cw-stats-row { grid-template-columns: 1fr; }
  .cw-pkg-grid { grid-template-columns: 1fr; }
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
    featured_boost: { label: "Featured Boost", color: "#7eb8a4", light: "#e8f5f1" },
    duration_bundle: { label: "Profile Spotlight", color: "#e8a84c", light: "#fef3e2" },
    profile_top: { label: "Top of Search", color: "#7eb8a4", light: "#e8f5f1" },
    highlighted_profile: { label: "Highlighted Profile", color: "#8899aa", light: "#eef2f5" },
    recruiter_spotlight: { label: "Recruiter Spotlight", color: "#d4756a", light: "#fde8e8" },
};

const BOOST_TYPE_META = {
    profile_top: { label: "Top of Search Results", icon: "⬆", color: "#7eb8a4" },
    highlighted_profile: { label: "Highlighted Profile", icon: "✦", color: "#8899aa" },
    recruiter_spotlight: { label: "Recruiter Spotlight", icon: "🎯", color: "#d4756a" },
};

const fmtPrice = (n, cur = "PKR") => `${cur} ${Number(n || 0).toLocaleString("en-PK")}`;
const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
    : "N/A";

const daysLeft = (endDate) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
    <svg className="cw-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7eb8a4" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
);

// ─── Package Card ─────────────────────────────────────────────────────────────
function PkgCard({ pkg, isSelected, onClick }) {
    const meta = TYPE_META[pkg.boost_type] || TYPE_META[pkg.pricing_model] || TYPE_META.featured_boost;
    const days = daysLeft(pkg.end_date);
    const isActive = pkg.status === "active";
    const isPending = pkg.status === "pending";
    const isExpired = pkg.status === "expired";
    const isRejected = pkg.status === "rejected";

    const statusClass = isActive ? "active" : isPending ? "pending" : isExpired ? "expired" : "rejected";
    const statusLabel = isActive ? "Active" : isPending ? "Pending" : isExpired ? "Expired" : "Rejected";

    const progressPct = isActive && pkg.duration_days > 0 && days !== null
        ? Math.max(0, Math.min(100, Math.round(((pkg.duration_days - Math.max(days, 0)) / pkg.duration_days) * 100)))
        : isExpired ? 100 : 0;

    return (
        <div className={`cw-pkg-card${isSelected ? " selected" : ""}`} onClick={onClick}>
            <div className="cw-pkg-accent" style={{ background: meta.color }} />
            <div className={`cw-pkg-status ${statusClass}`}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                {statusLabel}
            </div>
            <div className="cw-pkg-name">{pkg.package_name}</div>
            <div className="cw-pkg-type">{meta.label}</div>
            <div className="cw-pkg-price">{Number(pkg.price || 0).toLocaleString()}</div>
            <div className="cw-pkg-currency">{pkg.currency || "PKR"}</div>

            {isActive && (
                <>
                    <div className="cw-pkg-progress">
                        <div className="cw-pkg-progress-fill" style={{ width: `${progressPct}%`, background: meta.color }} />
                    </div>
                    <div className="cw-pkg-meta">
                        <span>{progressPct}% elapsed</span>
                        <span style={{ color: days !== null && days <= 3 ? "#d4756a" : "#bbb" }}>
                            {days !== null && days > 0 ? `${days}d left` : "Ends today"}
                        </span>
                    </div>
                </>
            )}

            {isPending && (
                <div style={{ fontSize: 11, color: "#b45309", background: "#fef3e2", borderRadius: 6, padding: "6px 8px", marginTop: 8 }}>
                    Awaiting admin activation
                </div>
            )}
        </div>
    );
}

// ─── Spend Snapshot ───────────────────────────────────────────────────────────
function SpendSnapshot({ packages }) {
    const valid = packages.filter(p => Number(p.price) > 0);
    if (!valid.length) return (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb", fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            No spend data yet
        </div>
    );

    const total = valid.reduce((s, p) => s + Number(p.price || 0), 0);
    const colors = valid.map((p) => (TYPE_META[p.boost_type] || TYPE_META[p.pricing_model] || TYPE_META.featured_boost).color);

    const data = {
        labels: valid.map(p => p.package_name),
        datasets: [{
            data: valid.map(p => Number(p.price)),
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
        <div className="cw-snapshot-inner">
            <div className="cw-donut-wrap">
                <Doughnut data={data} options={options} />
                <div className="cw-donut-center">
                    <span className="cw-donut-total">{fmtPrice(total)}</span>
                    <span className="cw-donut-label">Total invested</span>
                </div>
            </div>
            <div className="cw-legend">
                {valid.map((p, i) => {
                    const m = TYPE_META[p.boost_type] || TYPE_META[p.pricing_model] || TYPE_META.featured_boost;
                    return (
                        <div key={i} className="cw-legend-item">
                            <span className="cw-legend-dot" style={{ background: m.color }} />
                            <div>
                                <div className="cw-legend-name">{m.label}</div>
                                <div className="cw-legend-val">{fmtPrice(p.price, p.currency)}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Package Detail ───────────────────────────────────────────────────────────
function PackageDetail({ pkg }) {
    const meta = TYPE_META[pkg.boost_type] || TYPE_META[pkg.pricing_model] || TYPE_META.featured_boost;
    const boostMeta = BOOST_TYPE_META[pkg.boost_type] || null;
    const isActive = pkg.status === "active";
    const isExpired = pkg.status === "expired";
    const isPending = pkg.status === "pending";
    const days = daysLeft(pkg.end_date);

    const rows = [
        { label: "Package name", value: pkg.package_name },
        {
            label: "Type", value: (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 4, background: meta.light, color: meta.color }}>
                    {meta.label}
                </span>
            )
        },
        ...(boostMeta ? [{
            label: "Boost type", value: (
                <span className="cw-boost-badge" style={{ background: meta.light, color: meta.color }}>
                    {boostMeta.icon} {boostMeta.label}
                </span>
            )
        }] : []),
        { label: "Amount paid", value: fmtPrice(pkg.price, pkg.currency) },
        {
            label: "Status", value: (
                <span className="cw-status">
                    <span className="cw-status-dot" style={{
                        background: isActive ? "#10b981" : isPending ? "#f59e0b" : isExpired ? "#ef4444" : "#ccc"
                    }} />
                    <span style={{ color: isActive ? "#059669" : isPending ? "#b45309" : isExpired ? "#ef4444" : "#888" }}>
                        {isActive ? "Active" : isPending ? "Pending Activation" : isExpired ? "Expired" : "Rejected"}
                    </span>
                </span>
            )
        },
        { label: "Duration", value: `${pkg.duration_days || 0} days` },
        { label: "Start date", value: fmtDate(pkg.start_date) },
        { label: "Expiry date", value: fmtDate(pkg.end_date) },
        ...(isActive && days !== null ? [{
            label: "Days remaining",
            value: <span style={{ color: days <= 3 ? "#ef4444" : "#059669", fontWeight: 700 }}>{days > 0 ? `${days} days` : "Expires today"}</span>
        }] : []),
        { label: "Purchased on", value: fmtDate(pkg.purchased_at) },
    ];

    return (
        <div>
            {isPending && (
                <div style={{
                    background: "#fef3e2", border: "1px solid #f59e0b",
                    borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                    fontSize: 12, color: "#b45309", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8
                }}>
                    ⏳ Your boost is being reviewed by admin. It will activate shortly.
                </div>
            )}
            {isActive && days !== null && days <= 3 && (
                <div style={{
                    background: "#fde8e8", border: "1px solid #d4756a",
                    borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                    fontSize: 12, color: "#b91c1c", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8
                }}>
                    ⚠️ Your boost expires in {days} day{days !== 1 ? "s" : ""}. Consider renewing soon.
                </div>
            )}
            {rows.map((r, i) => (
                <div key={i} className="cw-detail-row">
                    <span className="cw-detail-label">{r.label}</span>
                    <span className="cw-detail-val">{r.value}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────
function ActivityTimeline({ packages }) {
    if (!packages.length) return (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#bbb", fontSize: 13 }}>
            No activity yet
        </div>
    );

    const events = packages.flatMap(pkg => {
        const items = [];
        items.push({
            date: pkg.purchased_at,
            title: `Purchased: ${pkg.package_name}`,
            sub: `${fmtPrice(pkg.price, pkg.currency)} · ${(TYPE_META[pkg.boost_type] || TYPE_META[pkg.pricing_model] || TYPE_META.featured_boost).label}`,
            dot: "pending",
        });
        if (pkg.start_date && pkg.status === "active") {
            items.push({
                date: pkg.start_date,
                title: `Activated: ${pkg.package_name}`,
                sub: `Boost started — runs for ${pkg.duration_days} days`,
                dot: "active",
            });
        }
        if (pkg.status === "expired") {
            items.push({
                date: pkg.end_date,
                title: `Expired: ${pkg.package_name}`,
                sub: `Boost ended`,
                dot: "expired",
            });
        }
        if (pkg.status === "rejected") {
            items.push({
                date: pkg.purchased_at,
                title: `Rejected: ${pkg.package_name}`,
                sub: `Admin rejected this boost order`,
                dot: "rejected",
            });
        }
        return items;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    return (
        <div className="cw-timeline">
            {events.map((e, i) => (
                <div key={i} className="cw-timeline-item">
                    <div className={`cw-timeline-dot ${e.dot}`} />
                    <div className="cw-timeline-title">{e.title}</div>
                    <div className="cw-timeline-sub">{e.sub}</div>
                    {e.date && <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>{fmtDate(e.date)}</div>}
                </div>
            ))}
        </div>
    );
}

// ─── Buy Packages Page (placeholder) ─────────────────────────────────────────
function BuyPackagesPage({ onBack }) {
    return (
        <div style={{ padding: "32px" }}>
            <button onClick={onBack} style={{
                background: "none", border: "1px solid #e8e4df", borderRadius: 8,
                padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "#555",
                marginBottom: 24, display: "flex", alignItems: "center", gap: 6
            }}>
                ← Back to Wallet
            </button>
            <div className="cw-card cw-card-pad">
                <div className="cw-card-title" style={{ marginBottom: 8 }}>Boost Your Profile</div>
                <div style={{ fontSize: 13, color: "#aaa" }}>
                    Profile boost packages will appear here. Contact your admin or navigate to the Boost section.
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
class CandidateWallet extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showBoostModal: false,
            packages: [],
            selectedCard: 0,
            loading: true,
            error: null,
            activeTab: "overview",
        };
        this.accountId =
            typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
        this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    }

    componentDidMount() {
        this.fetchPackages();
    }

    fetchPackages = async () => {
        this.setState({ loading: true, error: null });
        try {
            if (!this.accountId) {
                this.setState({ error: "User not logged in.", loading: false });
                return;
            }
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `${this.apiBaseUrl}candidateProfile/candidate-packages/${this.accountId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            this.setState({ packages: res.data.data || [], loading: false });
        } catch (err) {
            console.error("Wallet fetch error:", err);
            this.setState({ error: "Failed to load wallet. Please try again.", loading: false });
        }
    };

    render() {
        const { packages, selectedCard, loading, error, activeTab } = this.state;

        if (loading) return (
            <div className="cw-root">
                <div className="cw-loading"><Spinner /> Loading wallet…</div>
            </div>
        );

        if (error) return (
            <div className="cw-root">
                <div style={{ margin: 32, padding: 20, background: "#fde8e8", border: "1px solid #d4756a", borderRadius: 8, color: "#b91c1c", fontSize: 14 }}>
                    {error}
                </div>
            </div>
        );

        // ── Stats ──
        const totalSpend = packages.reduce((s, p) => s + Number(p.price || 0), 0);
        const activeCount = packages.filter(p => p.status === "active").length;
        const pendingCount = packages.filter(p => p.status === "pending").length;
        const expiredCount = packages.filter(p => p.status === "expired").length;

        // ── Topbar ──
        const Topbar = (
            <div className="cw-topbar">
                <div className="cw-topbar-tabs">
                    {["overview", "history"].map(tab => (
                        <button
                            key={tab}
                            className={`cw-topbar-tab${activeTab === tab ? " active" : ""}`}
                            onClick={() => this.setState({ activeTab: tab })}
                        >
                            {tab === "overview" ? "Overview" : "Purchase History"}
                        </button>
                    ))}
                </div>
                <div className="cw-topbar-right">
                    <button className="cw-btn-ghost" onClick={this.fetchPackages}>Refresh</button>
                    <button
                        className="cw-btn-primary"
                        onClick={() => this.setState({ showBoostModal: true })}
                    >
                        + Buy Boost
                    </button>
                </div>
            </div>
        );

        // ── Buy page ──
        if (activeTab === "buy") return (
            <div className="cw-root">
                {typeof window !== "undefined" && <Head><title>My Wallet</title></Head>}
                {Topbar}
                {this.state.showBoostModal && (
                    <BoostModal
                        onClose={() => this.setState({ showBoostModal: false })}
                        onSuccess={() => {
                            this.setState({ showBoostModal: false });
                            this.fetchPackages();
                        }}
                    />
                )}
            </div>
        );

        // ── History tab ──
        if (activeTab === "history") return (
            <div className="cw-root">
                {typeof window !== "undefined" && <Head><title>My Wallet</title></Head>}
                {Topbar}
                {this.state.showBoostModal && (
                    <BoostModal
                        onClose={() => this.setState({ showBoostModal: false })}
                        onSuccess={() => {
                            this.setState({ showBoostModal: false });
                            this.fetchPackages();
                        }}
                    />
                )}
                <div className="cw-body">
                    <div className="cw-page-header">
                        <div className="cw-page-title">Purchase History</div>
                        <div className="cw-page-sub">All your boost package transactions</div>
                    </div>
                    <div className="cw-card">
                        {packages.length === 0 ? (
                            <div className="cw-empty">
                                <div className="cw-empty-icon">🧾</div>
                                <div className="cw-empty-title">No purchases yet</div>
                                <div className="cw-empty-sub">Your boost package transactions will appear here</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid #e8e4df", textAlign: "left" }}>
                                            {["Package", "Type", "Amount", "Duration", "Status", "Purchased On", "Expires"].map(h => (
                                                <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packages.map((pkg, i) => {
                                            const meta = TYPE_META[pkg.boost_type] || TYPE_META[pkg.pricing_model] || TYPE_META.featured_boost;
                                            const isActive = pkg.status === "active";
                                            const isExpired = pkg.status === "expired";
                                            const isPending = pkg.status === "pending";
                                            return (
                                                <tr key={i} style={{ borderBottom: "1px solid #f5f2ee" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#fafaf8"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1c2b30" }}>{pkg.package_name}</td>
                                                    <td style={{ padding: "14px 16px" }}>
                                                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: meta.light, color: meta.color }}>
                                                            {meta.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1c2b30" }}>{fmtPrice(pkg.price, pkg.currency)}</td>
                                                    <td style={{ padding: "14px 16px", color: "#7a7a7a" }}>{pkg.duration_days} days</td>
                                                    <td style={{ padding: "14px 16px" }}>
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                                                            background: isActive ? "#e8f5f1" : isPending ? "#fef3e2" : isExpired ? "#fde8e8" : "#f3f3f3",
                                                            color: isActive ? "#2e7d62" : isPending ? "#b45309" : isExpired ? "#b91c1c" : "#666",
                                                        }}>
                                                            {isActive ? "Active" : isPending ? "Pending" : isExpired ? "Expired" : "Rejected"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: "#9a9a9a", whiteSpace: "nowrap" }}>{fmtDate(pkg.purchased_at)}</td>
                                                    <td style={{ padding: "14px 16px", color: "#9a9a9a", whiteSpace: "nowrap" }}>{fmtDate(pkg.end_date)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );

        // ── Overview tab ──
        const pkg = packages[selectedCard] || null;

        return (
            <div className="cw-root">
                {typeof window !== "undefined" && <Head><title>My Wallet</title></Head>}
                {Topbar}
                {this.state.showBoostModal && (
                    <BoostModal
                        onClose={() => this.setState({ showBoostModal: false })}
                        onSuccess={() => {
                            this.setState({ showBoostModal: false });
                            this.fetchPackages();
                        }}
                    />
                )}
                <div className="cw-body">
                    <div className="cw-page-header">
                        <div className="cw-page-title">My Wallet</div>
                        <div className="cw-page-sub">Track your profile boost packages and spending</div>
                    </div>

                    {/* Stat cards */}
                    <div className="cw-stats-row">
                        <div className="cw-stat-card teal">
                            <div className="cw-stat-label">Total Invested</div>
                            <div className="cw-stat-value">{fmtPrice(totalSpend)}</div>
                            <div className="cw-stat-sub">across {packages.length} package{packages.length !== 1 ? "s" : ""}</div>
                        </div>
                        <div className="cw-stat-card amber">
                            <div className="cw-stat-label">Active Boosts</div>
                            <div className="cw-stat-value">{activeCount}</div>
                            <div className="cw-stat-sub">currently running</div>
                        </div>
                        <div className="cw-stat-card slate">
                            <div className="cw-stat-label">Pending</div>
                            <div className="cw-stat-value">{pendingCount}</div>
                            <div className="cw-stat-sub">awaiting activation</div>
                        </div>
                        <div className="cw-stat-card rose">
                            <div className="cw-stat-label">Expired</div>
                            <div className="cw-stat-value">{expiredCount}</div>
                            <div className="cw-stat-sub">past boosts</div>
                        </div>
                    </div>

                    {/* No packages state */}
                    {packages.length === 0 ? (
                        <div className="cw-card">
                            <div className="cw-empty">
                                <div className="cw-empty-icon">🚀</div>
                                <div className="cw-empty-title">No boosts yet</div>
                                <div className="cw-empty-sub">Buy a profile boost to appear higher in recruiter searches</div>
                                <button className="cw-btn-primary" style={{ margin: "0 auto" }}
                                    onClick={() => this.setState({ showBoostModal: true })}>
                                    + Buy Your First Boost
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Package cards */}
                            <div className="cw-full cw-card cw-card-pad">
                                <div className="cw-card-title">Your Packages</div>
                                <div className="cw-card-sub">{packages.length} package{packages.length !== 1 ? "s" : ""} — select one to view details</div>
                                <div className="cw-pkg-grid">
                                    {packages.map((p, i) => (
                                        <PkgCard key={i} pkg={p} isSelected={selectedCard === i}
                                            onClick={() => this.setState({ selectedCard: i })} />
                                    ))}
                                </div>
                            </div>

                            <div className="cw-two-col">
                                {/* Spend snapshot */}
                                <div className="cw-card cw-card-pad">
                                    <div className="cw-card-title">Spend Snapshot</div>
                                    <div className="cw-card-sub">Breakdown by boost type</div>
                                    <SpendSnapshot packages={packages} />
                                </div>

                                {/* Selected package detail */}
                                {pkg && (
                                    <div className="cw-card cw-card-pad">
                                        <div className="cw-card-title">Package Details</div>
                                        <div className="cw-card-sub">{pkg.package_name}</div>
                                        <PackageDetail pkg={pkg} />
                                    </div>
                                )}
                            </div>

                            {/* Activity timeline */}
                            <div className="cw-card cw-card-pad">
                                <div className="cw-card-title">Activity Timeline</div>
                                <div className="cw-card-sub">Recent boost activity</div>
                                <div style={{ marginTop: 16 }}>
                                    <ActivityTimeline packages={packages} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
}

class BoostModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            packages: [],
            selected: null,
            loading: false,
            showPayment: false,
            selectedPkg: null,
        };
    }

    componentDidMount() {
        const token = localStorage.getItem("token");
        api.get("/candidateProfile/boost/packages", {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => this.setState({ packages: res.data.data || [] }));
    }

    handlePaymentSuccess = async () => {
        const { selected } = this.state;
        const token = localStorage.getItem("token");
        try {
            const res = await api.post("/candidateProfile/boost/order",
                { package_id: selected },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                alert("Boost order placed! Waiting for admin approval.");
                this.props.onSuccess();
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            alert("Something went wrong. Please try again.");
        }
    };

    render() {
        const { packages, selected, loading, showPayment, selectedPkg } = this.state;

        if (showPayment && selectedPkg) {
            return (
                <Payment
                    isOpen={true}
                    toggle={() => this.setState({ showPayment: false, selectedPkg: null })}
                    amount={selectedPkg.price}
                    currency={selectedPkg.currency}
                    packageId={selectedPkg.id}
                    paymentType="candidate_boost"
                    onPaymentSuccess={this.handlePaymentSuccess}
                />
            );
        }

        return (
            <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 9999, padding: "16px",
            }}>
                <div style={{
                    background: "#36454F", borderRadius: "16px", padding: "32px 24px",
                    width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto",
                }}>
                    <div style={{ textAlign: "center", marginBottom: "24px" }}>
                        <h5 style={{ color: "#fff", margin: "0 0 6px", fontSize: "20px", fontWeight: 600 }}>
                            Choose a Boost Plan
                        </h5>
                        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", margin: 0 }}>
                            Select a plan — pay — admin will activate your boost
                        </p>
                    </div>
                    {packages.length === 0 ? (
                        <div style={{
                            textAlign: "center", padding: "32px", background: "rgba(255,255,255,0.1)",
                            borderRadius: "12px", color: "rgba(255,255,255,0.6)", fontSize: "13px",
                        }}>
                            No boost packages available at the moment.
                        </div>
                    ) : (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${Math.min(packages.length, 3)}, 1fr)`,
                            gap: "14px", marginBottom: "20px",
                        }}>
                            {packages.map((pkg) => {
                                const isSelected = selected === pkg.id;
                                const isPopular = pkg.is_featured === 1;
                                const duration = pkg.pricing_model === "featured_boost"
                                    ? `${pkg.boost_duration_days || 7} days`
                                    : `${pkg.duration_days || 30} days`;
                                const features = pkg.description ? pkg.description.split("\n").filter(Boolean) : [];

                                return (
                                    <div
                                        key={pkg.id}
                                        onClick={() => this.setState({ selected: pkg.id, selectedPkg: pkg })}
                                        style={{
                                            background: "#fff", borderRadius: "14px", overflow: "hidden",
                                            border: isSelected ? "2.5px solid #F59E0B" : isPopular ? "2px solid #5B9BD5" : "2px solid transparent",
                                            cursor: "pointer", transition: "transform 0.2s",
                                            transform: isSelected ? "translateY(-6px)" : "none", position: "relative",
                                        }}
                                    >
                                        {isPopular && (
                                            <div style={{
                                                position: "absolute", top: 0, right: "12px",
                                                background: "#5B9BD5", color: "#fff", fontSize: "10px", fontWeight: 600,
                                                padding: "2px 10px", borderRadius: "0 0 8px 8px",
                                            }}>Most popular</div>
                                        )}
                                        <div style={{ textAlign: "center", paddingTop: "14px" }}>
                                            <span style={{
                                                display: "inline-block", background: "#F59E0B", color: "#fff",
                                                fontSize: "11px", fontWeight: 500, padding: "3px 14px", borderRadius: "0 0 8px 8px",
                                            }}>Profile Spotlight</span>
                                        </div>
                                        <div style={{ padding: "12px 18px 20px" }}>
                                            <p style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937", margin: "0 0 3px" }}>{pkg.name}</p>
                                            {pkg.boost_type && (
                                                <div style={{ marginBottom: "8px" }}>
                                                    <span style={{
                                                        display: "inline-flex", alignItems: "center", gap: "5px",
                                                        background: "#eff6ff", color: "#1e40af", fontSize: "11px", fontWeight: 600,
                                                        padding: "3px 10px", borderRadius: "20px", border: "1px solid #bfdbfe",
                                                    }}>
                                                        {pkg.boost_type === "profile_top" && "⬆ Top of Search Results"}
                                                        {pkg.boost_type === "highlighted_profile" && "✦ Highlighted Profile"}
                                                        {pkg.boost_type === "recruiter_spotlight" && "🎯 Recruiter Spotlight"}
                                                    </span>
                                                </div>
                                            )}
                                            <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 14px" }}>{duration} · one-time payment</p>
                                            <div style={{ display: "flex", alignItems: "baseline", gap: "3px", marginBottom: "16px" }}>
                                                <span style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>{pkg.currency}</span>
                                                <span style={{ fontSize: "32px", fontWeight: 700, color: "#1f2937", lineHeight: 1 }}>{Number(pkg.price).toFixed(0)}</span>
                                            </div>
                                            {features.length > 0 && (
                                                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: "7px" }}>
                                                    {features.map((f, i) => (
                                                        <li key={i} style={{ fontSize: "12px", color: "#374151", display: "flex", alignItems: "center", gap: "7px" }}>
                                                            <span style={{
                                                                width: "16px", height: "16px", borderRadius: "50%",
                                                                background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                            }}>
                                                                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                                                    <path d="M2 5l2 2 4-4" stroke="#065f46" strokeWidth="1.5" strokeLinecap="round" />
                                                                </svg>
                                                            </span>
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {isSelected && (
                                                <div style={{
                                                    textAlign: "center", fontSize: "11px", fontWeight: 600,
                                                    color: "#92400e", background: "#fef3c7", borderRadius: "6px", padding: "4px", marginBottom: "8px",
                                                }}>✓ Selected</div>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    this.setState({ selected: pkg.id, selectedPkg: pkg, showPayment: true });
                                                }}
                                                style={{
                                                    width: "100%", padding: "9px", border: "none", borderRadius: "8px",
                                                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                                    background: isPopular ? "#F59E0B" : "#36454F",
                                                    color: isPopular ? "#78350f" : "#fff",
                                                }}
                                            >Buy now</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div style={{ textAlign: "center" }}>
                        <button
                            onClick={this.props.onClose}
                            style={{
                                background: "transparent", color: "#fff",
                                border: "1px solid #fff", borderRadius: "8px",
                                padding: "8px 24px", fontSize: "13px", cursor: "pointer",
                            }}
                        >Cancel</button>
                    </div>
                </div>
            </div>
        );
    }
}

export default CandidateWallet;
