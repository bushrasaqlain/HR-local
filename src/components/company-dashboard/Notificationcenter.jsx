// ─── NotificationCenter ───────────────────────────────────────────────────────
// Drop-in replacement. Fetches from your backend instead of generating locally.
// Props: userId (string), apiBaseUrl (string)
//
// Usage in CompanyWallet topbar:
//   <NotificationCenter userId={this.userId} apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL} />

import React from "react";
import axios from "axios";

function NotificationCenter({ userId, apiBaseUrl }) {
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const pollRef = React.useRef(null);

  // ── Fetch from backend ──────────────────────────────────────────────────────
  const fetchNotifications = React.useCallback(async (silent = false) => {
    if (!userId || !apiBaseUrl) return;
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}alert-settings/notifications/${userId}`);
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, apiBaseUrl]);

  // ── Poll every 60 seconds for new alerts (matches your cron cadence) ────────
  React.useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(() => fetchNotifications(true), 60_000);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  // ── Open dropdown → mark-fetch so badge clears after reading ────────────────
  const handleOpen = () => {
    setShowDropdown((v) => !v);
    // Refresh list each time user opens the panel
    if (!showDropdown) fetchNotifications(true);
  };

  // ── Mark single as read ─────────────────────────────────────────────────────
  const markAsRead = async (notificationId) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await axios.put(
        `${apiBaseUrl}alert-settings/notifications/${userId}/${notificationId}/read`
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
      // Revert on failure
      fetchNotifications(true);
    }
  };

  // ── Mark all as read ────────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await axios.put(
        `${apiBaseUrl}alert-settings/notifications/${userId}/read-all`
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      fetchNotifications(true);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getSeverityColor = (severity) => ({
    critical: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  }[severity] || "#3b82f6");

  const getIcon = (type) => ({
    low_credits: "⚡",
    expiry: "⏰",
    expired: "🚫",
    budget_threshold: "💰",
    unusual_spending: "📊",
    payment_missing: "💳",
    daily_digest: "📋",
  }[type] || "🔔");

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts);
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "7px 9px",
          borderRadius: "8px",
          lineHeight: 1,
          transition: "background 0.15s",
          display: "flex",
          alignItems: "center",
        }}
      >
        <i className="las la-bell fs-2 text-white"></i>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "#ef4444",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              padding: "1px 5px",
              borderRadius: 10,
              minWidth: 16,
              textAlign: "center",
              lineHeight: "14px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {showDropdown && (
        <>
          {/* Click-away overlay */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 998,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 380,
              maxHeight: 500,
              background: "#fff",
              borderRadius: 12,
              boxShadow:
                "0 10px 25px -5px rgba(0,0,0,0.12), 0 4px 10px -5px rgba(0,0,0,0.04)",
              zIndex: 999,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: "1px solid #e5e7eb",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f9fafb",
                flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                Notifications
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "#ef4444",
                      color: "#fff",
                      padding: "1px 7px",
                      borderRadius: 12,
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    fontSize: 11,
                    color: "#2164f3",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#9e9e9e",
                    fontSize: 13,
                  }}
                >
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    color: "#9e9e9e",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f3f4f6",
                      background: n.is_read ? "#fff" : "#fffbeb",
                      cursor: n.is_read ? "default" : "pointer",
                      transition: "background 0.15s",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Icon bubble */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: `${getSeverityColor(n.severity)}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {getIcon(n.notification_type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: 2,
                          lineHeight: 1.3,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginBottom: 5,
                          lineHeight: 1.4,
                        }}
                      >
                        {n.message}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#9ca3af",
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <span>{formatTime(n.created_at)}</span>
                        {/* Severity pill */}
                        <span
                          style={{
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: `${getSeverityColor(n.severity)}18`,
                            color: getSeverityColor(n.severity),
                          }}
                        >
                          {n.severity}
                        </span>
                        {!n.is_read && (
                          <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                            ● unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer — refresh link */}
            <div
              style={{
                padding: "8px 16px",
                borderTop: "1px solid #e5e7eb",
                background: "#f9fafb",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => fetchNotifications()}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 11,
                  color: "#6b7280",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationCenter;