import React, { useState, useEffect, useRef } from "react";

const MessagesDropdown = ({ userId, apiBaseUrl, onOpenMessages, externalUnreadCount }) => {
    const [open, setOpen] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        if (open) fetchContacts();
    }, [open]);

    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 3000);
        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const displayCount = Math.max(unreadCount, externalUnreadCount || 0);

    const fetchContacts = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}message/contacts/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
                const unread = data.filter(
                    (c) => c.is_read === 0 && c.receiverId == userId
                ).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error("MessagesDropdown fetch error:", err);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch(`${apiBaseUrl}message/contacts/${userId}`);
            if (res.ok) {
                const data = await res.json();
                const unread = data.filter(
                    (c) => c.is_read === 0 && c.receiverId == userId
                ).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error("Unread count fetch error:", err);
        }
    };

    const formatTime = (t) =>
        new Date(t).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

    // const filtered = contacts.filter((c) =>
    //     c.full_name.toLowerCase().includes(search.toLowerCase())
    // );

    const filtered = contacts.filter((c) => {
        const matchesSearch = c.full_name.toLowerCase().includes(search.toLowerCase());
        const isUnread = c.is_read === 0 && c.receiverId == userId;
        return matchesSearch && isUnread;
    });

    const handleContactClick = async (contact) => {
        console.log("FULL CONTACT:", contact);
        setOpen(false);

        setContacts(prev =>
            prev.map(c => c.id === contact.id ? { ...c, is_read: 1 } : c)
        );
        setUnreadCount(prev => Math.max(prev - 1, 0));

        try {
            await fetch(`${apiBaseUrl}message/mark-as-read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderId: contact.id,       
                    receiverId: String(userId)  
                })
            });
        } catch (err) {
            console.error("Mark read failed:", err);
        }

        onOpenMessages(contact);
    };

    return (
        <div style={{ position: "relative" }} ref={ref}>
            {/* Chat Icon Button */}
            <span
                style={{ cursor: "pointer", position: "relative", display: "inline-flex" }}
                onClick={() => setOpen((prev) => !prev)}
            >
                <i className="las la-comment-dots fs-2 text-white"></i>
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
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
            </span>

            {/* Dropdown */}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "40px",
                        right: 0,
                        width: "320px",
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
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>
                            Messages
                        </span>
                        <span
                            style={{ fontSize: 12, color: "#36565f", cursor: "pointer", fontWeight: 500 }}
                            onClick={() => { setOpen(false); onOpenMessages(null); }}
                        >
                            See all →
                        </span>
                    </div>

                    {/* Search */}
                    {/* <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "6px 10px",
                                border: "1px solid #e0e0e0",
                                borderRadius: "6px",
                                fontSize: 13,
                                outline: "none",
                                background: "#f8f8f8",
                                color: "#333",
                            }}
                        />
                    </div> */}

                    {/* Contact List */}
                    <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                        {filtered.length === 0 ? (
                            <p style={{ textAlign: "center", color: "#999", padding: "20px", fontSize: 13 }}>
                                No contacts found.
                            </p>
                        ) : (
                            filtered.map((contact) => {
                                const isUnread = contact.is_read === 0 && contact.receiverId == userId;
                                return (
                                    <div
                                        key={contact.id}
                                        onClick={() => handleContactClick(contact)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "10px 14px",
                                            cursor: "pointer",
                                            borderBottom: "0.5px solid #f5f5f5",
                                            background: isUnread ? "#edf6f7" : "transparent",
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f0f5f5"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = isUnread ? "#edf6f7" : "transparent"}
                                    >
                                        {/* Avatar */}
                                        <div
                                            style={{
                                                width: 36, height: 36, borderRadius: "50%",
                                                background: "#36565f", color: "white",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 14, fontWeight: 600, flexShrink: 0,
                                            }}
                                        >
                                            {contact.full_name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, overflow: "hidden" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>
                                                    {contact.full_name}
                                                </span>
                                                <span style={{ fontSize: 11, color: "#aaa" }}>
                                                    {formatTime(contact.last_message_time)}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <p style={{
                                                    fontSize: 12, color: "#888", margin: 0,
                                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                    maxWidth: "200px",
                                                }}>
                                                    {contact.last_message}
                                                </p>
                                                {isUnread && (
                                                    <span style={{
                                                        width: 8, height: 8, background: "#36565f",
                                                        borderRadius: "50%", flexShrink: 0,
                                                    }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesDropdown;