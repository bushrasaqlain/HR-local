import React, { useState, useEffect, useRef } from "react";

const CandidateJobAlertsDropdown = ({ userId, apiBaseUrl, onViewAlert }) => {
    const [open, setOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, [userId]);

    const fetchAlerts = async () => {
        if (!userId) return;
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(
                `${apiBaseUrl}candidateProfile/job-alerts`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                const allAlerts = data.data || [];
                setAlerts(allAlerts.filter(a => !a.is_read));
                setUnreadCount(data.unread_count || 0);
            }
        } catch (err) {
            console.error("Job alerts fetch error:", err);
        }
    };

    const markAllRead = async () => {
        try {
            const token = sessionStorage.getItem("token");
            await fetch(`${apiBaseUrl}candidateProfile/job-alerts/read-all`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Mark all read error:", err);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000 / 60);
        if (diff < 1) return "Just now";
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const formatSalary = (min, max, currency) => {
        if (!min && !max) return null;
        const code = currency || "PKR";
        if (min && max) return `${code} ${min.toLocaleString()} - ${max.toLocaleString()}`;
        if (min) return `${code} ${min.toLocaleString()}+`;
        return null;
    };

    // Bell click: just open/close dropdown (no mark-all-read on open)
    const handleBellClick = () => {
        setOpen((prev) => !prev);
    };

    // Individual alert click: open the full alerts page with that alert pre-selected
    const handleAlertClick = (alert) => {
        setOpen(false);
        if (onViewAlert) onViewAlert(alert);
    };

    // "View all" click: open alerts page without pre-selection
    const handleViewAll = () => {
        setOpen(false);
        if (onViewAlert) onViewAlert(null);
    };

    return (
        <div style={{ position: "relative" }} ref={ref}>
            {/* Bell Icon */}
            <button
                onClick={handleBellClick}
                style={{
                    position: "relative",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "7px 9px",
                    borderRadius: 8,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                <i className="las la-bell fs-2 text-white"></i>
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            background: "#e74c3c",
                            color: "#fff",
                            borderRadius: "50%",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            minWidth: "16px",
                            height: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 3px",
                            lineHeight: 1,
                        }}
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    {/* Click-away overlay */}
                    <div
                        onClick={() => setOpen(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
                    />

                    <div
                        style={{
                            position: "fixed",        
                            top: "60px",              
                            left: "8px",            
                            right: "8px",             
                            width: "auto",            
                            maxWidth: "380px",        
                            marginLeft: "auto",       
                            background: "#fff",
                            borderRadius: "10px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                            border: "1px solid #e0e0e0",
                            zIndex: 9999,
                            overflow: "hidden",
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #f0f0f0",
                                background: "#f9fafb",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span style={{ fontWeight: 700, fontSize: 14, color: "#222", display: "flex", alignItems: "center", gap: 6 }}>
                                Job Alerts
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            background: "#e74c3c",
                                            color: "#fff",
                                            borderRadius: "10px",
                                            fontSize: "10px",
                                            padding: "1px 7px",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {unreadCount} new
                                    </span>
                                )}
                            </span>
                            {unreadCount > 0 && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "#36565f",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                    }}
                                    onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                                >
                                    Mark all read
                                </span>
                            )}
                        </div>

                        {/* Alerts List */}
                        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                            {alerts.length === 0 ? (
                                <div
                                    style={{
                                        textAlign: "center",
                                        color: "#999",
                                        padding: "30px 20px",
                                        fontSize: 13,
                                    }}
                                >
                                    <i
                                        className="las la-bell-slash"
                                        style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}
                                    ></i>
                                    No job alerts yet.
                                    <br />
                                    <small>Complete your profile to get notified about matching jobs!</small>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.alert_id}
                                        onClick={() => handleAlertClick(alert)}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 10,
                                            padding: "10px 14px",
                                            cursor: "pointer",
                                            borderBottom: "0.5px solid #f5f5f5",
                                            background: !alert.is_read ? "#edf6f7" : "transparent",
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f5f5")}
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background = !alert.is_read ? "#edf6f7" : "transparent")
                                        }
                                    >
                                        {/* Company Initial */}
                                        <div
                                            style={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: "8px",
                                                background: "#36565f",
                                                color: "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 15,
                                                fontWeight: 700,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {alert.company_name ? alert.company_name.charAt(0).toUpperCase() : "J"}
                                        </div>

                                        {/* Alert Info */}
                                        <div style={{ flex: 1, overflow: "hidden" }}>
                                            <p style={{
                                                fontSize: 11,
                                                color: "#36565f",
                                                fontWeight: 600,
                                                margin: "0 0 3px 0",
                                                background: "#e8f0f2",
                                                display: "inline-block",
                                                padding: "1px 7px",
                                                borderRadius: "10px",
                                            }}>
                                                🔔 New job matches your profile
                                            </p>

                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}>
                                                <span style={{
                                                    fontSize: 13,
                                                    fontWeight: !alert.is_read ? 700 : 500,
                                                    color: "#111",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    maxWidth: "180px",
                                                }}>
                                                    {alert.job_title}
                                                </span>
                                                <span style={{ fontSize: 11, color: "#aaa", flexShrink: 0 }}>
                                                    {formatTime(alert.sent_at)}
                                                </span>
                                            </div>

                                            <p style={{
                                                fontSize: 12,
                                                color: "#555",
                                                margin: "2px 0 0 0",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}>
                                                {alert.company_name || "Company"}
                                                {alert.city_name ? ` • ${alert.city_name}` : ""}
                                                {alert.job_type ? ` • ${alert.job_type}` : ""}
                                            </p>

                                            {formatSalary(alert.min_salary, alert.max_salary, alert.currency) && (
                                                <p style={{
                                                    fontSize: 11,
                                                    color: "#36565f",
                                                    margin: "3px 0 0 0",
                                                    fontWeight: 600,
                                                }}>
                                                    💰 {formatSalary(alert.min_salary, alert.max_salary, alert.currency)}
                                                </p>
                                            )}

                                            <p style={{
                                                fontSize: 11,
                                                color: "#aaa",
                                                margin: "4px 0 0 0",
                                                fontStyle: "italic",
                                            }}>
                                                Tap to view details →
                                            </p>
                                        </div>

                                        {!alert.is_read && (
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                background: "#e74c3c",
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                                marginTop: 6,
                                            }} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer — View All */}
                        <div style={{
                            padding: "9px 16px",
                            borderTop: "1px solid #e5e7eb",
                            background: "#f9fafb",
                            display: "flex",
                            justifyContent: "center",
                        }}>
                            <button
                                onClick={handleViewAll}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 12,
                                    color: "#36565f",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    fontWeight: 700,
                                    padding: 0,
                                }}
                            >
                                View all job alerts →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CandidateJobAlertsDropdown;
