import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import DashboardFooter from "../../../layout/dashboard-footer";

export default function HistoryPage() {
    const router = useRouter();
    const { type, id } = router.query;
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        if (type && id) {
            sessionStorage.setItem("lastHistoryId", id);       // ✅
            sessionStorage.setItem("lastHistoryType", type);   // ✅
            fetchHistory();
        }
    }, [type, id]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${apiBaseUrl}dbadminhistory`, {
                params: { entity_type: type, entity_id: id },
            });
            setHistory(res.data || []);
        } catch (error) {
            console.error("History error:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = date.toLocaleString("en-US", { month: "short" });
        const year = String(date.getFullYear()).slice(-2);
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    };

    const actionColors = {
        ADDED: { bg: "#dcf4e8", color: "#166534", dot: "#16a34a" },
        UPDATED: { bg: "#ede9fe", color: "#5b21b6", dot: "#7c3aed" },
        ACTIVE: { bg: "#d1fae5", color: "#065f46", dot: "#059669" },
        INACTIVE: { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
    };

    const entityLabel = type
        ? type.charAt(0).toUpperCase() + type.slice(1)
        : "";

    return (
        <div style={{
            minHeight: "100vh",
            background: "#f4f6f9",
            fontFamily: "'Poppins', sans-serif",
            paddingTop: "90px",
            paddingBottom: "70px",
        }}>

            {/* Content */}
            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "30px 24px" }}>

                {/* ✅ Simple Back button + Heading - no extra bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "6px 14px", borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            fontSize: "13px", fontWeight: 500,
                            cursor: "pointer", color: "#374151",
                        }}
                    >
                        ← Back
                    </button>

                    <h5 style={{ margin: 0, fontWeight: 700, color: "#1f2937", fontSize: "18px" }}>
                        {entityLabel} History
                    </h5>
                </div>

                {/* Timeline */}
                {loading ? null : history.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "80px 0",
                        background: "#fff", borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        color: "#9ca3af", fontSize: "14px"
                    }}>
                        No history records found.
                    </div>
                ) : (
                    <div style={{ position: "relative", paddingLeft: "32px" }}>
                        {/* Vertical line */}
                        <div style={{
                            position: "absolute", left: "7px",
                            top: "8px", bottom: "8px",
                            width: "2px", background: "#e5e7eb",
                            borderRadius: "2px"
                        }} />

                        {history.map((item, idx) => {
                            const s = actionColors[item.action] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
                            return (
                                <div key={idx} style={{ position: "relative", marginBottom: "12px" }}>
                                    {/* Dot */}
                                    <div style={{
                                        position: "absolute",
                                        left: "-28px", top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "14px", height: "14px",
                                        borderRadius: "50%",
                                        background: s.dot,
                                        border: "3px solid #fff",
                                        boxShadow: `0 0 0 2px ${s.dot}`,
                                        zIndex: 1,
                                    }} />

                                    {/* Card */}
                                    <div style={{
                                        background: "#fff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "10px",
                                        padding: "27px 35px",
                                    }}>
                                        <div style={{ fontSize: "14.5px", color: "#1f2937", lineHeight: "1.8" }}>
                                            <strong>
                                                {item.data?.name
                                                    ? item.data.name
                                                    : item.data?.code
                                                        ? item.data.code
                                                        : item.data?.price
                                                            ? `Price: ${item.data.price}, Duration: ${item.data.duration_value} ${item.data.duration_unit}`
                                                            : "Record"}
                                            </strong>
                                            {" "}was{" "}
                                            <span style={{
                                                display: "inline-block",
                                                background: s.bg,
                                                color: s.color,
                                                fontWeight: 600,
                                                fontSize: "11px",
                                                padding: "3px 14px",
                                                minWidth: "80px",
                                                textAlign: "center",
                                                borderRadius: "20px",
                                                letterSpacing: "0.5px",
                                            }}>
                                                {item.action}
                                            </span>
                                            {" "}by{" "}
                                            <span style={{ color: "#1a1a1a", fontWeight: 500 }}>
                                                {item.changed_by_name}
                                            </span>
                                            {" "}on{" "}
                                            <span style={{ color: "#6b7280", fontWeight: 500 }}>
                                                {formatDateTime(item.changed_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <DashboardFooter />
        </div>
    );
}