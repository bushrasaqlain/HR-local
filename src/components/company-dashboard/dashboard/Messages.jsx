// "use client";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import ChatBox from "../messages/chatBox";

const Messages = ({ selectedContactProp = null }) => {
    const [contacts, setContacts] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [selectedContact, setSelectedContact] = useState(selectedContactProp);
    const [unreadCounts, setUnreadCounts] = useState({});
    const userId = sessionStorage.getItem("userId");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedContactProp) setSelectedContact(selectedContactProp);
    }, [selectedContactProp]);

    const fetchContacts = async () => {
        try {
            const [contactsRes, countsRes] = await Promise.all([
                fetch(`${apiBaseUrl}message/contacts/${userId}`),
                fetch(`${apiBaseUrl}message/unread-per-contact/${userId}`)
            ]);

            if (contactsRes.ok) {
                const data = await contactsRes.json();
                setContacts(data);
            }
            if (countsRes.ok) {
                const counts = await countsRes.json();
                setUnreadCounts(counts); // { senderId: count }
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const formatTime = (timeString) => {
        return new Date(timeString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const filteredContacts = contacts.filter((contact) =>
        contact.full_name.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <>
            <Head>
                <title>Messages</title>
            </Head>

            <section className="user-dashboard">
                <div className="dashboard-outer p-0">
                    <div className="messages-layout">

                        {/* LEFT SIDEBAR — Contact List */}
                        <div className="messages-sidebar">

                            {/* Sidebar Header */}
                            <div className="messages-sidebar-header">
                                <h5 className="fw-bold mb-0">Messages</h5>
                            </div>

                            {/* Search */}
                            <div className="messages-search-wrapper">
                                <input
                                    type="text"
                                    className="messages-search"
                                    placeholder="Search or start new chat"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                />
                            </div>

                            {/* Contact List */}
                            <div className="messages-contact-list">
                                {filteredContacts.length === 0 ? (
                                    <p className="text-muted text-center mt-4 px-3">No contacts found.</p>
                                ) : (
                                    filteredContacts.map((contact) => {
                                        const isUnread = contact.is_read === 0 && contact.receiverId == userId;
                                        const contactUnreadCount = isUnread ? 1 : 0;
                                        return (
                                            <div
                                                key={contact.id}
                                                className={`messages-contact-item ${selectedContact?.id === contact.id ? "active" : ""} ${isUnread ? "unread" : ""}`}
                                                onClick={() => {
                                                    fetch(`${apiBaseUrl}message/mark-as-read`, {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            senderId: contact.senderId,
                                                            receiverId: userId
                                                        })
                                                    }).catch(err => console.error("Mark read failed:", err));

                                                    setUnreadCounts(prev => ({ ...prev, [contact.id]: 0 }));

                                                    setSelectedContact(null);
                                                    setTimeout(() => {
                                                        setSelectedContact(contact);
                                                        setContacts(prev =>
                                                            prev.map(c => c.id === contact.id ? { ...c, is_read: 1 } : c)
                                                        );
                                                    }, 0);
                                                }}
                                            >
                                                <div className="contact-avatar">
                                                    {contact.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="contact-info flex-grow-1 overflow-hidden">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="contact-name">{contact.full_name}</span>
                                                        <span className="contact-time">
                                                            {formatTime(contact.last_message_time)}
                                                        </span>
                                                    </div>

                                                    {/* ✅ Last message + badge row */}
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <p className="contact-last-msg text-truncate mb-0" style={{ flex: 1, marginRight: "6px" }}>
                                                            {contact.last_message}
                                                        </p>

                                                        {/* ✅ Badge - sirf unread ho tab */}
                                                        {isUnread && (
                                                            <span style={{
                                                                background: "#36565f",
                                                                color: "#fff",
                                                                borderRadius: "50%",
                                                                fontSize: "0.65rem",
                                                                fontWeight: 700,
                                                                minWidth: "18px",
                                                                height: "18px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                flexShrink: 0,
                                                            }}>
                                                                {unreadCounts[contact.id] || 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* RIGHT PANEL — Chat or Placeholder */}
                        <div className="messages-chat-panel">
                            {selectedContact ? (
                                <ChatBox
                                    selectedContactId={selectedContact.id}
                                    selectedContactName={selectedContact.full_name}
                                    selectedJobId={selectedContact.jobId}
                                    onBack={() => setSelectedContact(null)}
                                    embedded={true}
                                />
                            ) : (
                                <div className="messages-empty-state">
                                    <div className="empty-icon">💬</div>
                                    <h5>Select a conversation</h5>
                                    <p className="text-muted">Choose a contact from the left to start chatting.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
};

export default Messages;
