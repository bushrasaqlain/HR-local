"use client";
import React, { Component } from "react";
import axios from "axios";
import Head from "next/head";

/* ═══════════════════════════════════════════════════════════════
   COLOUR SYSTEM
═══════════════════════════════════════════════════════════════ */
const THEME = {
  bg: "#F5F4F0",
  surface: "#FFFFFF",
  border: "rgba(0,0,0,0.09)",
  borderHover: "rgba(0,0,0,0.18)",
  text: "#111110",
  muted: "#888884",
  accent: "#1A56DB",
  accentLight: "#EBF2FF",
  accentMid: "#3B82F6",
  featured: "#0F172A",
  featuredText: "#F8FAFC",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
  rose: "#E11D48",
  roseLight: "#FFF1F2",
  teal: "#0D9488",
  tealLight: "#F0FDFA",
};

/* ═══════════════════════════════════════════════════════════════
   PURCHASE STATE LOGIC
   ─────────────────────────────────────────────────────────────
   "available"  → can be bought right now
   "locked"     → visible but needs a base package active first
   "info_only"  → display only, no purchase (set during job posting)
   "blocked"    → single-post bundle, shown greyed out
═══════════════════════════════════════════════════════════════ */
const getPurchaseState = (pkg, wallet) => {
  const model = pkg.pricing_model;

  const allActive = [

    ...(wallet?.activeJobSlots || []),
    ...(wallet?.activeCvCredits || []),
    ...(wallet?.activeDailyBudgets || []),
    ...(wallet?.activeFeaturedBoosts || []),
  ];

  const isOwned = allActive.some(p => String(p.package?.id) === String(pkg.id));

  if (isOwned) {
    const match = allActive.find(p => String(p.package?.id) === String(pkg.id));

    if (pkg.pricing_model === "cv_credits") {
      const totalCredits = match?.package?.credit_count || 0;
      const usedCredits = match?.used_credits || 0;
      if (totalCredits > 0 && usedCredits >= totalCredits) return "expired";
    }

    if (pkg.pricing_model === "job_slot") {
      const snapshot = match?.package || {};
      const totalSlots = snapshot.slot_count || 0;
      const usedSlots = match?.used_slots || 0;
      if (totalSlots > 0 && usedSlots >= totalSlots) return "expired";
    }

    if (pkg.pricing_model === "duration_bundle") {
      const snapshot = match?.package || {};
      const totalPosts = snapshot.num_posts || 0;
      const usedPosts = match?.used_posts || 0;
      if (totalPosts > 0 && usedPosts >= totalPosts) return "expired";
    }

    if (match?.end_date && new Date(match.end_date) < new Date()) {
      return "expired";
    }

    if (match?.status?.toLowerCase() === "expired") {
      return "expired";
    }

    return "owned";
  }

  if (model === "duration_bundle" && (pkg.num_posts === 1 || pkg.num_posts == null))
    return "blocked";

  if (model === "daily_budget" || model === "per_apply") return "info_only";

  if (model === "job_slot") {
    return "available";
  }

  if (model === "featured_boost") {
    const hasAnyActive =
      (wallet?.activeJobSlots?.length || 0) > 0 ||
      (wallet?.activeCvCredits?.length || 0) > 0 ||
      (wallet?.activeDailyBudgets?.length || 0) > 0;
    return hasAnyActive ? "available" : "locked";
  }

  return "available";
};
/* ═══════════════════════════════════════════════════════════════
   MODEL CONFIG
═══════════════════════════════════════════════════════════════ */
const MODEL_CONFIG = {
  job_slot: {
    label: "Job Slot",
    accent: THEME.purple,
    light: THEME.purpleLight,
    icon: "▣",
    ctaLabel: "Get Slots",
    infoOnly: false,
  },
  cv_credits: {
    label: "CV Credits",
    accent: THEME.rose,
    light: THEME.roseLight,
    icon: "⬟",
    ctaLabel: "Buy Credits",
    infoOnly: false,
  },
  daily_budget: {
    label: "Per-Job Campaign",
    accent: THEME.success,
    light: THEME.successLight,
    icon: "◎",
    ctaLabel: null,
    infoOnly: true,
  },
  featured_boost: {
    label: "Boost",
    accent: "#EA580C",
    light: "#FFF7ED",
    icon: "▲",
    ctaLabel: "Add Boost",
    infoOnly: false,
  },
};

const getModelConfig = (model) =>
  MODEL_CONFIG[model] || {
    label: model || "Plan",
    accent: THEME.accent,
    light: THEME.accentLight,
    icon: "◆",
    ctaLabel: "Select Plan",
    infoOnly: false,
  };

/* ═══════════════════════════════════════════════════════════════
   SECTION META
═══════════════════════════════════════════════════════════════ */
const SECTION_META = {

  job_slot: {
    title: "Job Slot Subscriptions",
    subtitle: "Keep N live job slots active simultaneously — swap roles anytime",
    tag: null,
  },
  cv_credits: {
    title: "CV Credit Packs",
    subtitle: "Unlock candidate profiles on demand — credits never expire",
    tag: null,
  },
  daily_budget: {
    title: "Budget Campaigns",
    subtitle: "Set a daily spend cap and pay per View, impression, or apply — configured when posting a job",
    tag: "ℹ Available at job posting",
  },

  featured_boost: {
    title: "Featured Boost Add-ons",
    subtitle: "Top placement, homepage feature, or email blast — add to any active job",
    tag: null,
  },
};

/* ═══════════════════════════════════════════════════════════════
   SECTION ORDER
═══════════════════════════════════════════════════════════════ */
const SECTION_ORDER = [
  "job_slot",
  "cv_credits",
  "daily_budget",
  "featured_boost",
];

/* ═══════════════════════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════════════════════ */
const Icon = ({ d, size = 16 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const CheckIcon = ({ color }) => (
  <span style={{
    width: 18, height: 18, borderRadius: "50%",
    background: color + "22",
    display: "inline-flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, marginTop: 1,
  }}>
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"
      stroke={color} strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,5 4,7 8,3" />
    </svg>
  </span>
);

const InfoIcon = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" />
    <line x1="12" y1="12" x2="12" y2="16" />
  </svg>
);

const CardIcon = () => <Icon size={18} d="M2 5h20v14H2zM2 10h20" />;
// const QrIcon    = () => <Icon size={18} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM19 14v3M17 19h3M14 19v2" />;
// const BankIcon  = () => <Icon size={18} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11" />;
const CloseIcon = () => <Icon size={16} d="M18 6L6 18M6 6l12 12" />;

/* ═══════════════════════════════════════════════════════════════
   QR PLACEHOLDER
═══════════════════════════════════════════════════════════════ */
// const QRPlaceholder = ({ amount, currency }) => (
//   <svg viewBox="0 0 200 200" width="156" height="156"
//     xmlns="http://www.w3.org/2000/svg"
//     style={{ display: "block", margin: "0 auto" }}>
//     <rect width="200" height="200" fill="#fff" rx="8" />
//     <rect x="12" y="12" width="52" height="52" rx="4" fill="none" stroke="#111" strokeWidth="5" />
//     <rect x="24" y="24" width="28" height="28" rx="2" fill="#111" />
//     <rect x="136" y="12" width="52" height="52" rx="4" fill="none" stroke="#111" strokeWidth="5" />
//     <rect x="148" y="24" width="28" height="28" rx="2" fill="#111" />
//     <rect x="12" y="136" width="52" height="52" rx="4" fill="none" stroke="#111" strokeWidth="5" />
//     <rect x="24" y="148" width="28" height="28" rx="2" fill="#111" />
//     {[80, 92, 104, 116, 128].map((x, i) =>
//       [80, 92, 104, 116, 128].map((y, j) =>
//         (i + j) % 2 === 0
//           ? <rect key={`${i}-${j}`} x={x} y={y} width="8" height="8" rx="1" fill="#111" />
//           : null
//       )
//     )}
//     <rect x="136" y="92" width="8" height="8" rx="1" fill="#111" />
//     <rect x="148" y="80" width="8" height="8" rx="1" fill="#111" />
//     <rect x="160" y="92" width="8" height="8" rx="1" fill="#111" />
//     <rect x="148" y="104" width="8" height="8" rx="1" fill="#111" />
//     <rect x="136" y="128" width="8" height="8" rx="1" fill="#111" />
//     <text x="100" y="190" textAnchor="middle" fontSize="11" fill="#777" fontFamily="system-ui">
//       {currency} {Number(amount).toLocaleString()}
//     </text>
//   </svg>
// );

/* ═══════════════════════════════════════════════════════════════
   CARD BADGES
═══════════════════════════════════════════════════════════════ */
const CardBadges = ({ cardNumber = "" }) => {
  const clean = cardNumber.replace(/\s/g, "");
  let type = null;
  if (/^4/.test(clean)) type = "visa";
  else if (/^5[1-5]/.test(clean)) type = "mastercard";
  else if (/^3[47]/.test(clean)) type = "amex";
  else if (/^62/.test(clean)) type = "unionpay";
  else if (/^220[0-4]/.test(clean)) type = "paypak";

  const cards = [
    { id: "visa", src: "/images/visa.png" },
    { id: "mastercard", src: "/images/master.png" },
    { id: "unionpay", src: "/images/unionpay.png" },
    { id: "paypak", src: "/images/paypak_card.png" },
    { id: "1link", src: "/images/1link.png" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
      {cards.map(c => (
        <div key={c.id} style={{
          padding: "4px 8px", borderRadius: 6, background: "#fff",
          border: type === c.id
            ? `1.5px solid ${THEME.accent}`
            : "1px solid rgba(0,0,0,0.09)",
          opacity: type ? (type === c.id ? 1 : 0.35) : 1,
          transition: "all 0.15s",
        }}>
          <img src={c.src} alt={c.id}
            style={{ height: 20, objectFit: "contain", display: "block" }} />
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FIELD
═══════════════════════════════════════════════════════════════ */
const Field = ({ label, placeholder, type = "text", value, onChange, half }) => (
  <div style={{ flex: half ? "1 1 calc(50% - 6px)" : "1 1 100%", minWidth: 0 }}>
    <label style={{
      display: "block", fontSize: 11, fontWeight: 600, color: THEME.muted,
      marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {label}
    </label>
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      autoComplete="new-password"
      style={{
        width: "100%", padding: "0.62rem 0.85rem",
        border: `1px solid ${THEME.border}`, borderRadius: 8,
        fontSize: 14, color: THEME.text, background: "#FAFAF9",
        outline: "none", boxSizing: "border-box",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onFocus={e => {
        e.target.style.borderColor = THEME.accent;
        e.target.style.boxShadow = `0 0 0 3px ${THEME.accentLight}`;
      }}
      onBlur={e => {
        e.target.style.borderColor = THEME.border;
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   PACKAGE DETAILS — schema-accurate per pricing_model
═══════════════════════════════════════════════════════════════ */
const PackageDetails = ({ pkg }) => {
  const cfg = getModelConfig(pkg.pricing_model);

  const Tag = ({ children }) => (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20,
      background: cfg.light, color: cfg.accent,
      marginRight: 6, marginBottom: 6,
    }}>
      {children}
    </span>
  );

  switch (pkg.pricing_model) {

    case "duration_bundle":
      return (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>
            {pkg.name}
          </p>
          <p style={{ fontSize: 12, color: THEME.muted, marginBottom: 10, lineHeight: 1.5 }}>
            {pkg.num_posts} job posts &middot; {pkg.duration_days} days active each
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {pkg.bundle_validity_days && (
              <Tag>Activate within {pkg.bundle_validity_days} days</Tag>
            )}
            {pkg.include_views ? <Tag>View analytics</Tag> : null}
            {pkg.include_featured_slot ? <Tag>Featured slot</Tag> : null}
            {pkg.include_analytics ? <Tag>Advanced analytics</Tag> : null}
          </div>
        </div>
      );

    case "cv_credits":
      return (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>
            {pkg.name}
          </p>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: cfg.accent }}>
              {pkg.credit_count}
            </span>
            <span style={{ fontSize: 12, color: THEME.muted, marginLeft: 6 }}>credits</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {pkg.credit_expiry_days
              ? <Tag>Expire in {pkg.credit_expiry_days} days</Tag>
              : <Tag>Never expires</Tag>
            }
            {pkg.unlock_scope && <Tag>Unlocks {pkg.unlock_scope} profile</Tag>}
            {pkg.tier2_credits && <Tag>+{pkg.tier2_credits} bonus at tier 2</Tag>}
          </div>
        </div>
      );

    case "daily_budget":
      return (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>
            {pkg.name}
          </p>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: cfg.accent }}>
              {pkg.currency} {Number(pkg.rate_per_unit || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: THEME.muted, marginLeft: 4 }}>
              {pkg.billing_model === "cpc"
                ? "/ click"
                : pkg.billing_model === "cpm"
                  ? "/ 1k views"
                  : "/ View"}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {pkg.daily_budget_cap && (
              <Tag>Daily cap {pkg.currency} {Number(pkg.daily_budget_cap).toLocaleString()}</Tag>
            )}
            {pkg.min_daily_budget && (
              <Tag>Min {pkg.currency} {Number(pkg.min_daily_budget).toLocaleString()}/day</Tag>
            )}
            {pkg.campaign_duration_days && (
              <Tag>{pkg.campaign_duration_days}-day campaign</Tag>
            )}
            {pkg.sponsor_to_top ? <Tag>Top placement</Tag> : null}
            {pkg.email_blast ? <Tag>Email blast</Tag> : null}
          </div>
        </div>
      );

    case "per_apply":
      return (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>
            {pkg.name}
          </p>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: cfg.accent }}>
              {pkg.currency} {Number(pkg.cost_per_apply || 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: THEME.muted, marginLeft: 4 }}>/ application</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {pkg.max_applies && <Tag>Up to {pkg.max_applies} applies</Tag>}
            {pkg.budget_ceiling && (
              <Tag>Ceiling {pkg.currency} {Number(pkg.budget_ceiling).toLocaleString()}</Tag>
            )}
            {pkg.qualification_filter && (
              <Tag>{pkg.qualification_filter} applicants only</Tag>
            )}
          </div>
        </div>
      );

    case "job_slot":
      return (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>
            {pkg.name}
          </p>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: cfg.accent }}>
              {pkg.slot_count}
            </span>
            <span style={{ fontSize: 12, color: THEME.muted, marginLeft: 6 }}>
              simultaneous slot{pkg.slot_count !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {pkg.billing_cycle && <Tag>{pkg.billing_cycle} billing</Tag>}
            {pkg.price_per_slot && (
              <Tag>{pkg.currency} {Number(pkg.price_per_slot).toLocaleString()} / slot</Tag>
            )}
            {pkg.free_views_per_slot && (
              <Tag>{pkg.free_views_per_slot} free CV views / slot</Tag>
            )}
            {pkg.extra_view_charge && (
              <Tag>+{pkg.currency} {Number(pkg.extra_view_charge).toLocaleString()} per extra view</Tag>
            )}
            {pkg.swap_allowed !== 0 ? <Tag>Swap anytime</Tag> : <Tag>No swaps</Tag>}
          </div>
        </div>
      );

    case "featured_boost":
      return (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>
            {pkg.name}
          </p>
          <p style={{ fontSize: 12, color: THEME.muted, marginBottom: 10, lineHeight: 1.5 }}>
            {pkg.boost_duration_days
              ? `Boost active for ${pkg.boost_duration_days} days`
              : "One-time boost"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {pkg.boost_type === "top" && <Tag>Top of search results</Tag>}
            {pkg.boost_type === "highlighted" && <Tag>Highlighted listing</Tag>}
            {pkg.boost_type === "homepage" && <Tag>Homepage featured</Tag>}
            {pkg.boost_type === "email" && <Tag>Email blast</Tag>}
            {pkg.sponsor_to_top ? <Tag>Pinned to top</Tag> : null}
          </div>
        </div>
      );

    default:
      return (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 4 }}>
            {pkg.name}
          </p>
          <p style={{ fontSize: 12, color: THEME.muted }}>{pkg.pricing_model}</p>
        </div>
      );
  }
};

/* ═══════════════════════════════════════════════════════════════
   PACKAGE CARD
═══════════════════════════════════════════════════════════════ */
class PackageCard extends Component {
  state = { hovered: false };

  render() {
    const { pkg, onSelect, wallet } = this.props;
    const { hovered } = this.state;

    const purchaseState = getPurchaseState(pkg, wallet);
    const isBlocked = purchaseState === "blocked";
    const isLocked = purchaseState === "locked";
    const isInfoOnly = purchaseState === "info_only";
    const isAvailable = purchaseState === "available";
    const isOwned = purchaseState === "owned";
    const isExpired = purchaseState === "expired";

    const featured = pkg.is_featured === 1 && isAvailable;
    const cfg = getModelConfig(pkg.pricing_model);

    const features = pkg.description
      ? pkg.description.split("\n").map(l => l.trim()).filter(Boolean)
      : [];

    const priceDisplay = () => {
      const textColor = featured ? "#fff" : (isBlocked || isOwned) ? THEME.muted : THEME.text;
      const mutedColor = featured ? "rgba(255,255,255,0.5)" : THEME.muted;

      switch (pkg.pricing_model) {
        case "daily_budget": {
          const unit =
            pkg.billing_model === "cpc" ? "/click"
              : pkg.billing_model === "cpm" ? "/1k views"
                : "/ View";
          return (
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: mutedColor }}>{pkg.currency}</span>
              <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: textColor }}>
                {Number(pkg.rate_per_unit || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: 11, color: mutedColor }}>{unit}</span>
            </div>
          );
        }
        case "per_apply":
          return (
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: mutedColor }}>{pkg.currency}</span>
              <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: textColor }}>
                {Number(pkg.cost_per_apply || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: 11, color: mutedColor }}>/ View</span>
            </div>
          );
        case "cv_credits":
          return (
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: mutedColor }}>{pkg.currency}</span>
              <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: textColor }}>
                {Number(pkg.price || 0).toLocaleString()}
              </span>
            </div>
          );
        default:
          if (pkg.price == null)
            return <p style={{ fontSize: 13, color: mutedColor, marginBottom: 4 }}>Usage-based pricing</p>;
          return (
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: mutedColor }}>{pkg.currency}</span>
              <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: textColor }}>
                {Number(pkg.price).toLocaleString()}
              </span>
            </div>
          );
      }
    };

    const badgeBg = isExpired ? THEME.warningLight : isOwned ? THEME.successLight : isBlocked ? "#F1EFE8" : isInfoOnly ? cfg.light : isLocked ? THEME.warningLight : featured ? "rgba(255,255,255,0.12)" : cfg.light;

    const badgeColor = isExpired ? THEME.warning : isOwned ? THEME.success : isBlocked ? THEME.muted : isInfoOnly ? cfg.accent : isLocked ? THEME.warning : featured ? "#fff" : cfg.accent;

    const badgeIcon = isExpired ? "↻" : isOwned ? "✓" : isBlocked ? "✕" : isInfoOnly ? cfg.icon : isLocked ? "🔒" : cfg.icon;

    const badgeLabel = isExpired ? "Expired" : isOwned ? "Active" : isBlocked ? "Single post only" : isInfoOnly ? cfg.label : isLocked ? "Requires base package" : featured ? "Most Popular" : cfg.label;

    const cardBorder = () => {
      if (isExpired) return hovered ? `1.5px solid ${THEME.warning}55` : `1px solid ${THEME.warning}33`;
      if (isOwned) return `1.5px solid ${THEME.success}55`;
      if (isBlocked) return `1px solid ${THEME.border}`;
      if (isInfoOnly) return hovered ? `1.5px solid ${cfg.accent}44` : `1px solid ${THEME.border}`;
      if (isLocked) return hovered ? `1.5px solid ${THEME.warning}55` : `1px solid ${THEME.warning}33`;
      if (featured) return `2px solid ${THEME.featured}`;
      return hovered ? `1.5px solid ${cfg.accent}44` : `1px solid ${THEME.border}`;
    };

    const topBarColor = isExpired ? THEME.warning
      : isOwned ? THEME.success
        : isBlocked ? THEME.muted
          : isInfoOnly ? cfg.accent
            : isLocked ? THEME.warning
              : cfg.accent;

    return (
      <div
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
        style={{
          background: featured ? THEME.featured : THEME.surface,
          border: cardBorder(),
          borderRadius: 14,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
          boxShadow: hovered && !isBlocked && !isOwned
            ? featured
              ? "0 12px 40px rgba(0,0,0,0.22)"
              : `0 8px 24px ${cfg.accent}18`
            : isOwned
              ? `0 2px 12px ${THEME.success}18`
              : "0 1px 4px rgba(0,0,0,0.04)",
          transform: hovered && (isAvailable || isExpired) ? "translateY(-2px)" : "translateY(0)",
          opacity: isBlocked ? 0.55 : isExpired ? 0.85 : 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        {!featured && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: topBarColor, borderRadius: "14px 14px 0 0",
          }} />
        )}

        {/* Badge row */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14,
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700,
            padding: "3px 10px", borderRadius: 20,
            background: badgeBg, color: badgeColor, letterSpacing: 0.3,
          }}>
            <span style={{ fontSize: 13 }}>{badgeIcon}</span>
            {badgeLabel}
          </span>
          {featured && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase", letterSpacing: 0.8,
            }}>
              Featured
            </span>
          )}
        </div>

        {/* Price */}
        <div style={{ marginBottom: 2 }}>{priceDisplay()}</div>
        <p style={{
          fontSize: 12,
          color: featured ? "rgba(255,255,255,0.45)" : THEME.muted,
          marginBottom: "1.25rem",
        }}>
          {pkg.pricing_model === "duration_bundle" && "one-time payment"}
          {pkg.pricing_model === "cv_credits" && "per pack"}
          {pkg.pricing_model === "job_slot" && (pkg.billing_cycle || "subscription")}
        </p>

        <hr style={{
          border: "none",
          borderTop: featured
            ? "1px solid rgba(255,255,255,0.1)"
            : `1px solid ${THEME.border}`,
          margin: "0 0 1.25rem",
        }} />

        {/* Model-aware detail block */}
        <div style={{
          color: featured ? "rgba(255,255,255,0.85)" : THEME.text,
          flex: 1,
        }}>
          <PackageDetails pkg={pkg} />
        </div>

        {/* Feature list */}
        {features.length > 0 && (
          <ul style={{
            listStyle: "none", padding: 0, margin: "1rem 0 1.5rem",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {features.map((f, i) => (
              <li key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontSize: 12.5,
                color: featured
                  ? "rgba(255,255,255,0.75)"
                  : isBlocked ? THEME.muted : "#555",
                lineHeight: 1.45,
              }}>
                <CheckIcon color={
                  isOwned ? THEME.success
                    : isBlocked ? THEME.muted
                      : featured ? "#60A5FA"
                        : cfg.accent
                } />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* CTA BLOCK */}
        <div style={{ marginTop: "auto" }}>

          {/* OWNED */}
          {isOwned && (
            <>
              <div style={{
                padding: "0.65rem 1rem", borderRadius: 9,
                background: THEME.successLight,
                border: `1px solid ${THEME.success}33`,
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 15, color: THEME.success }}>✓</span>
                <p style={{ fontSize: 12, color: THEME.success, margin: 0, fontWeight: 600 }}>
                  Currently active — expires on{" "}
                  {(() => {
                    const allActive = [
                      ...(wallet?.activeDurationBundles || []),
                      ...(wallet?.activeCvCredits || []),
                      ...(wallet?.activeJobSlots || []),
                      ...(wallet?.activeFeaturedBoosts || []),
                    ];
                    const match = allActive.find(p => p.package?.id === pkg.id);
                    if (!match?.end_date) return "—";
                    return new Date(match.end_date).toLocaleDateString("en-PK", {
                      day: "numeric", month: "short", year: "numeric",
                    });
                  })()}
                </p>
              </div>
              <button disabled style={{
                width: "100%", padding: "0.7rem 1rem",
                borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                cursor: "not-allowed",
                border: `1.5px solid ${THEME.success}44`,
                background: THEME.successLight, color: THEME.success,
                opacity: 0.75,
              }}>
                ✓ Already owned
              </button>
            </>
          )}

          {/* EXPIRED — Renew */}
          {isExpired && (
            <>
              <div style={{
                padding: "0.65rem 1rem", borderRadius: 9,
                background: THEME.warningLight,
                border: `1px solid ${THEME.warning}33`,
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 15 }}>⚠</span>
                <p style={{ fontSize: 12, color: THEME.warning, margin: 0, fontWeight: 600 }}>
                  {pkg.pricing_model === "cv_credits"
                    ? "Your credits have been used up"
                    : pkg.pricing_model === "job_slot"
                      ? "All job slots are in use"
                      : pkg.pricing_model === "duration_bundle"
                        ? "All job posts have been used"
                        : "This package has expired"}
                </p>
              </div>
              <button
                onClick={() => onSelect(pkg)}
                style={{
                  width: "100%", padding: "0.7rem 1rem",
                  borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                  cursor: "pointer",
                  border: `1.5px solid ${THEME.warning}`,
                  background: hovered ? THEME.warningLight : "transparent",
                  color: THEME.warning,
                  transition: "all 0.15s",
                }}
              >
                ↻ Renew
              </button>
            </>
          )}

          {/* INFO ONLY */}
          {isInfoOnly && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: 9,
              background: cfg.light, border: `1px dashed ${cfg.accent}55`,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <InfoIcon color={cfg.accent} />
              <p style={{ fontSize: 12, color: cfg.accent, margin: 0, lineHeight: 1.55 }}>
                This billing option is available when you post a job. No upfront purchase needed.
              </p>
            </div>
          )}

          {/* BLOCKED */}
          {isBlocked && (
            <>
              <p style={{
                fontSize: 12, color: THEME.muted,
                fontStyle: "italic", marginBottom: 10, lineHeight: 1.5,
              }}>
                Single-post listings cannot be purchased directly. Choose a multi-post bundle instead.
              </p>
              <button disabled style={{
                width: "100%", padding: "0.7rem 1rem",
                borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                cursor: "not-allowed", opacity: 0.45,
                border: `1px solid ${THEME.border}`,
                background: "#F5F4F0", color: THEME.muted,
              }}>
                Not available
              </button>
            </>
          )}

          {/* LOCKED */}
          {isLocked && (
            <>
              <p style={{
                fontSize: 12, color: THEME.warning, marginBottom: 10, lineHeight: 1.55,
              }}>
                {pkg.pricing_model === "job_slot"
                  ? "Purchase a Job Bundle or CV Credits first to unlock slot subscriptions."
                  : "Purchase any base package first to unlock this boost add-on."}
              </p>
              <button disabled style={{
                width: "100%", padding: "0.7rem 1rem",
                borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                cursor: "not-allowed",
                border: `1.5px solid ${THEME.warning}66`,
                background: THEME.warningLight, color: THEME.warning,
              }}>
                🔒 Unlock first
              </button>
            </>
          )}

          {/* AVAILABLE */}
          {isAvailable && (
            <button
              onClick={() => onSelect(pkg)}
              style={{
                width: "100%", padding: "0.7rem 1rem",
                borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                cursor: "pointer",
                border: featured ? "none" : `1.5px solid ${cfg.accent}`,
                background: featured
                  ? `linear-gradient(135deg, ${cfg.accent} 0%, #3B82F6 100%)`
                  : hovered ? cfg.light : "transparent",
                color: featured ? "#fff" : cfg.accent,
                transition: "all 0.15s", letterSpacing: 0.2,
              }}
            >
              {cfg.ctaLabel}
            </button>
          )}
        </div>
      </div>
    );
  }
}
/* ═══════════════════════════════════════════════════════════════
   SECTION COMPONENT
═══════════════════════════════════════════════════════════════ */
const Section = ({ modelKey, packages, onSelect, wallet }) => {
  const meta = SECTION_META[modelKey] || { title: modelKey, subtitle: "", tag: null };
  const cfg = getModelConfig(modelKey);
  const isInfoSection = modelKey === "daily_budget" || modelKey === "per_apply";

  return (
    <div style={{ marginBottom: "3.5rem" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: "1.5rem" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: isInfoSection ? cfg.light + "aa" : cfg.light,
          color: cfg.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
          opacity: isInfoSection ? 0.8 : 1,
        }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{
              fontSize: 18, fontWeight: 700, color: THEME.text,
              margin: 0, letterSpacing: -0.3,
            }}>
              {meta.title}
            </h3>
            {/* Info badge for daily_budget / per_apply sections */}
            {meta.tag && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: "2px 10px", borderRadius: 20,
                background: cfg.light, color: cfg.accent,
                letterSpacing: 0.2,
              }}>
                {meta.tag}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: THEME.muted, margin: "4px 0 0" }}>
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 16,
      }}>
        {packages.map(pkg => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            wallet={wallet}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FILTER TABS
═══════════════════════════════════════════════════════════════ */
const FilterTabs = ({ models, active, onChange }) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "2.5rem" }}>
    {["All", ...models].map(m => {
      const isActive = m === active;
      const cfg = m === "All"
        ? { accent: THEME.text, light: "#EBEBEB" }
        : getModelConfig(m);
      const meta = SECTION_META[m];
      return (
        <button key={m} onClick={() => onChange(m)} style={{
          padding: "0.45rem 1rem", borderRadius: 20,
          fontSize: 12.5, fontWeight: isActive ? 700 : 500,
          border: isActive ? `1.5px solid ${cfg.accent}` : `1px solid ${THEME.border}`,
          background: isActive ? cfg.light : "transparent",
          color: isActive ? cfg.accent : THEME.muted,
          cursor: "pointer", transition: "all 0.15s",
        }}>
          {m === "All" ? "All Packages" : (meta?.title || m)}
        </button>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   PAYMENT MODAL
═══════════════════════════════════════════════════════════════ */
class PaymentModal extends Component {
  state = {
    paymentMethod: "card",        
    // ── saved card selection ──
    savedCards: [],
    savedCardsLoading: true,
    selectedSavedCardId: null,      
    showNewCardForm: false,      
    // ── new card fields ──
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    saveCard: false,
  };

  componentDidMount() {
    this.fetchSavedCards();
  }

  fetchSavedCards = async () => {
    const { userId } = this.props;
    if (!userId) {
      this.setState({ savedCardsLoading: false });
      return;
    }
    try {
      const APIBASEURL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await axios.get(`${APIBASEURL}payment/getsavedcards/${userId}`);
      const cards = res.data.cards || [];
      this.setState({
        savedCards: cards,
        savedCardsLoading: false,
        // auto-select first saved card
        selectedSavedCardId: cards.length > 0 ? cards[0].id : null,
        showNewCardForm: cards.length === 0,   // no saved card → show form immediately
      });
    } catch {
      this.setState({ savedCardsLoading: false, showNewCardForm: true });
    }
  };

  /* ── brand logo src ── */
  brandSrc = (brand) => {
    const map = {
      visa: "/images/visa.png",
      mastercard: "/images/master.png",
      amex: "/images/amex.png",
      unionpay: "/images/unionpay.png",
      paypak: "/images/paypak_card.png",
    };
    return map[(brand || "").toLowerCase()] || null;
  };

  /* ── method tab button ── */
  methodBtn(id, icon, label) {
    const active = this.state.paymentMethod === id;
    return (
      <button
        key={id}
        onClick={() => this.setState({ paymentMethod: id })}
        style={{
          flex: "1 1 0", padding: "0.7rem 0.4rem",
          borderRadius: 10, cursor: "pointer",
          border: active ? `2px solid ${THEME.accent}` : `1.5px solid ${THEME.border}`,
          background: active ? THEME.accentLight : "#FAFAF9",
          color: active ? THEME.accent : THEME.muted,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, fontSize: 12.5, fontWeight: active ? 700 : 400,
          transition: "all 0.15s",
        }}
      >
        {icon} {label}
      </button>
    );
  }

  /* ══════════════════════════════
     SAVED CARD SELECTOR
  ══════════════════════════════ */
  renderSavedCardSelector() {
    const {
      savedCards, selectedSavedCardId, showNewCardForm, savedCardsLoading,
    } = this.state;

    if (savedCardsLoading) {
      return (
        <div style={{ display: "flex", gap: 6, padding: "1rem 0", alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: THEME.accent,
              animation: "bounce 1.2s infinite ease-in-out",
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
          <span style={{ fontSize: 12, color: THEME.muted, marginLeft: 6 }}>Loading saved cards…</span>
          <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
        </div>
      );
    }

    return (
      <div>
        {/* ── SAVED CARDS LIST ── */}
        {savedCards.length > 0 && !showNewCardForm && (
          <div style={{ marginBottom: 16 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: "#bbb",
              marginBottom: 10, textTransform: "uppercase", letterSpacing: 1,
            }}>
              Saved cards
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedCards.map(card => {
                const selected = selectedSavedCardId === card.id;
                const logo = this.brandSrc(card.card_brand);
                return (
                  <div
                    key={card.id}
                    onClick={() => this.setState({ selectedSavedCardId: card.id })}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "0.75rem 1rem", borderRadius: 10, cursor: "pointer",
                      border: selected
                        ? `2px solid ${THEME.accent}`
                        : `1.5px solid ${THEME.border}`,
                      background: selected ? THEME.accentLight : "#FAFAF9",
                      transition: "all 0.15s",
                    }}
                  >
                    {/* Radio dot */}
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      border: selected
                        ? `5px solid ${THEME.accent}`
                        : `2px solid ${THEME.border}`,
                      background: "#fff",
                      transition: "border 0.15s",
                    }} />

                    {/* Brand logo */}
                    {logo && (
                      <div style={{
                        width: 40, padding: "2px 6px", borderRadius: 5,
                        background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <img src={logo} alt={card.card_brand}
                          style={{ height: 18, objectFit: "contain", display: "block" }} />
                      </div>
                    )}

                    {/* Card info */}
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: 600,
                        color: selected ? THEME.accent : THEME.text,
                      }}>
                        {(card.card_brand || "Card").charAt(0).toUpperCase() +
                          (card.card_brand || "card").slice(1)}&ensp;
                        •••• {card.card_last4}
                      </p>
                      {card.card_holder && (
                        <p style={{ margin: 0, fontSize: 11, color: THEME.muted }}>
                          {card.card_holder}
                        </p>
                      )}
                    </div>

                    {selected && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: THEME.accent,
                        background: THEME.accentLight,
                        padding: "2px 8px", borderRadius: 20,
                      }}>
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Use different card link */}
            <button
              onClick={() => this.setState({ showNewCardForm: true, selectedSavedCardId: null })}
              style={{
                marginTop: 12, background: "none", border: "none",
                color: THEME.accent, fontSize: 12.5, fontWeight: 600,
                cursor: "pointer", padding: 0, display: "flex",
                alignItems: "center", gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Use a different card
            </button>
          </div>
        )}

        {/* ── NEW CARD FORM ── */}
        {showNewCardForm && (
          <div>
            {savedCards.length > 0 && (
              <button
                onClick={() => this.setState({
                  showNewCardForm: false,
                  selectedSavedCardId: savedCards[0].id,
                })}
                style={{
                  marginBottom: 14, background: "none", border: "none",
                  color: THEME.muted, fontSize: 12, fontWeight: 500,
                  cursor: "pointer", padding: 0, display: "flex",
                  alignItems: "center", gap: 5,
                }}
              >
                ← Back to saved cards
              </button>
            )}
            {this.renderNewCardForm()}
          </div>
        )}
      </div>
    );
  }

  /* ── New card form (extracted so it can be reused) ── */
  renderNewCardForm() {
    const { cardName, cardNumber, cardExpiry, cardCvv, saveCard } = this.state;
    const isAmex = cardNumber.startsWith("34") || cardNumber.startsWith("37");
    return (
      <div>
        <CardBadges cardNumber={cardNumber} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Field label="Cardholder name" placeholder="Name on card"
            value={cardName} onChange={e => this.setState({ cardName: e.target.value })} />
          <Field label="Card number" placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 16);
              this.setState({ cardNumber: v.replace(/(.{4})/g, "$1 ").trim() });
            }} />
          <Field label="Expiry" placeholder="MM / YY" value={cardExpiry} half
            onChange={e => {
              let v = e.target.value.replace(/\D/g, "").slice(0, 4);
              if (v.length >= 3) v = v.slice(0, 2) + " / " + v.slice(2);
              this.setState({ cardExpiry: v });
            }} />
          <Field label="CVV" placeholder={isAmex ? "1234" : "123"} value={cardCvv} half
            onChange={e =>
              this.setState({ cardCvv: e.target.value.replace(/\D/g, "").slice(0, isAmex ? 4 : 3) })
            } />
          {/* Save card checkbox */}
          <div
            style={{
              flex: "1 1 100%", display: "flex", alignItems: "center",
              gap: 10, marginTop: 6, cursor: "pointer", userSelect: "none",
            }}
            onClick={() => this.setState({ saveCard: !saveCard })}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
              border: saveCard ? `2px solid ${THEME.accent}` : `1.5px solid ${THEME.border}`,
              background: saveCard ? THEME.accent : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {saveCard && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                  stroke="#fff" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,5 4,7 8,3" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 12.5, color: THEME.muted }}>
              Save this card for faster checkout next time
            </span>
          </div>
        </div>
      </div>
    );
  }

  // renderQr() {
  //   const { qrRef } = this.state;
  //   const { pkg } = this.props;
  //   return (
  //     <div style={{ textAlign: "center" }}>
  //       <p style={{ fontSize: 13, color: THEME.muted, marginBottom: 16 }}>
  //         Scan with <strong style={{ color: THEME.text }}>EasyPaisa</strong> or
  //         any QR-enabled banking app
  //       </p>
  //       <div style={{
  //         display: "inline-block", padding: 16,
  //         border: `1px solid ${THEME.border}`, borderRadius: 12,
  //         background: "#fff", marginBottom: 20,
  //       }}>
  //         <QRPlaceholder amount={pkg.price} currency={pkg.currency} />
  //       </div>
  //       <div style={{ maxWidth: 340, margin: "0 auto", textAlign: "left" }}>
  //         <Field label="Transaction reference" placeholder="e.g. EP-2024XXXXXXXX"
  //           value={qrRef} onChange={e => this.setState({ qrRef: e.target.value })} />
  //       </div>
  //     </div>
  //   );
  // }

  // renderBank() {
  //   const { bankRef } = this.state;
  //   return (
  //     <div>
  //       <div style={{
  //         background: "#F7F9FC",
  //         border: "1px solid rgba(55,138,221,0.18)",
  //         borderRadius: 10, padding: "1rem 1.2rem",
  //         marginBottom: 18, fontSize: 13,
  //       }}>
  //         <p style={{
  //           fontWeight: 700, marginBottom: 8, color: THEME.text,
  //           fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5,
  //         }}>
  //           Transfer to
  //         </p>
  //         {[
  //           ["Bank",    "Meezan Bank"],
  //           ["Account", "Your Company Pvt Ltd"],
  //           ["IBAN",    "PK36MEZN0001234567890123"],
  //           ["Branch",  "Islamabad Main"],
  //         ].map(([k, v]) => (
  //           <div key={k} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
  //             <span style={{ width: 80, color: THEME.muted, fontSize: 12 }}>{k}</span>
  //             <span style={{ color: THEME.text, fontWeight: 600, fontSize: 12 }}>{v}</span>
  //           </div>
  //         ))}
  //       </div>
  //       <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
  //         <Field label="Transaction / reference ID" placeholder="e.g. TRX-00123456"
  //           value={bankRef} onChange={e => this.setState({ bankRef: e.target.value })} />
  //         <div style={{ flex: "1 1 100%" }}>
  //           <label style={{
  //             display: "block", fontSize: 11, fontWeight: 600,
  //             color: THEME.muted, marginBottom: 5,
  //             textTransform: "uppercase", letterSpacing: 0.5,
  //           }}>
  //             Upload receipt (optional)
  //           </label>
  //           <input type="file" accept="image/*,application/pdf"
  //             onChange={e => this.setState({ bankReceipt: e.target.files[0] })}
  //             style={{ fontSize: 13, color: THEME.muted }} />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  /* ── Is the Pay button enabled? ── */
  canPay() {
    const { paymentMethod, selectedSavedCardId, showNewCardForm, cardNumber } = this.state;
    if (paymentMethod === "card") {
      // saved card selected OR new card has a number entered
      return selectedSavedCardId != null || (showNewCardForm && cardNumber.replace(/\s/g, "").length >= 13);
    }
    // if (paymentMethod === "qr")   return true;   // reference optional
    // if (paymentMethod === "bank") return true;
    return false;
  }

  render() {
    const { pkg, onClose, onSubmit } = this.props;
    const { paymentMethod } = this.state;
    const cfg = getModelConfig(pkg.pricing_model);

    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)", zIndex: 1000,
            backdropFilter: "blur(3px)",
          }}
        />

        {/* Modal */}
        <div style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 1001, background: "#fff", borderRadius: 18,
          padding: "2rem", width: "min(560px, 95vw)", maxHeight: "90vh",
          overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 22,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: cfg.light, color: cfg.accent,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 16,
                }}>
                  {cfg.icon}
                </span>
                <p style={{ fontSize: 17, fontWeight: 700, color: THEME.text, margin: 0 }}>
                  Complete payment
                </p>
              </div>
              <p style={{ fontSize: 13, color: THEME.muted, margin: 0, paddingLeft: 36 }}>
                {pkg.name} &nbsp;·&nbsp;
                <strong style={{ color: THEME.text }}>
                  {pkg.currency} {Number(pkg.price || 0).toLocaleString()}
                </strong>
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#F3F3F0", border: "none",
                cursor: "pointer", color: THEME.muted,
                display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
              }}
            >
              <CloseIcon />
            </button>
          </div>

          <hr style={{ border: "none", borderTop: `1px solid ${THEME.border}`, margin: "0 0 20px" }} />

          {/* Method tabs — ALWAYS shown */}
          <p style={{
            fontSize: 10, fontWeight: 700, color: "#bbb",
            marginBottom: 10, textTransform: "uppercase", letterSpacing: 1,
          }}>
            Payment method
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {this.methodBtn("card", <CardIcon />, "Card")}
            {/* {this.methodBtn("qr",   <QrIcon />,  "QR / EasyPaisa")}
            {this.methodBtn("bank", <BankIcon />, "Bank Transfer")} */}
          </div>

          {/* Method content */}
          {paymentMethod === "card" && this.renderSavedCardSelector()}
          {/* {paymentMethod === "qr"   && this.renderQr()} */}
          {/* {paymentMethod === "bank" && this.renderBank()} */}

          {/* Pay button — always rendered, disabled when can't pay */}
          <button
            onClick={() => this.canPay() && onSubmit({ ...this.state })}
            style={{
              marginTop: 24, width: "100%", padding: "0.9rem 1rem",
              borderRadius: 10, border: "none",
              background: this.canPay()
                ? `linear-gradient(135deg, ${cfg.accent} 0%, ${THEME.accentMid} 100%)`
                : "#E5E5E3",
              color: this.canPay() ? "#fff" : THEME.muted,
              fontSize: 15, fontWeight: 700,
              cursor: this.canPay() ? "pointer" : "not-allowed",
              boxShadow: this.canPay() ? `0 4px 18px ${cfg.accent}44` : "none",
              transition: "all 0.15s", letterSpacing: 0.2,
            }}
            onMouseEnter={e => { if (this.canPay()) e.currentTarget.style.opacity = "0.87"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Pay {pkg.currency} {Number(pkg.price || 0).toLocaleString()}
          </button>
        </div>
      </>
    );
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════════ */
class PricingPage extends Component {
  constructor(props) {
    super(props);
    this.APIBASEURL = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.state = {
      packages: [],
      loading: true,
      wallet: null,
      error: null,
      activeFilter: "All",
      userId: typeof window !== "undefined"
        ? sessionStorage.getItem("userId")
        : null,
      selectedPkg: null,
      showModal: false,
    };
  }

  componentDidMount() {
    this.loadPackages();
    this.loadUserPackages();
  }
  loadUserPackages = async () => {
    const { userId } = this.state;
    if (!userId) return;
    try {
      const res = await axios.get(`${this.APIBASEURL}job/getuserpackages/${userId}`);
      const packages = res.data;

      console.log("RAW packages:", packages); // ← add this

      const active = packages.filter(p => p.status?.toLowerCase() === "active");
      const expired = packages.filter(p =>
        p.status?.toLowerCase() === "expired" ||
        (p.end_date && new Date(p.end_date) < new Date())
      );
      const activeAndExpired = [...active, ...expired];
      console.log("CV Credits check:", activeAndExpired.filter(p => p.pricing_model === "cv_credits"));

      const wallet = {
        activeJobSlots: activeAndExpired.filter(p => p.pricing_model === "job_slot"),
        activeCvCredits: activeAndExpired.filter(p => p.pricing_model === "cv_credits"),
        activeDailyBudgets: active.filter(p => p.pricing_model === "daily_budget"),
        activePerApply: active.filter(p => p.pricing_model === "per_apply"),
        activeDurationBundles: activeAndExpired.filter(p => p.pricing_model === "duration_bundle"),
        activeFeaturedBoosts: active.filter(p => p.pricing_model === "featured_boost"),
      };

      console.log("WALLET:", wallet); // ← and this
      this.setState({ wallet });
    } catch (err) {
      console.error("Failed to load user packages", err);
    }
  };
  loadPackages = async () => {
    try {
      const res = await axios.get(`${this.APIBASEURL}packages/getallpackages`, {
        params: { status: "Active", package_type: "Company" },
      });
      const all = (res.data.packages || []).filter(
        p => (p.package_type || "").toLowerCase() === "company"
      );
      this.setState({ packages: all, loading: false });
    } catch {
      this.setState({ loading: false, error: "Failed to load packages. Please try again." });
    }
  };

  /* Groups packages by pricing_model, respects predefined section order */
  groupPackages = (packages) => {
    const map = {};
    for (const pkg of packages) {
      const key = pkg.pricing_model || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(pkg);
    }

    const sorted = {};
    for (const k of SECTION_ORDER) {
      if (map[k]) sorted[k] = map[k];
    }
    // Append any unknown models at the end
    for (const k of Object.keys(map)) {
      if (!sorted[k]) sorted[k] = map[k];
    }
    return sorted;
  };

  selectPackage = (pkg) => this.setState({ selectedPkg: pkg, showModal: true });
  closeModal = () => this.setState({ showModal: false, selectedPkg: null });

  submitPayment = async (formState) => {
    const { selectedPkg, userId } = this.state;
    if (!selectedPkg) return;

    const usingSavedCard = !formState.showNewCardForm && formState.selectedSavedCardId;

    try {
      await axios.post(
        `${this.APIBASEURL}payment/addpayment/${userId}`,
        {
          amount: selectedPkg.price,
          currency: selectedPkg.currency || "PKR",
          packageId: selectedPkg.id,
          jobId: null,
          reference: null,
          paymentDetails: {
            method: formState.paymentMethod,
            saveForLater: formState.saveCard,
            ...(usingSavedCard
              ? { savedCardId: formState.selectedSavedCardId }   // ← saved card path
              : {
                cardLast4: formState.cardNumber?.replace(/\s/g, "").slice(-4),
                cardName: formState.cardName,
              }
            ),
          },
        }
      );
      this.closeModal();
      this.loadUserPackages();
      if (this.props.onPaymentSuccess) this.props.onPaymentSuccess();
    } catch (err) {
      console.error("Payment failed", err);
    }
  };

  render() {
    const {
      packages, loading, error,
      activeFilter, selectedPkg, showModal, wallet
    } = this.state;
    // const { wallet } = this.props;

    const grouped = this.groupPackages(packages);
    const models = Object.keys(grouped);

    const filtered = activeFilter === "All"
      ? grouped
      : grouped[activeFilter]
        ? { [activeFilter]: grouped[activeFilter] }
        : {};

    const totalCount = packages.length;

    return (

      <div style={{
        minHeight: "100vh", background: THEME.bg,
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}>
        <Head>
          <title>View All Packages</title>
        </Head>
        {/* ── HERO ── */}
        <div style={{
          background: THEME.surface,
          borderBottom: `1px solid ${THEME.border}`,
          padding: "3rem 0 2.5rem",
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto",
            padding: "0 24px", textAlign: "center",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: THEME.accent,
              background: THEME.accentLight, padding: "4px 12px",
              borderRadius: 20, marginBottom: 18, letterSpacing: 0.3,
            }}>
              <span>◈</span> Company Packages
            </div>

            <h1 style={{
              fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800,
              color: THEME.text, margin: "0 0 12px",
              letterSpacing: -0.8, lineHeight: 1.15,
            }}>
              Hire smarter with the right plan
            </h1>
            <p style={{
              fontSize: 15.5, color: THEME.muted,
              maxWidth: 520, margin: "0 auto", lineHeight: 1.6,
            }}>
              From multi-job bundles to performance campaigns — pick what fits
              your hiring strategy.
            </p>

            {/* Wallet status strip — shows active packages */}
            {wallet && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 16,
                marginTop: "1.5rem", padding: "0.6rem 1.2rem",
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 20, fontSize: 12,
              }}>
                <span style={{ color: THEME.success, fontWeight: 700 }}>
                  ● Active packages
                </span>
                {(wallet.activeDurationBundles?.length || 0) > 0 && (
                  <span style={{ color: "#166534" }}>
                    {wallet.activeDurationBundles.length} Bundle{wallet.activeDurationBundles.length > 1 ? "s" : ""}
                  </span>
                )}
                {(wallet.activeCvCredits?.length || 0) > 0 && (
                  <span style={{ color: "#166534" }}>
                    {wallet.activeCvCredits.length} Credit Pack{wallet.activeCvCredits.length > 1 ? "s" : ""}
                  </span>
                )}
                {(wallet.activeDurationBundles?.length || 0) === 0 &&
                  (wallet.activeCvCredits?.length || 0) === 0 && (
                    <span style={{ color: THEME.muted }}>
                      No active base packages — buy a Bundle or Credits to unlock more
                    </span>
                  )}
              </div>
            )}

            {/* Stats bar */}
            {!loading && totalCount > 0 && (
              <div style={{
                display: "flex", justifyContent: "center",
                gap: "3rem", marginTop: "2rem",
              }}>
                {[
                  ["Active plans", totalCount],
                  ["Package types", models.length],
                  ["Payment options", 1],
                ].map(([label, val]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: THEME.text }}>
                      {val}
                    </div>
                    <div style={{
                      fontSize: 11, color: THEME.muted,
                      textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2,
                    }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "2.5rem 24px 5rem",
        }}>

          {/* Loading */}
          {loading && (
            <div style={{
              display: "flex", justifyContent: "center",
              alignItems: "center", padding: "6rem 0",
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: THEME.accent,
                    animation: "bounce 1.2s infinite ease-in-out",
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
              <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <p style={{ color: THEME.rose, fontSize: 15 }}>{error}</p>
              <button
                onClick={this.loadPackages}
                style={{
                  marginTop: 12, padding: "0.6rem 1.5rem",
                  borderRadius: 8, border: `1px solid ${THEME.border}`,
                  background: "#fff", cursor: "pointer", fontSize: 13,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && packages.length > 0 && (
            <>
              {/* Filter tabs */}
              {models.length > 1 && (
                <FilterTabs
                  models={models}
                  active={activeFilter}
                  onChange={f => this.setState({ activeFilter: f })}
                />
              )}

              {/* Sections */}
              {Object.entries(filtered).map(([modelKey, pkgs]) => (
                <Section
                  key={modelKey}
                  modelKey={modelKey}
                  packages={pkgs}
                  wallet={wallet}
                  onSelect={this.selectPackage}
                />
              ))}
            </>
          )}

          {/* Empty state */}
          {!loading && !error && packages.length === 0 && (
            <div style={{ textAlign: "center", padding: "6rem 0" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
              <p style={{ fontSize: 16, color: THEME.muted }}>
                No packages available at the moment.
              </p>
            </div>
          )}
        </div>

        {/* ── PAYMENT MODAL ── */}
        {showModal && selectedPkg && (
          <PaymentModal
            pkg={selectedPkg}
            userId={this.state.userId}
            onClose={this.closeModal}
            onSubmit={this.submitPayment}
          />
        )}
      </div>
    );
  }
}
export { PaymentModal };
export default PricingPage;