import React, { useState, useEffect } from "react";
import Head from "next/head";
import ChatBox from "../messages/chatBox";

const Messages = ({ selectedContactProp = null }) => {
    const [contacts, setContacts] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [selectedContact, setSelectedContact] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [mobileView, setMobileView] = useState("list");
    const [isMobile, setIsMobile] = useState(false);
    const [chromeHeight, setChromeHeight] = useState({ navbar: 72, footer: 72 }); // 👈 NEW

    const userId = sessionStorage.getItem("userId");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    // ✅ Lock body scroll on this page only
    useEffect(() => {
        document.body.classList.add("messages-page");
        return () => document.body.classList.remove("messages-page");
    }, []);

    // 👇 NEW: measure actual navbar & footer height, live-update on resize/content change
    useEffect(() => {
        const measure = () => {
            const navEl = document.querySelector("nav.navbar, .hunar-navbar, header");
            const footerEl = document.querySelector("footer.dashboard-footer, footer");
            setChromeHeight({
                navbar: navEl ? navEl.offsetHeight : 72,
                footer: footerEl ? footerEl.offsetHeight : 72,
            });
        };

        measure();
        window.addEventListener("resize", measure);

        // footer height can change after fonts/layout settle, re-check shortly after mount
        const t = setTimeout(measure, 300);

        return () => {
            window.removeEventListener("resize", measure);
            clearTimeout(t);
        };
    }, []);

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
            if (isMobile) setMobileView("chat");
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
            if (isMobile) setMobileView("chat");
        }, 0);
    };

    const handleBack = () => {
        setSelectedContact(null);
        setMobileView("list");
    };

    // 👇 NEW: compute exact available height from measured chrome
    const availableHeight = `calc(100vh - ${chromeHeight.navbar}px - ${chromeHeight.footer}px)`;

    return (
        <>
            <Head>
                <title>Messages</title>
                <style>{`
                    body.messages-page {
                        overflow: hidden !important;
                    }

                    .user-dashboard {
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        padding: 16px;
                        box-sizing: border-box;
                        background: #eef2f3;
                    }
                    @media (max-width: 768px) {
                        .user-dashboard {
                            padding: 12px 10px;
                        }
                    }
                    @media (max-width: 480px) {
                        .user-dashboard {
                            padding: 10px 8px;
                        }
                    }

                    .dashboard-outer {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        border-radius: 12px;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                        background: #fff;
                    }
                    .messages-layout {
                        display: flex;
                        height: 100%;
                        overflow: hidden;
                    }

                    .messages-sidebar {
                        width: 320px;
                        min-width: 320px;
                        display: flex;
                        flex-direction: column;
                        border-right: 1px solid #e0e0e0;
                        background: #fff;
                        height: 100%;
                        overflow: hidden;
                    }
                    .messages-sidebar-header {
                        padding: 16px 20px;
                        background: #36565f;
                        color: #fff;
                        flex-shrink: 0;
                    }
                    .messages-search-wrapper {
                        padding: 10px 12px;
                        border-bottom: 1px solid #e0e0e0;
                        flex-shrink: 0;
                    }
                    .messages-search {
                        width: 100%;
                        padding: 8px 12px;
                        border-radius: 8px;
                        border: 1px solid #ddd;
                        font-size: 13px;
                        outline: none;
                        box-sizing: border-box;
                    }
                    .messages-contact-list {
                        flex: 1;
                        overflow-y: auto;
                    }
                    .messages-contact-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 16px;
                        cursor: pointer;
                        border-bottom: 1px solid #f0f0f0;
                        transition: background 0.15s;
                    }
                    .messages-contact-item:hover,
                    .messages-contact-item.active {
                        background: #f0f5f6;
                    }
                    .messages-contact-item.unread .contact-name {
                        font-weight: 700;
                    }
                    .contact-avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: #36565f;
                        color: #fff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: 15px;
                        flex-shrink: 0;
                    }
                    .contact-name {
                        font-size: 14px;
                        font-weight: 500;
                    }
                    .contact-time {
                        font-size: 11px;
                        color: #999;
                    }
                    .contact-last-msg {
                        font-size: 12px;
                        color: #888;
                    }

                    .messages-chat-panel {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        overflow: hidden;
                        background: #f7f9fa;
                    }

                    .messages-empty-state {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: #aaa;
                        text-align: center;
                    }
                    .messages-empty-state .empty-icon {
                        font-size: 48px;
                        margin-bottom: 12px;
                    }

                    .mobile-hidden {
                        display: none !important;
                    }
                    @media (max-width: 768px) {
                        .messages-sidebar {
                            width: 100%;
                            min-width: unset;
                        }
                    }
                `}</style>
            </Head>

            {/* 👇 height now set inline from measured navbar/footer, not guessed in CSS */}
            <section className="user-dashboard" style={{ height: availableHeight }}>
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
                                    onBack={handleBack}
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