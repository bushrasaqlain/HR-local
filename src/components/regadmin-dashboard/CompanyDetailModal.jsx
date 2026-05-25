import React from "react";

const MODEL_LABELS = {
  job_slot:        "Job Slot",
  cv_credits:      "CV Credits",
  duration_bundle: "Duration Bundle",
  daily_budget:    "Daily Budget",
  per_apply:       "Per Apply",
  featured_boost:  "Featured Boost",
};

const statusColor = {
  active:    { bg: "#d1fae5", color: "#065f46" },
  expired:   { bg: "#fee2e2", color: "#991b1b" },
  used:      { bg: "#f3f4f6", color: "#374151" },
  cancelled: { bg: "#fef3c7", color: "#92400e" },
};

const CompanyDetailModal = ({ data, onClose }) => {
  if (!data) return null;

  const { subscriptions = [], total_spent, account_id } = data;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "16px",
          width: "100%", maxWidth: "720px",
          maxHeight: "88vh", overflowY: "auto",
          position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
          borderRadius: "16px 16px 0 0",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>
              Company Revenue Detail
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Account #{account_id} · {subscriptions.length} subscription{subscriptions.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Total Spent</div>
              <div style={{ fontWeight: 700, fontSize: "18px", color: "#36565f" }}>
                PKR {Number(total_spent).toLocaleString()}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "#fee2e2", border: "none", borderRadius: "50%",
                width: "34px", height: "34px", cursor: "pointer",
                color: "#991b1b", fontWeight: 700, fontSize: "16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Subscription cards */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {subscriptions.map((sub, i) => {
            const sc = statusColor[sub.sub_status] || statusColor.used;
            const con = sub.consumption || {};

            return (
              <div
                key={i}
                style={{
                  border: "1px solid #e5e7eb", borderRadius: "12px",
                  padding: "16px 18px", background: "#fafafa",
                }}
              >
                {/* sub header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>
                        {sub.package_name || "—"}
                      </span>
                      <span style={{
                        ...sc, borderRadius: "20px", padding: "2px 9px",
                        fontSize: "11px", fontWeight: 600, textTransform: "capitalize",
                      }}>
                        {sub.sub_status}
                      </span>
                      <span style={{
                        background: "#e8f0f2", color: "#36565f",
                        borderRadius: "20px", padding: "2px 9px", fontSize: "11px", fontWeight: 600,
                      }}>
                        {MODEL_LABELS[sub.pricing_model] || sub.pricing_model}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>
                      {sub.start_date
                        ? new Date(sub.start_date).toLocaleDateString()
                        : "—"}{" "}
                      → {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "—"}
                      {sub.days_remaining != null && (
                        <span style={{
                          marginLeft: "8px",
                          color: sub.days_remaining <= 3 ? "#ef4444"
                            : sub.days_remaining <= 7 ? "#f59e0b"
                            : "#6b7280",
                          fontWeight: 600,
                        }}>
                          ({sub.days_remaining}d left)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>
                      PKR {Number(sub.revenue).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {sub.payment_method} · {sub.paid_at ? new Date(sub.paid_at).toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>

                {/* consumption */}
                {con.total > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                      <span>{con.used} / {con.total} {con.unit} used</span>
                      <span style={{
                        fontWeight: 700,
                        color: con.pct >= 90 ? "#ef4444" : con.pct >= 70 ? "#f59e0b" : "#065f46",
                      }}>
                        {con.pct}%
                      </span>
                    </div>
                    <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(con.pct, 100)}%`,
                        borderRadius: "999px",
                        background: con.pct >= 90 ? "#ef4444" : con.pct >= 70 ? "#f59e0b" : "#36565f",
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>
                      {con.remaining} {con.unit} remaining
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailModal;