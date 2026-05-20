import React from "react";
import axios from "axios";

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEVERITY = {
  critical: { color: "#ef4444", bg: "#fef2f2", badge: "#fee2e2", label: "Critical" },
  warning:  { color: "#f59e0b", bg: "#fffbeb", badge: "#fef3c7", label: "Warning"  },
  info:     { color: "#36565f", bg: "#eff6ff", badge: "#dbeafe", label: "Info"     },
};
const sev  = (s) => SEVERITY[s] || SEVERITY.info;
const TYPE_ICON = {
  low_credits: "⚡", expiry: "⏰", expired: "🚫",
  budget_threshold: "💰", unusual_spending: "📊",
  payment_missing: "💳", daily_digest: "📋",
};
const icon = (t) => TYPE_ICON[t] || "🔔";
const isRead  = (n) => n.is_read === true || n.is_read === 1;

const fmtRel = (ts) => {
  const m = Math.floor((Date.now() - new Date(ts)) / 60_000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const fmtFull = (ts) =>
  new Date(ts).toLocaleString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const normalize = (list) =>
  (list || []).map((n) => ({ ...n, is_read: isRead(n) }));

// ─────────────────────────────────────────────────────────────────────────────
// Bell + Dropdown  (default export — goes in topbar)
// Clicking "View all →" fires window event "openNotifications"
// Clicking a single item fires "openNotifications" AND passes the id so the
// page can auto-select that notification.
// ─────────────────────────────────────────────────────────────────────────────
function NotificationCenter({ userId, apiBaseUrl }) {
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount,   setUnreadCount]   = React.useState(0);
  const [showDropdown,  setShowDropdown]  = React.useState(false);
  const [loading,       setLoading]       = React.useState(false);
  const pollRef = React.useRef(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = React.useCallback(async (silent = false) => {
    if (!userId || !apiBaseUrl) return;
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}alert-settings/notifications/${userId}`);
      if (res.data.success) {
        const list = normalize(res.data.data.notifications);
        setNotifications(list);
        setUnreadCount(
          res.data.data.unreadCount ?? list.filter((n) => !n.is_read).length
        );
      }
    } catch (err) {
      console.error("Notification fetch error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, apiBaseUrl]);

  React.useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(() => fetchNotifications(true), 60_000);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  // ── mark single read (optimistic) ─────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await axios.put(`${apiBaseUrl}alert-settings/notifications/${userId}/${id}/read`);
    } catch { fetchNotifications(true); }
  };

  // ── open dropdown ──────────────────────────────────────────────────────────
  const handleBellClick = () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next) fetchNotifications(true);
  };

  // ── click a single notification in the dropdown ────────────────────────────
  // marks it read + opens the full inline page with that item pre-selected
const handleItemClick = (n) => {
  console.log("Item clicked, dispatching openNotifications", n.id);
  if (!n.is_read) markRead(n.id);
  setShowDropdown(false);
  window.dispatchEvent(
    new CustomEvent("openNotifications", { detail: { selectedId: n.id } })
  );
};

const handleViewAll = () => {
  console.log("View all clicked, dispatching openNotifications");
  setShowDropdown(false);
  window.dispatchEvent(new CustomEvent("openNotifications", { detail: {} }));
};

  // preview = first 5 notifications
  const preview = notifications.slice(0, 5);

  return (
    <div style={{ position: "relative" }}>
      {/* ── Bell button ── */}
      <button
        onClick={handleBellClick}
        title="Notifications"
       style={{
  position: "relative",
  background: showDropdown ? "#f0f0f0" : "transparent",
  border: "none",
  cursor: "pointer",
  padding: "7px 9px",
  borderRadius: 8,
  lineHeight: 1,
  transition: "background 0.15s",
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  flexGrow: 0,
  zIndex: 101,        /* ← add this */
  WebkitTapHighlightColor: "transparent",  /* ← fixes iOS tap issues */
}}
      >
        <i className="las la-bell fs-2 text-white"></i>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            background: "#ef4444", color: "#fff",
            fontSize: 9, fontWeight: 800,
            padding: "1px 5px", borderRadius: 10,
            minWidth: 16, textAlign: "center", lineHeight: "14px",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <>
          {/* click-away */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{ position: "fixed", inset: 0, zIndex: 998 }}
          />

          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
           width: "min(360px, calc(100vw - 20px))",
maxWidth: "calc(100vw - 20px)", background: "#fff", borderRadius: 12,
            boxShadow: "0 10px 30px -5px rgba(0,0,0,0.15)",
            zIndex: 999, overflow: "hidden",
            border: "1px solid #e5e7eb",
            display: "flex", flexDirection: "column",
          }}>
            {/* header */}
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: 10, background: "#ef4444", color: "#fff",
                    padding: "1px 7px", borderRadius: 12, fontWeight: 700,
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => { fetchNotifications(true); }}
                style={{
                  fontSize: 11, color: "#6b7280", background: "none",
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                ↻
              </button>
            </div>

            {/* list */}
            <div style={{ overflowY: "auto", maxHeight: 320 }}>
              {loading ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  Loading…
                </div>
              ) : preview.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                  No notifications yet
                </div>
              ) : (
                preview.map((n) => {
                  const s = sev(n.severity);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      style={{
                        padding: "11px 16px",
                        borderBottom: "1px solid #f3f4f6",
                        background: n.is_read ? "#fff" : "#fffbeb",
                        cursor: "pointer",
                        transition: "background 0.12s",
                        display: "flex", gap: 10, alignItems: "flex-start",
                      }}
                    >
                      {/* icon */}
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: s.badge, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 14, flexShrink: 0,
                      }}>
                        {icon(n.notification_type)}
                      </div>

                      {/* text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12.5,
                          fontWeight: n.is_read ? 500 : 700,
                          color: "#111827", marginBottom: 2,
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", lineHeight: 1.35,
                        }}>
                          {n.title}
                        </div>
                        <div style={{
                          fontSize: 11, color: "#9ca3af",
                          display: "flex", gap: 6, alignItems: "center",
                        }}>
                          <span>{fmtRel(n.created_at)}</span>
                          <span style={{
                            padding: "1px 5px", borderRadius: 4,
                            fontSize: 9, fontWeight: 700,
                            background: s.badge, color: s.color,
                            textTransform: "uppercase",
                          }}>
                            {s.label}
                          </span>
                        </div>
                      </div>

                      {/* unread dot */}
                      {!n.is_read && (
                        <div style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: "#2164f3", flexShrink: 0, marginTop: 5,
                        }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* footer */}
            <div style={{
              padding: "9px 16px",
              borderTop: "1px solid #e5e7eb",
              background: "#f9fafb",
              display: "flex", justifyContent: "center",
            }}>
              <button
                onClick={handleViewAll}
                style={{
                  background: "none", border: "none",
                  fontSize: 12, color: "#36565f",
                  cursor: "pointer", fontFamily: "inherit",
                  fontWeight: 700, padding: 0,
                }}
              >
                View all notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationCenter;

// ─────────────────────────────────────────────────────────────────────────────
// Full inline Notifications page
// Render this inside CompanyWallet when activeTab === "notifications"
//
//  {activeTab === "notifications" && (
//    <NotificationsPage
//      userId={this.userId}
//      apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
//      onTabChange={(tab) => this.setState({ activeTab: tab })}
//      initialSelectedId={this.state.notifSelectedId}   // optional
//    />
//  )}
// ─────────────────────────────────────────────────────────────────────────────
const dropdownStyle = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  width: "min(360px, calc(100vw - 24px))",   // ← never wider than screen
  maxHeight: "min(500px, calc(100vh - 120px))", // ← never taller than viewport
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 10px 30px -5px rgba(0,0,0,0.15)",
  zIndex: 999,
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
};

// ── FIX 2 ──────────────────────────────────────────────────────────
// In NotificationsPage — the outlook panel:
// The panel has a hardcoded left column width of 300px and
// height: "calc(100vh - 260px)" which breaks on mobile.
// Replace the outer panel div style with:
const outlookPanelStyle = {
  background: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: 10,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",       // ← default: stack on mobile
  minHeight: 460,
};
// Then add this CSS class approach or use a state+resize trick.
// The simplest fix is: on small screens, show list then detail stacked.
// Here is the full replacement for NotificationsPage with mobile support:

export function NotificationsPage({ userId, apiBaseUrl, onTabChange, initialSelectedId }) {
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount,   setUnreadCount]   = React.useState(0);
  const [loading,       setLoading]       = React.useState(true);
  const [selected,      setSelected]      = React.useState(null);
  const [filter,        setFilter]        = React.useState("all");
  // NEW: track whether we're showing detail on mobile
  const [mobileShowDetail, setMobileShowDetail] = React.useState(false);
  // NEW: detect mobile
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── fetch ────────────────────────────────────────────────────────
  const fetchNotifications = React.useCallback(async (silent = false) => {
    if (!userId || !apiBaseUrl) return;
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}alert-settings/notifications/${userId}`);
      if (res.data.success) {
        const list = normalize(res.data.data.notifications);
        setNotifications(list);
        setUnreadCount(
          res.data.data.unreadCount ?? list.filter((n) => !n.is_read).length
        );
        setSelected((prev) => {
          if (prev) return prev;
          const target =
            (initialSelectedId && list.find((n) => n.id === initialSelectedId)) ||
            list.find((n) => !n.is_read) ||
            list[0] ||
            null;
          return target;
        });
      }
    } catch (err) {
      console.error("NotificationsPage fetch error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, apiBaseUrl, initialSelectedId]);

  React.useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── mark read ───────────────────────────────────────────────────
  const markRead = async (n) => {
    if (n.is_read) return;
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await axios.put(`${apiBaseUrl}alert-settings/notifications/${userId}/${n.id}/read`);
    } catch { fetchNotifications(true); }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await axios.put(`${apiBaseUrl}alert-settings/notifications/${userId}/read-all`);
    } catch { fetchNotifications(true); }
  };

  const selectNotification = (n) => {
    setSelected({ ...n, is_read: true });
    markRead(n);
    if (isMobile) setMobileShowDetail(true); // ← on mobile, switch to detail view
  };

  const visible = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  // ── Detail panel content (shared between layouts) ────────────────
  const DetailPanel = () => {
    if (!selected) return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        color: "#9ca3af", gap: 12, padding: 32, minHeight: 300,
      }}>
        <span style={{ fontSize: 48 }}>📭</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Select a notification to read it</span>
        <span style={{ fontSize: 12 }}>Your alerts will appear here</span>
      </div>
    );

    const s = sev(selected.severity);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto" }}>
        {/* mobile back button */}
        {isMobile && (
          <button
            onClick={() => setMobileShowDetail(false)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "12px 16px", background: "#f9fafb",
              border: "none", borderBottom: "1px solid #e5e7eb",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: "#36565f", fontFamily: "inherit", width: "100%",
            }}
          >
            ← Back to list
          </button>
        )}
        {/* detail top */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{
            display: "flex", gap: 8, marginBottom: 12,
            alignItems: "center", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 24 }}>{icon(selected.notification_type)}</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 12px", borderRadius: 12, fontSize: 11,
              fontWeight: 700, background: s.badge, color: s.color,
              textTransform: "uppercase",
            }}>
              {s.label}
            </span>
            {selected.package_name && (
              <span style={{
                fontSize: 12, background: "#f3f4f6", color: "#374151",
                padding: "4px 12px", borderRadius: 12, fontWeight: 600,
                border: "1px solid #e5e7eb",
              }}>
                📦 {selected.package_name}
              </span>
            )}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: "#111827",
            marginBottom: 6, lineHeight: 1.35,
            wordBreak: "break-word",
          }}>
            {selected.title}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {fmtFull(selected.created_at)}
          </div>
        </div>

        {/* detail body */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          <div style={{
            background: s.bg, border: `1px solid ${s.badge}`,
            borderRadius: 8, padding: "14px 16px",
            fontSize: 14, color: "#374151", lineHeight: 1.75,
            wordBreak: "break-word",
          }}>
            {selected.message}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af",
              marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              Details
            </div>
            {[
              { label: "Type",     value: (selected.notification_type || "—").replace(/_/g, " ") },
              { label: "Package",  value: selected.package_name || "—" },
              {
                label: "Severity",
                value: (
                  <span style={{
                    padding: "2px 10px", borderRadius: 12, fontSize: 11,
                    fontWeight: 700, background: s.badge, color: s.color,
                  }}>
                    {s.label}
                  </span>
                ),
              },
              { label: "Received", value: fmtFull(selected.created_at) },
              {
                label: "Status",
                value: selected.is_read
                  ? <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Read</span>
                  : <span style={{ color: "#f59e0b",  fontWeight: 700 }}>● Unread</span>,
              },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13,
                gap: 8, flexWrap: "wrap",
              }}>
                <span style={{ color: "#6b7280", fontWeight: 500 }}>{row.label}</span>
                <span style={{ color: "#111827", fontWeight: 600, textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {(selected.notification_type === "low_credits" ||
              selected.notification_type === "expiry" ||
              selected.notification_type === "expired") && (
              <button
                onClick={() => onTabChange && onTabChange("packages")}
                style={{
                  padding: "10px 20px", borderRadius: 6, fontSize: 13,
                  fontWeight: 700, border: "none", cursor: "pointer",
                  background: "#36565f", color: "#fff", fontFamily: "inherit",
                }}
              >
                🛒 Buy More Packages
              </button>
            )}
            {selected.notification_type === "payment_missing" && (
              <button
                onClick={() => {
                  if (onTabChange) onTabChange("overview");
                  window.dispatchEvent(new CustomEvent("walletAddCard"));
                }}
                style={{
                  padding: "10px 20px", borderRadius: 6, fontSize: 13,
                  fontWeight: 700, border: "none", cursor: "pointer",
                  background: "#36565f", color: "#fff", fontFamily: "inherit",
                }}
              >
                💳 Add Payment Method
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── List panel content ───────────────────────────────────────────
  const ListPanel = () => (
    <div style={{
      width: isMobile ? "100%" : 300,
      borderRight: isMobile ? "none" : "1px solid #e5e7eb",
      display: "flex", flexDirection: "column",
      flexShrink: 0, background: "#fafafa",
    }}>
      {/* filter tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        {["all", "unread"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: "10px 4px", fontSize: 12,
            fontWeight: filter === f ? 700 : 500,
            color: filter === f ? "#2164f3" : "#6b7280",
            background: "none", border: "none",
            borderBottom: filter === f ? "2px solid #2164f3" : "2px solid transparent",
            cursor: "pointer", fontFamily: "inherit",
            marginBottom: -1, transition: "all 0.12s",
          }}>
            {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* items */}
      <div style={{ overflowY: "auto", flex: 1, maxHeight: isMobile ? "60vh" : undefined }}>
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
            Loading…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </div>
        ) : (
          visible.map((n) => {
            const s    = sev(n.severity);
            const isSel = selected?.id === n.id;
            return (
              <div
                key={n.id}
                onClick={() => selectNotification(n)}
                style={{
                  padding: "13px 14px",
                  borderBottom: "1px solid #f0f0f0",
                  borderLeft: isSel && !isMobile ? "3px solid #36565f" : "3px solid transparent",
                  background: isSel && !isMobile ? "#e8f0f2" : n.is_read ? "#fff" : "#fffbeb",
                  cursor: "pointer", transition: "background 0.12s",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: s.badge, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>
                  {icon(n.notification_type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: n.is_read ? 500 : 700,
                    color: "#111827", lineHeight: 1.35, marginBottom: 3,
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    fontSize: 11.5, color: "#6b7280", marginBottom: 4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#9ca3af", display: "flex", gap: 6, alignItems: "center" }}>
                    <span>{fmtRel(n.created_at)}</span>
                    <span style={{
                      padding: "1px 5px", borderRadius: 4, fontSize: 9,
                      background: s.badge, color: s.color,
                      fontWeight: 700, textTransform: "uppercase",
                    }}>
                      {s.label}
                    </span>
                  </div>
                </div>
                {!n.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#36565f", flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      margin: isMobile ? "16px 12px" : "24px 32px",
      fontFamily: "'Nunito Sans', ui-sans-serif, sans-serif",
    }}>
      {/* page heading */}
   <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16,
  flexWrap: "wrap",
  gap: 10,
  position: "relative",  /* ← add */
  zIndex: 10,            /* ← add */
}}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#1a1a1a" }}>
            Notifications
          </div>
          <div style={{ fontSize: 13, color: "#767676", marginTop: 2 }}>
            Alerts and updates for your packages
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{
            background: "#fff", border: "1.5px solid #d4d4d4",
            borderRadius: 4, padding: "7px 14px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            color: "#595959", fontFamily: "inherit",
          }}>
            Mark all read
          </button>
        )}
      </div>

      {/* outlook panel — side-by-side on desktop, stacked on mobile */}
      <div style={{
        background: "#fff", border: "1px solid #e0e0e0",
        borderRadius: 10, overflow: "hidden",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: isMobile ? undefined : 460,
        height: isMobile ? undefined : "calc(100vh - 280px)",
      }}>
        {/* On mobile: show either list OR detail, not both */}
        {isMobile ? (
          mobileShowDetail ? <DetailPanel /> : <ListPanel />
        ) : (
          <>
            <ListPanel />
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <DetailPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}