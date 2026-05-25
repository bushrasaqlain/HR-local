import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "reactstrap";

const severityConfig = {
  critical: {
    bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444",
    badge: { bg: "#fee2e2", color: "#991b1b" },
    label: "Critical",
  },
  warning: {
    bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b",
    badge: { bg: "#fef3c7", color: "#92400e" },
    label: "Warning",
  },
};

const typeIcon = { expiry: "⏰", consumption: "📊" };

const AlertsPanel = ({ alerts = [], onViewCompany }) => {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? alerts
    : alerts.filter((a) => a.severity === filter);

  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning  = alerts.filter((a) => a.severity === "warning").length;

  return (
    <Card style={{ border: "1px solid #e5e7eb", borderRadius: "14px" }}>
      <CardHeader style={{
        background: "#fff", borderBottom: "1px solid #f3f4f6",
        borderRadius: "14px 14px 0 0", padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "10px",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>
            Admin Alerts
            {alerts.length > 0 && (
              <span style={{
                marginLeft: "8px", background: "#fee2e2", color: "#991b1b",
                borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: 700,
              }}>
                {alerts.length}
              </span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>
            {critical} critical · {warning} warning
          </div>
        </div>

        {/* filter tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "critical", "warning"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 12px", borderRadius: "20px",
                fontSize: "11px", fontWeight: 600, cursor: "pointer",
                border: "1px solid",
                borderColor: filter === f ? "#36565f" : "#e5e7eb",
                background: filter === f ? "#36565f" : "#fff",
                color: filter === f ? "#fff" : "#6b7280",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardBody style={{ padding: "12px 16px", maxHeight: "320px", overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#9ca3af", fontSize: "13px" }}>
            {filter === "all" ? "🎉 No alerts right now" : `No ${filter} alerts`}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map((alert, i) => {
              const cfg = severityConfig[alert.severity] || severityConfig.warning;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    borderRadius: "10px", padding: "10px 14px",
                  }}
                >
                  {/* severity dot */}
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: cfg.dot, flexShrink: 0,
                  }} />

                  {/* icon */}
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>
                    {typeIcon[alert.type] || "⚠️"}
                  </span>

                  {/* info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                        {alert.company_name}
                      </span>
                      <span style={{
                        ...cfg.badge, borderRadius: "20px",
                        padding: "1px 7px", fontSize: "10px", fontWeight: 600,
                      }}>
                        {cfg.label}
                      </span>
                      <span style={{
                        background: "#f3f4f6", color: "#6b7280",
                        borderRadius: "20px", padding: "1px 7px", fontSize: "10px",
                      }}>
                        {alert.pricing_model}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                      {alert.message}
                    </div>
                    {alert.phone && (
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                        📞 {alert.phone}
                      </div>
                    )}
                  </div>

                  {/* revenue */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                      PKR {Number(alert.revenue).toLocaleString()}
                    </div>
                    <button
                      onClick={() => onViewCompany && onViewCompany(alert.account_id)}
                      style={{
                        background: "none", border: "none",
                        color: "#36565f", fontSize: "11px",
                        fontWeight: 600, cursor: "pointer", padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      View →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default AlertsPanel;