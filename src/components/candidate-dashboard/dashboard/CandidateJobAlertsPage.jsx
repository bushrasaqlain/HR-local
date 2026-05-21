import React from "react";

const SEVERITY = {
    high: { color: "#ef4444", bg: "#fef2f2", badge: "#fee2e2", label: "High Match" },
    medium: { color: "#f59e0b", bg: "#fffbeb", badge: "#fef3c7", label: "Good Match" },
    low: { color: "#3b82f6", bg: "#eff6ff", badge: "#dbeafe", label: "New Job" },
};

const sev = (alert) => {
    if (alert.match_score >= 80) return SEVERITY.high;
    if (alert.match_score >= 50) return SEVERITY.medium;
    return SEVERITY.low;
};

const fmtRel = (ts) => {
    const m = Math.floor((Date.now() - new Date(ts)) / 60_000);
    if (m < 1) return "Just now";
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

const formatSalary = (min, max, currency) => {
    if (!min && !max) return null;
    const code = currency || "PKR";
    if (min && max) return `${code} ${Number(min).toLocaleString()} – ${Number(max).toLocaleString()}`;
    if (min) return `${code} ${Number(min).toLocaleString()}+`;
    return null;
};

const isRead = (n) => n.is_read === true || n.is_read === 1;

class CandidateJobAlertsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            alerts: [],
            loading: true,
            selected: null,
            filter: "all",
            isMobile: typeof window !== "undefined" ? window.innerWidth < 700 : false,
            mobileShowDetail: false,
        };
    }

    componentDidMount() {
        this.fetchAlerts();
        this.resizeHandler = () => this.setState({ isMobile: window.innerWidth < 700 });
        window.addEventListener("resize", this.resizeHandler);
        if (this.props.initialAlertId) {
            this.setState({ pendingSelectId: this.props.initialAlertId });
        }
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeHandler);
    }

    fetchAlerts = async () => {
        const { apiBaseUrl } = this.props;
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${apiBaseUrl}candidateProfile/job-alerts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const list = (data.data || []).map((a) => ({ ...a, is_read: isRead(a) }));
                const { pendingSelectId } = this.state;
                const target =
                    (pendingSelectId && list.find((a) => a.alert_id === pendingSelectId)) || null;
                this.setState({ alerts: list, loading: false, selected: target, pendingSelectId: null });
            }
        } catch (err) {
            console.error("Job alerts fetch error:", err);
            this.setState({ loading: false });
        }
    };

    markOneRead = async (alertId) => {
        const { apiBaseUrl } = this.props;
        this.setState((prev) => ({
            alerts: prev.alerts.map((a) => a.alert_id === alertId ? { ...a, is_read: true } : a),
        }));
        try {
            const token = sessionStorage.getItem("token");
            await fetch(`${apiBaseUrl}candidateProfile/job-alerts/${alertId}/read`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    markAllRead = async () => {
        const { apiBaseUrl } = this.props;
        this.setState((prev) => ({
            alerts: prev.alerts.map((a) => ({ ...a, is_read: true })),
        }));
        try {
            const token = sessionStorage.getItem("token");
            await fetch(`${apiBaseUrl}candidateProfile/job-alerts/read-all`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error("Mark all read error:", err);
        }
    };

    selectAlert = (alert) => {
        this.setState({ selected: { ...alert, is_read: true }, mobileShowDetail: true });
        if (!alert.is_read) this.markOneRead(alert.alert_id);
    };

    // ─── List Panel ───────────────────────────────────────────────────────────
    renderListPanel() {
        const { alerts, loading, selected, filter, isMobile } = this.state;
        const unreadCount = alerts.filter((a) => !a.is_read).length;
        const visible = filter === "unread" ? alerts.filter((a) => !a.is_read) : alerts;

        return (
            <div
                style={{
                    width: isMobile ? "100%" : 300,
                    borderRight: isMobile ? "none" : "1px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                    background: "#fafafa",
                }}
            >
                {/* Filter tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
                    {["all", "unread"].map((f) => (
                        <button
                            key={f}
                            onClick={() => this.setState({ filter: f })}
                            style={{
                                flex: 1,
                                padding: "10px 4px",
                                fontSize: 12,
                                fontWeight: filter === f ? 700 : 500,
                                color: filter === f ? "#36565f" : "#6b7280",
                                background: "none",
                                border: "none",
                                borderBottom: filter === f ? "2px solid #36565f" : "2px solid transparent",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                marginBottom: -1,
                                transition: "all 0.12s",
                            }}
                        >
                            {f === "all" ? `All (${alerts.length})` : `Unread (${unreadCount})`}
                        </button>
                    ))}
                </div>

                {/* Alert items */}
                <div style={{ overflowY: "auto", flex: 1, maxHeight: isMobile ? "60vh" : undefined }}>
                    {loading ? (
                        <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                            Loading…
                        </div>
                    ) : visible.length === 0 ? (
                        <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                            {filter === "unread" ? "All caught up!" : "No job alerts yet"}
                        </div>
                    ) : (
                        visible.map((alert) => {
                            const s = sev(alert);
                            const isSel = selected?.alert_id === alert.alert_id;
                            return (
                                <div
                                    key={alert.alert_id}
                                    onClick={() => this.selectAlert(alert)}
                                    style={{
                                        padding: "13px 14px",
                                        borderBottom: "1px solid #f0f0f0",
                                        borderLeft: isSel && !isMobile ? "3px solid #36565f" : "3px solid transparent",
                                        background: isSel && !isMobile ? "#e8f0f2" : alert.is_read ? "#fff" : "#edf6f7",
                                        cursor: "pointer",
                                        transition: "background 0.12s",
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "flex-start",
                                    }}
                                >
                                    {alert.logo ? (
                                        <img
                                            src={`data:image/png;base64,${alert.logo}`}
                                            alt={alert.company_name}
                                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                                        />
                                    ) : (
                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#36565f", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                                            {alert.company_name ? alert.company_name.charAt(0).toUpperCase() : "J"}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: alert.is_read ? 500 : 700,
                                                color: "#111827",
                                                lineHeight: 1.35,
                                                marginBottom: 3,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                            }}
                                        >
                                            {alert.job_title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11.5, color: "#6b7280", marginBottom: 4,
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            }}
                                        >
                                            {alert.company_name || "Company"}
                                            {alert.city_name ? ` • ${alert.city_name}` : ""}
                                        </div>
                                        <div style={{ fontSize: 10.5, color: "#9ca3af", display: "flex", gap: 6, alignItems: "center" }}>
                                            <span>{fmtRel(alert.sent_at)}</span>
                                            <span
                                                style={{
                                                    padding: "1px 5px", borderRadius: 4, fontSize: 9,
                                                    background: s.badge, color: s.color,
                                                    fontWeight: 700, textTransform: "uppercase",
                                                }}
                                            >
                                                {s.label}
                                            </span>
                                        </div>
                                    </div>

                                    {!alert.is_read && (
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#36565f", flexShrink: 0, marginTop: 6 }} />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // ─── Detail Panel ─────────────────────────────────────────────────────────
    renderDetailPanel() {
        const { selected, isMobile } = this.state;
        const { onApply, onViewJob } = this.props;

        if (!selected) {
            return (
                <div style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    color: "#9ca3af", gap: 12, padding: 32, minHeight: 300,
                }}>
                    <span style={{ fontSize: 48 }}>📭</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Select a job alert to view details</span>
                    <span style={{ fontSize: 12 }}>Your matching jobs will appear here</span>
                </div>
            );
        }

        const s = sev(selected);
        const salary = formatSalary(selected.min_salary, selected.max_salary, selected.currency);

        return (
            // ✅ Outer container — flex column, full height
            <div style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                height: "100%",
                overflow: "hidden"   // ✅ outer overflow hidden
            }}>

                {/* Mobile back button — shrink nahi hoga */}
                {isMobile && (
                    <button
                        onClick={() => this.setState({ mobileShowDetail: false })}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "12px 16px", background: "#f9fafb",
                            border: "none", borderBottom: "1px solid #e5e7eb",
                            cursor: "pointer", fontSize: 13, fontWeight: 600,
                            color: "#36565f", fontFamily: "inherit", width: "100%",
                            flexShrink: 0,   // ✅ back button shrink na ho
                        }}
                    >
                        ← Back to list
                    </button>
                )}

                {/* ✅ Scrollable content — header + body + button sab yahan */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",   // ✅ sirf yeh scroll hoga
                    display: "flex",
                    flexDirection: "column",
                }}>
                    {/* Detail header */}
                    <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
                        {/* ... same header content ... */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
                            {selected.logo ? (
                                <img src={`data:image/png;base64,${selected.logo}`} alt={selected.company_name}
                                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#36565f", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                                    {selected.company_name ? selected.company_name.charAt(0).toUpperCase() : "J"}
                                </div>
                            )}
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: s.badge, color: s.color, textTransform: "uppercase" }}>
                                {s.label}
                            </span>
                            <span style={{ fontSize: 11, color: "#36565f", fontWeight: 600, background: "#e8f0f2", padding: "4px 10px", borderRadius: 12 }}>
                                🔔 Matches your profile
                            </span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4, lineHeight: 1.35, wordBreak: "break-word" }}>
                            {selected.job_title}
                        </div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                            {selected.company_name || "Company"}
                            {selected.city_name ? ` • ${selected.city_name}` : ""}
                            {selected.job_type ? ` • ${selected.job_type}` : ""}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>Received {fmtFull(selected.sent_at)}</div>
                    </div>

                    {/* Detail body */}
                    <div style={{ padding: "20px 24px", flex: 1 }}>
                        {/* Pills */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                            {salary && (
                                <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>
                                    💰 {salary}
                                </span>
                            )}
                            {selected.job_type && (
                                <span style={{ background: "#f3f4f6", color: "#374151", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>
                                    {selected.job_type}
                                </span>
                            )}
                            {selected.min_experience && (
                                <span style={{ background: "#dbeafe", color: "#1e40af", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>
                                    🕒 {selected.min_experience}{selected.max_experience ? ` – ${selected.max_experience}` : "+"} yrs exp
                                </span>
                            )}
                        </div>

                        {/* Details table */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Details</div>
                            {[
                                { label: "Company", value: selected.company_name || "—" },
                                { label: "Location", value: selected.city_name || "—" },
                                { label: "Job Type", value: selected.job_type || "—" },
                                { label: "Salary", value: salary || "Not specified" },
                                { label: "Alerted", value: fmtFull(selected.sent_at) },
                                { label: "Status", value: selected.is_read ? <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Seen</span> : <span style={{ color: "#f59e0b", fontWeight: 700 }}>● New</span> },
                            ].map((row) => (
                                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13, gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ color: "#6b7280", fontWeight: 500 }}>{row.label}</span>
                                    <span style={{ color: "#111827", fontWeight: 600, textAlign: "right" }}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* ✅ Action button — padding bottom taake scroll ke baad dike */}
                        <div style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            paddingBottom: "80px"   // ✅ extra space neeche
                        }}>
                            <button
                                onClick={() => { if (onViewJob) onViewJob(selected); }}
                                style={{
                                    padding: "10px 22px", borderRadius: 8, fontSize: 13,
                                    fontWeight: 700, border: "none", cursor: "pointer",
                                    background: "#36565f", color: "#fff", fontFamily: "inherit",
                                }}
                            >
                                View Job & Apply →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Main Render ──────────────────────────────────────────────────────────
    render() {
        const { alerts, isMobile, mobileShowDetail } = this.state;
        const { onBack } = this.props;
        const unreadCount = alerts.filter((a) => !a.is_read).length;

        return (
            <div style={{ margin: isMobile ? "16px 12px" : "24px 32px", fontFamily: "'Nunito Sans', ui-sans-serif, sans-serif" }}>

                {/* Page heading */}
                <div
                    style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16, marginTop: 30,
                        flexWrap: "wrap", gap: 10,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div>
                            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#1a1a1a" }}>
                                Job Alerts
                            </div>
                            <div style={{ fontSize: 13, color: "#767676", marginTop: 2 }}>
                                Jobs matching your profile and skills
                            </div>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={this.markAllRead}
                            style={{
                                background: "#fff", border: "1.5px solid #d4d4d4",
                                borderRadius: 4, padding: "7px 14px", fontSize: 12,
                                fontWeight: 600, cursor: "pointer", color: "#595959",
                                fontFamily: "inherit",
                            }}
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Outlook panel */}
                <div
                    style={{
                        background: "#fff", border: "1px solid #e0e0e0",
                        borderRadius: 10, overflow: "hidden",
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        minHeight: isMobile ? undefined : 350,
                        height: isMobile ? undefined : "calc(100vh - 280px)",
                    }}
                >
                    {isMobile ? (
                        mobileShowDetail
                            ? this.renderDetailPanel()
                            : this.renderListPanel()
                    ) : (
                        <>
                            {this.renderListPanel()}
                            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                                {this.renderDetailPanel()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
}

export default CandidateJobAlertsPage;
