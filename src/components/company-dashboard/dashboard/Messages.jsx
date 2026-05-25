import React, { useState, useEffect } from "react";
import Head from "next/head";
import ChatBox from "../messages/chatBox";

const Messages = ({ selectedContactProp = null }) => {
    const [contacts, setContacts] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [selectedContact, setSelectedContact] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    // ✅ Mobile view toggle: "list" ya "chat"
    const [mobileView, setMobileView] = useState("list");
    const [isMobile, setIsMobile] = useState(false);

    const userId = sessionStorage.getItem("userId");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    // ✅ Mobile detect karo
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedContactProp && selectedContactProp.id) {
            setSelectedContact(selectedContactProp);
            if (isMobile) setMobileView("chat"); // ✅ prop se aaye to chat dikhao
        } else {
            setSelectedContact(null);
        }
    }, [selectedContactProp]);

    const fetchContacts = async () => {
        try {
            const [contactsRes, countsRes] = await Promise.all([
                fetch(`${apiBaseUrl}message/contacts/${userId}`),
                fetch(`${apiBaseUrl}message/unread-per-contact/${userId}`)
            ]);
            if (contactsRes.ok) setContacts(await contactsRes.json());
            if (countsRes.ok) setUnreadCounts(await countsRes.json());
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const formatTime = (timeString) => {
        return new Date(timeString).toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    };

    const filteredContacts = contacts.filter((contact) =>
        contact.full_name.toLowerCase().includes(searchValue.toLowerCase())
    );

    // ✅ Contact select karna
    const handleContactSelect = (contact) => {
        fetch(`${apiBaseUrl}message/mark-as-read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId: contact.senderId, receiverId: userId })
        }).catch(err => console.error("Mark read failed:", err));

        setUnreadCounts(prev => ({ ...prev, [contact.id]: 0 }));
        setSelectedContact(null);
        setTimeout(() => {
            setSelectedContact(contact);
            setContacts(prev =>
                prev.map(c => c.id === contact.id ? { ...c, is_read: 1 } : c)
            );
            if (isMobile) setMobileView("chat"); // ✅ Mobile pe chat panel dikhao
        }, 0);
    };

    // ✅ Back button — list pe wapas
    const handleBack = () => {
        setSelectedContact(null);
        setMobileView("list");
    };

    return (
        <>
            <Head><title>Messages</title></Head>

            <section className="user-dashboard">
                <div className="dashboard-outer p-0" style={{ padding: 0, height: '100%' }}>
                    <div className="messages-layout">

                        {/* LEFT SIDEBAR */}
                        <div className={`messages-sidebar ${isMobile && mobileView === "chat" ? "mobile-hidden" : ""}`}>

                            <div className="messages-sidebar-header">
                                <h5 className="fw-bold mb-0">Messages</h5>
                            </div>

                            <div className="messages-search-wrapper">
                                <input
                                    type="text"
                                    className="messages-search"
                                    placeholder="Search or start new chat"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                />
                            </div>

                            <div className="messages-contact-list">
                                {filteredContacts.length === 0 ? (
                                    <p className="text-muted text-center mt-4 px-3">No contacts found.</p>
                                ) : (
                                    filteredContacts.map((contact) => {
                                        const isUnread = contact.is_read === 0 && contact.receiverId == userId;
                                        return (
                                            <div
                                                key={contact.id}
                                                className={`messages-contact-item ${selectedContact?.id === contact.id ? "active" : ""} ${isUnread ? "unread" : ""}`}
                                                onClick={() => handleContactSelect(contact)}
                                            >
                                                <div className="contact-avatar">
                                                    {contact.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="contact-info flex-grow-1 overflow-hidden">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="contact-name">{contact.full_name}</span>
                                                        <span className="contact-time">{formatTime(contact.last_message_time)}</span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <p className="contact-last-msg text-truncate mb-0" style={{ flex: 1, marginRight: "6px" }}>
                                                            {contact.last_message}
                                                        </p>
                                                        {isUnread && (
                                                            <span style={{
                                                                background: "#36565f", color: "#fff", borderRadius: "50%",
                                                                fontSize: "0.65rem", fontWeight: 700, minWidth: "18px",
                                                                height: "18px", display: "inline-flex", alignItems: "center",
                                                                justifyContent: "center", flexShrink: 0,
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

                        {/* RIGHT CHAT PANEL */}
                        <div className={`messages-chat-panel ${isMobile && mobileView === "list" ? "mobile-hidden" : ""}`}>
                            {selectedContact ? (
                                <ChatBox
                                    selectedContactId={selectedContact.id}
                                    selectedContactName={selectedContact.full_name}
                                    selectedJobId={selectedContact.jobId}
                                    onBack={handleBack} // ✅ Back button ChatBox ko pass karo
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