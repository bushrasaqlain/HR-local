import React, { Component } from "react";
import api from "../lib/api";
import Head from "next/head";
import "bootstrap-icons/font/bootstrap-icons.css";

class ContactMessages extends Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            statusFilter: "All",
            searchTerm: "",
            selectedMessage: null,
            replyText: "",
            replyLoading: false,
            successMessage: "",
            errorMessage: "",
        };
        this.apibaseurl = process.env.NEXT_PUBLIC_API_BASE_URL;
        this.threadEndRef = React.createRef();
    }

    componentDidMount() { this.fetchMessages(); }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.selectedMessage?.id !== this.state.selectedMessage?.id) {
            this.scrollThreadToBottom();
        }
    }

    scrollThreadToBottom = () => {
        setTimeout(() => {
            this.threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
    };

    fetchMessages = () => {
        const token = sessionStorage.getItem("token");
        api.get(`${this.apibaseurl}contact/messages`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
            if (res.data.success) this.setState({ messages: res.data.data });
        }).catch(() => {
            this.setState({ errorMessage: "Failed to load messages." });
            setTimeout(() => this.setState({ errorMessage: "" }), 3000);
        });
    };

    updateStatus = (id, status) => {
        const token = sessionStorage.getItem("token");
        api.patch(`${this.apibaseurl}contact/messages/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
            if (res.data.success) {
                this.setState((prev) => ({
                    messages: prev.messages.map((msg) =>
                        msg.id === id ? { ...msg, status } : msg
                    ),
                    selectedMessage: prev.selectedMessage?.id === id
                        ? { ...prev.selectedMessage, status }
                        : prev.selectedMessage,
                    successMessage: `Marked as "${status}"`,
                }));
                setTimeout(() => this.setState({ successMessage: "" }), 3000);
            }
        }).catch(() => {
            this.setState({ errorMessage: "Failed to update status." });
            setTimeout(() => this.setState({ errorMessage: "" }), 3000);
        });
    };

    sendReply = () => {
        const { selectedMessage, replyText } = this.state;
        if (!replyText.trim()) return;
        const token = sessionStorage.getItem("token");
        this.setState({ replyLoading: true });
        api.post(
            `${this.apibaseurl}contact/messages/${selectedMessage.id}/reply`,
            { replyMessage: replyText },
            { headers: { Authorization: `Bearer ${token}` } }
        ).then((res) => {
            if (res.data.success) {
                let replies = [];
                try { replies = JSON.parse(selectedMessage.replies || "[]"); } catch { replies = []; }
                replies.push({ text: replyText, sent_at: new Date().toISOString(), sent_by: "admin" });
                const updatedMsg = { ...selectedMessage, status: "replied", replies: JSON.stringify(replies) };
                this.setState((prev) => ({
                    replyText: "",
                    replyLoading: false,
                    successMessage: "Reply sent to " + selectedMessage.email,
                    selectedMessage: updatedMsg,
                    messages: prev.messages.map((m) => m.id === selectedMessage.id ? updatedMsg : m),
                }));
                setTimeout(() => this.setState({ successMessage: "" }), 4000);
                this.scrollThreadToBottom();
            }
        }).catch(() => {
            this.setState({ errorMessage: "Failed to send reply.", replyLoading: false });
            setTimeout(() => this.setState({ errorMessage: "" }), 3000);
        });
    };

    getFilteredMessages = () => {
        const { messages, statusFilter, searchTerm } = this.state;
        return messages.filter((msg) => {
            const matchStatus = statusFilter === "All" || msg.status === statusFilter;
            const matchSearch = !searchTerm ||
                msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchStatus && matchSearch;
        });
    };

    getReplies(msg) {
        try { return JSON.parse(msg.replies || "[]"); } catch { return []; }
    }

    openMessage = (msg) => {
        this.setState({ selectedMessage: msg });
        if (msg.status === "unread") this.updateStatus(msg.id, "read");
    };

    statusBadge(status) {
        const map = {
            unread:  { bg: "#fff3cd", color: "#856404", label: "Unread" },
            read:    { bg: "#d1ecf1", color: "#0c5460", label: "Read" },
            replied: { bg: "#d4edda", color: "#155724", label: "Replied" },
        };
        const s = map[status] || { bg: "#e2e3e5", color: "#383d41", label: status };
        return (
            <span style={{
                background: s.bg, color: s.color,
                padding: "2px 9px", borderRadius: "12px",
                fontSize: "0.7rem", fontWeight: 600,
            }}>{s.label}</span>
        );
    }

    categoryBadge(category) {
        const map = {
            bug:           { bg: "#f8d7da", color: "#721c24", label: "Bug" },
            suggestion:    { bg: "#d1ecf1", color: "#0c5460", label: "Suggestion" },
            account_issue: { bg: "#fff3cd", color: "#856404", label: "Account Issue" },
            payment:       { bg: "#d4edda", color: "#155724", label: "Payment" },
            general:       { bg: "#e2e3e5", color: "#383d41", label: "General" },
        };
        const s = map[category] || map.general;
        return (
            <span style={{
                background: s.bg, color: s.color,
                padding: "2px 8px", borderRadius: "6px",
                fontSize: "0.7rem", fontWeight: 600,
            }}>{s.label}</span>
        );
    }

    roleIcon(userType) {
        if (!userType) return "bi-person";
        const t = userType.toLowerCase();
        if (t === "employer" || t === "company") return "bi-building";
        if (t === "candidate") return "bi-person-badge";
        return "bi-person";
    }

    avatarBg(userType) {
        const t = userType?.toLowerCase();
        if (t === "employer" || t === "company") return { bg: "#e4faff", color: "#36565F" };
        if (t === "candidate") return { bg: "#e4faff", color: "#36565F" };
        return { bg: "#e2e3e5", color: "#555" };
    }

    formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-PK", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    formatDateShort = (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" });
    };

    render() {
        const { statusFilter, searchTerm, selectedMessage, replyText, replyLoading, successMessage, errorMessage } = this.state;
        const filtered = this.getFilteredMessages();
        const counts = {
            all:     this.state.messages.length,
            unread:  this.state.messages.filter(m => m.status === "unread").length,
            read:    this.state.messages.filter(m => m.status === "read").length,
            replied: this.state.messages.filter(m => m.status === "replied").length,
        };
        const replies = selectedMessage ? this.getReplies(selectedMessage) : [];
        const av = selectedMessage ? this.avatarBg(selectedMessage.user_type) : {};

        return (
            <>
                <Head><title>Contact Messages</title></Head>

                {/* Toast notifications */}
                {(successMessage || errorMessage) && (
                    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 99999, display: "flex", flexDirection: "column", gap: 8 }}>
                        {successMessage && (
                            <div style={{ background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.1)", fontSize: "0.85rem" }}>
                                <i className="bi bi-check-circle-fill"></i> {successMessage}
                                <button style={{ background: "none", border: "none", marginLeft: 8, cursor: "pointer", color: "#155724", fontSize: "1rem" }} onClick={() => this.setState({ successMessage: "" })}>×</button>
                            </div>
                        )}
                        {errorMessage && (
                            <div style={{ background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.1)", fontSize: "0.85rem" }}>
                                <i className="bi bi-x-circle-fill"></i> {errorMessage}
                                <button style={{ background: "none", border: "none", marginLeft: 8, cursor: "pointer", color: "#721c24", fontSize: "1rem" }} onClick={() => this.setState({ errorMessage: "" })}>×</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Page title */}
                <div className="d-flex align-items-center gap-2 mb-3">
                    <h6 className="fw-bold mb-0">Contact Messages</h6>
                    {counts.unread > 0 && (
                        <span style={{ background: "#fff3cd", color: "#856404", border: "1px solid #ffc107", padding: "2px 9px", borderRadius: 12, fontSize: "0.73rem", fontWeight: 600 }}>
                            {counts.unread} unread
                        </span>
                    )}
                </div>

                {/* Two-panel layout */}
                <div style={{ display: "flex", gap: 0, border: "1px solid #e2e6ea", borderRadius: 12, overflow: "hidden", height: "calc(100vh - 160px)", background: "#fff" }}>

                    {/* ─── LEFT: Message list ─── */}
                    <div style={{ width: 340, minWidth: 300, borderRight: "1px solid #e2e6ea", display: "flex", flexDirection: "column", flexShrink: 0 }}>

                        {/* Header */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee" }}>
                            <div style={{ position: "relative", marginBottom: 10 }}>
                                <input
                                    type="text"
                                    placeholder="Search name, ticket..."
                                    value={searchTerm}
                                    onChange={(e) => this.setState({ searchTerm: e.target.value })}
                                    style={{ width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #dee2e6", borderRadius: 8, fontSize: "0.82rem", outline: "none" }}
                                />
                            </div>
                            {/* Filter tabs */}
                            <div style={{ display: "flex", gap: 4 }}>
                                {[
                                    { key: "All",     label: "All",     count: counts.all },
                                    { key: "unread",  label: "Unread",  count: counts.unread },
                                    { key: "replied", label: "Replied", count: counts.replied },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => this.setState({ statusFilter: tab.key })}
                                        style={{
                                            flex: 1, padding: "5px 4px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.77rem", fontWeight: 600,
                                            background: statusFilter === tab.key ? "#36565f" : "#f1f3f5",
                                            color: statusFilter === tab.key ? "#fff" : "#666",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span style={{
                                                marginLeft: 4, background: statusFilter === tab.key ? "rgba(255,255,255,0.25)" : "#dee2e6",
                                                color: statusFilter === tab.key ? "#fff" : "#555",
                                                borderRadius: 10, padding: "0 5px", fontSize: "0.7rem",
                                            }}>{tab.count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message rows */}
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            {filtered.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 16px", color: "#aaa" }}>
                                    <i className="bi bi-inbox" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }}></i>
                                    No messages found.
                                </div>
                            ) : filtered.map((msg) => {
                                const isSelected = selectedMessage?.id === msg.id;
                                const msgReplies = this.getReplies(msg);
                                const avColor = this.avatarBg(msg.user_type);
                                return (
                                    <div
                                        key={msg.id}
                                        onClick={() => this.openMessage(msg)}
                                        style={{
                                            display: "flex", gap: 10, padding: "12px 14px",
                                            borderBottom: "1px solid #f3f3f3",
                                            background: isSelected ? "#eef4f5" : msg.status === "unread" ? "#fdfbf2" : "#fff",
                                            cursor: "pointer",
                                            borderLeft: isSelected ? "3px solid #36565f" : "3px solid transparent",
                                            transition: "background 0.1s",
                                        }}
                                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f5f8f9"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? "#eef4f5" : msg.status === "unread" ? "#fdfbf2" : "#fff"; }}
                                    >
                                        {/* Avatar */}
                                        <div style={{
                                            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                                            background: avColor.bg, display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <i className={`bi ${this.roleIcon(msg.user_type)}`} style={{ color: avColor.color, fontSize: "1rem" }}></i>
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                                <span style={{ fontWeight: msg.status === "unread" ? 700 : 500, fontSize: "0.85rem", color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                                                    {msg.name || "—"}
                                                </span>
                                                <span style={{ fontSize: "0.72rem", color: "#aaa", flexShrink: 0 }}>{this.formatDateShort(msg.created_at)}</span>
                                            </div>
                                            <div style={{ fontWeight: msg.status === "unread" ? 600 : 400, fontSize: "0.82rem", color: "#333", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {msg.subject || "No subject"}
                                            </div>
                                            <div style={{ fontSize: "0.77rem", color: "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 5 }}>
                                                {msgReplies.length > 0 ? `You: ${msgReplies[msgReplies.length - 1].text}` : msg.message}
                                            </div>
                                            <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                                                {msg.category && this.categoryBadge(msg.category)}
                                                {msg.ticket_number && (
                                                    <span style={{ fontSize: "0.68rem", color: "#36565f", fontWeight: 700 }}>
                                                        <i className="bi bi-ticket me-1"></i>{msg.ticket_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── RIGHT: Thread + Reply ─── */}
                    {selectedMessage ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                            {/* Thread header */}
                            <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: av.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <i className={`bi ${this.roleIcon(selectedMessage.user_type)}`} style={{ color: av.color, fontSize: "1.1rem" }}></i>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, color: "#264752", fontSize: "0.92rem" }}>{selectedMessage.name}</div>
                                    <div style={{ fontSize: "0.78rem", color: "#888" }}>{selectedMessage.email} · <span style={{ textTransform: "capitalize" }}>{selectedMessage.user_type}</span></div>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    {selectedMessage.ticket_number && (
                                        <span style={{ background: "#e8f4f8", color: "#264752", border: "1px solid #264752", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
                                            <i className="bi bi-ticket me-1"></i>{selectedMessage.ticket_number}
                                        </span>
                                    )}
                                    {this.statusBadge(selectedMessage.status)}
                                    
                                    {selectedMessage.status !== "replied" && (
                                        <button
                                            className="btn btn-sm btn-outline-success"
                                            style={{ borderRadius: 7, fontSize: "0.78rem" }}
                                            onClick={() => this.updateStatus(selectedMessage.id, "replied")}
                                        >
                                            <i className="bi bi-check me-1"></i>Mark replied
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Subject bar */}
                            <div style={{ padding: "10px 20px", background: "#f8f9fa", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#333" }}>{selectedMessage.subject || "No subject"}</span>
                                <span style={{ fontSize: "0.75rem", color: "#aaa" }}>{this.formatDate(selectedMessage.created_at)}</span>
                            </div>

                            {/* Conversation thread */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

                                {/* Original message */}
                                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: av.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <i className={`bi ${this.roleIcon(selectedMessage.user_type)}`} style={{ color: av.color, fontSize: "0.85rem" }}></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: 4 }}>
                                            <strong style={{ color: "#333" }}>{selectedMessage.name}</strong>
                                            {" · "}{this.formatDate(selectedMessage.created_at)}
                                        </div>
                                        <div style={{
                                            background: "#f4f8f9", borderLeft: "3px solid #36565f",
                                            padding: "11px 14px", borderRadius: "0 8px 8px 0",
                                            color: "#333", lineHeight: 1.6, fontSize: "0.86rem", whiteSpace: "pre-wrap",
                                        }}>
                                            {selectedMessage.message}
                                        </div>
                                    </div>
                                </div>

                                {/* Admin replies */}
                                {replies.map((r, i) => (
                                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: "row-reverse" }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "#36565f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="bi bi-headset" style={{ color: "#fff", fontSize: "0.85rem" }}></i>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: 4, textAlign: "right" }}>
                                                <strong style={{ color: "#333" }}>Support Team</strong>
                                                {" · "}{this.formatDate(r.sent_at)}
                                            </div>
                                            <div style={{
                                                background: "#e8f4f8", borderRight: "3px solid #36565f",
                                                padding: "11px 14px", borderRadius: "8px 0 0 8px",
                                                color: "#333", lineHeight: 1.6, fontSize: "0.86rem", whiteSpace: "pre-wrap",
                                            }}>
                                                {r.text}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div ref={this.threadEndRef} />
                            </div>

                            {/* Reply box */}
                            <div style={{ borderTop: "1px solid #eee", padding: "14px 20px", background: "#fafafa" }}>
                                <div style={{ background: "#fff", border: "1px solid #dee2e6", borderRadius: 10, overflow: "hidden" }}>
                                    <textarea
                                        rows={3}
                                        placeholder="Type your reply..."
                                        value={replyText}
                                        onChange={(e) => this.setState({ replyText: e.target.value })}
                                        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) this.sendReply(); }}
                                        style={{ width: "100%", border: "none", padding: "12px 14px", resize: "none", fontSize: "0.85rem", outline: "none", background: "transparent", boxSizing: "border-box" }}
                                    />
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: "1px solid #f0f0f0" }}>
                                        <span style={{ fontSize: "0.73rem", color: "#bbb" }}>
                                            <i className="bi bi-envelope me-1"></i>Will send to {selectedMessage.email}
                                        </span>
                                        <button
                                            onClick={this.sendReply}
                                            disabled={!replyText.trim() || replyLoading}
                                            style={{
                                                background: replyText.trim() ? "#36565f" : "#ccc",
                                                color: "#fff", border: "none", borderRadius: 8,
                                                padding: "6px 18px", fontSize: "0.82rem", fontWeight: 600,
                                                cursor: replyText.trim() ? "pointer" : "not-allowed",
                                                display: "flex", alignItems: "center", gap: 6,
                                            }}
                                        >
                                            {replyLoading ? (
                                                <><span className="spinner-border spinner-border-sm"></span> Sending...</>
                                            ) : (
                                                <><i className="bi bi-send"></i> Send reply</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Empty state */
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#ccc" }}>
                            <i className="bi bi-chat-left-text" style={{ fontSize: "3rem", marginBottom: 12 }}></i>
                            <div style={{ fontSize: "0.9rem", color: "#aaa" }}>Select a message to view the conversation</div>
                        </div>
                    )}
                </div>
            </>
        );
    }
}

export default ContactMessages;