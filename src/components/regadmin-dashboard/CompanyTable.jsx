import React from "react";
import { Card, CardBody, CardHeader } from "reactstrap";

const PRICING_MODELS = ["all", "job_slot", "cv_credits", "duration_bundle", "daily_budget", "per_apply", "featured_boost"];
const STATUSES       = ["all", "active", "expired", "used", "cancelled"];

const MODEL_LABELS = {
  job_slot:        "Job Slot",
  cv_credits:      "CV Credits",
  duration_bundle: "Duration Bundle",
  daily_budget:    "Daily Budget",
  per_apply:       "Per Apply",
  featured_boost:  "Featured Boost",
};

const healthConfig = {
  ok:       { bg: "#d1fae5", color: "#065f46", label: "Healthy" },
  warning:  { bg: "#fef3c7", color: "#92400e", label: "Warning" },
  critical: { bg: "#fee2e2", color: "#991b1b", label: "Critical" },
  inactive: { bg: "#f3f4f6", color: "#6b7280", label: "Inactive" },
};

const SortIcon = ({ col, sort, order }) => {
  if (sort !== col) return <span style={{ color: "#d1d5db", marginLeft: "4px" }}>↕</span>;
  return <span style={{ color: "#36565f", marginLeft: "4px" }}>{order === "ASC" ? "↑" : "↓"}</span>;
};

const CompanyTable = ({
  data = [], loading,
  page, total_pages,
  search, pricing_model, status, sort, order,
  onSearch, onFilter, onSort, onPage, onRowClick,
}) => {

  const thStyle = (col) => ({
    padding: "10px 14px", fontSize: "11px", fontWeight: 600,
    color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em",
    background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
  });

  const tdStyle = {
    padding: "12px 14px", fontSize: "13px", color: "#374151",
    borderBottom: "1px solid #f3f4f6", verticalAlign: "middle",
  };

  return (
    <Card style={{ border: "1px solid #e5e7eb", borderRadius: "14px" }}>
      <CardHeader style={{
        background: "#fff", borderBottom: "1px solid #f3f4f6",
        borderRadius: "14px 14px 0 0", padding: "14px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>Company Revenue</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>Paginated subscription table</div>
          </div>

          {/* search */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "#f9fafb", border: "1px solid #e5e7eb",
            borderRadius: "10px", padding: "7px 12px", minWidth: "220px",
          }}>
            <span style={{ color: "#9ca3af" }}>🔍</span>
            <input
              type="text"
              placeholder="Search company, phone..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: "13px", color: "#374151", width: "100%",
              }}
            />
            {search && (
              <span onClick={() => onSearch("")} style={{ cursor: "pointer", color: "#9ca3af" }}>✕</span>
            )}
          </div>
        </div>

        {/* filters row */}
        <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {/* pricing model filter */}
          <select
            value={pricing_model || "all"}
            onChange={(e) => onFilter("pricing_model", e.target.value === "all" ? "" : e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: "8px", fontSize: "12px",
              border: "1px solid #e5e7eb", background: "#fff", color: "#374151",
              cursor: "pointer",
            }}
          >
            {PRICING_MODELS.map((m) => (
              <option key={m} value={m}>{m === "all" ? "All Models" : MODEL_LABELS[m] || m}</option>
            ))}
          </select>

          {/* status filter */}
          <select
            value={status || "all"}
            onChange={(e) => onFilter("status", e.target.value === "all" ? "" : e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: "8px", fontSize: "12px",
              border: "1px solid #e5e7eb", background: "#fff", color: "#374151",
              cursor: "pointer",
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardBody style={{ padding: 0, overflowX: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af", fontSize: "13px" }}>
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af", fontSize: "13px" }}>
            No companies found
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  { label: "Company",        col: "company_name" },
                  { label: "Package",        col: null },
                  { label: "Model",          col: "pricing_model" },
                  { label: "Status",         col: null },
                  { label: "Health",         col: null },
                  { label: "Consumption",    col: null },
                  { label: "Days Left",      col: "end_date" },
                  { label: "Revenue",        col: "revenue" },
                  { label: "Paid At",        col: "paid_at" },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    style={thStyle(col)}
                    onClick={() => col && onSort(col)}
                  >
                    {label}
                    {col && <SortIcon col={col} sort={sort} order={order} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const health = healthConfig[row.health] || healthConfig.ok;
                const con    = row.consumption || {};

                return (
                  <tr
                    key={i}
                    onClick={() => onRowClick && onRowClick(row.account_id)}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Company */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{row.company_name}</div>
                      {row.phone && <div style={{ fontSize: "11px", color: "#9ca3af" }}>{row.phone}</div>}
                      {row.city && <div style={{ fontSize: "11px", color: "#9ca3af" }}>{row.city}, {row.country}</div>}
                    </td>

                    {/* Package */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: "12px", color: "#374151" }}>{row.package_name || "—"}</div>
                    </td>

                    {/* Model */}
                    <td style={tdStyle}>
                      <span style={{
                        background: "#e8f0f2", color: "#36565f",
                        borderRadius: "20px", padding: "3px 9px",
                        fontSize: "11px", fontWeight: 600,
                      }}>
                        {MODEL_LABELS[row.pricing_model] || row.pricing_model}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span style={{
                        background: row.sub_status === "active" ? "#d1fae5" : "#f3f4f6",
                        color: row.sub_status === "active" ? "#065f46" : "#6b7280",
                        borderRadius: "20px", padding: "3px 9px",
                        fontSize: "11px", fontWeight: 600, textTransform: "capitalize",
                      }}>
                        {row.sub_status}
                      </span>
                    </td>

                    {/* Health */}
                    <td style={tdStyle}>
                      <span style={{
                        background: health.bg, color: health.color,
                        borderRadius: "20px", padding: "3px 9px",
                        fontSize: "11px", fontWeight: 600,
                      }}>
                        {health.label}
                      </span>
                    </td>

                    {/* Consumption bar */}
                    <td style={{ ...tdStyle, minWidth: "120px" }}>
                      {con.total > 0 ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280", marginBottom: "3px" }}>
                            <span>{con.used}/{con.total} {con.unit}</span>
                            <span>{con.pct}%</span>
                          </div>
                          <div style={{ height: "5px", background: "#f3f4f6", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: "999px",
                              width: `${Math.min(con.pct, 100)}%`,
                              background: con.pct >= 90 ? "#ef4444" : con.pct >= 70 ? "#f59e0b" : "#36565f",
                              transition: "width 0.3s",
                            }} />
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#d1d5db" }}>—</span>
                      )}
                    </td>

                    {/* Days left */}
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: "12px", fontWeight: 600,
                        color: row.days_remaining <= 3 ? "#ef4444"
                          : row.days_remaining <= 7 ? "#f59e0b"
                          : "#374151",
                      }}>
                        {row.days_remaining != null ? `${row.days_remaining}d` : "—"}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: "#111827", fontSize: "13px" }}>
                        PKR {Number(row.revenue).toLocaleString()}
                      </div>
                      {row.payment_method && (
                        <div style={{ fontSize: "10px", color: "#9ca3af" }}>{row.payment_method}</div>
                      )}
                    </td>

                    {/* Paid at */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        {row.paid_at ? new Date(row.paid_at).toLocaleDateString() : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total_pages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "6px", padding: "16px", borderTop: "1px solid #f3f4f6",
          }}>
            <button
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
              style={{
                padding: "5px 12px", borderRadius: "8px", border: "1px solid #e5e7eb",
                background: "#fff", fontSize: "12px", cursor: page <= 1 ? "not-allowed" : "pointer",
                color: page <= 1 ? "#d1d5db" : "#374151",
              }}
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(total_pages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPage(p)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    border: "1px solid", fontSize: "12px", cursor: "pointer",
                    borderColor: page === p ? "#36565f" : "#e5e7eb",
                    background: page === p ? "#36565f" : "#fff",
                    color: page === p ? "#fff" : "#374151",
                    fontWeight: page === p ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => onPage(page + 1)}
              disabled={page >= total_pages}
              style={{
                padding: "5px 12px", borderRadius: "8px", border: "1px solid #e5e7eb",
                background: "#fff", fontSize: "12px",
                cursor: page >= total_pages ? "not-allowed" : "pointer",
                color: page >= total_pages ? "#d1d5db" : "#374151",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default CompanyTable;