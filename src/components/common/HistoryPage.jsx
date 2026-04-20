import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../lib/api";
import DashboardFooter from "../../layout/dashboard-footer";

const badgeConfig = {
    ADDED: { label: "Added", cls: "badge-added", dot: "dot-added", sym: "+" },
    UPDATED: { label: "Updated", cls: "badge-updated", dot: "dot-updated", sym: "↻" },
    ACTIVE: { label: "Active", cls: "badge-active", dot: "dot-active", sym: "✓" },
    INACTIVE: { label: "Inactive", cls: "badge-inactive", dot: "dot-inactive", sym: "✕" },
};

const formatKey = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const renderValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") {
        if (value.name) return value.name;
        return JSON.stringify(value);
    }
    return String(value);
};

const HistoryPage = () => {
    const router = useRouter();
    const { id, type } = router.query; // URL se id aur type milega

    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        if (id && type) {
            fetchHistory();
        }
    }, [id, type]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(`${apiBaseUrl}gethistory/${id}/${type}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const filtered = (res.data.history || []).map((item) => {
                if (item.data) {
                    const { logo, ...rest } = item.data;
                    return { ...item, data: rest };
                }
                return item;
            });

            setHistoryData(filtered);
        } catch (err) {
            setError("History load nahi ho saki");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "60px" }}>
                <div className="spinner-border" style={{ color: "#36565F" }} />
                <p style={{ marginTop: "12px", color: "#64748b" }}>Loading history...</p>
            </div>
        );
    }

    if (error) {
        return <p style={{ textAlign: "center", color: "red", padding: "40px" }}>{error}</p>;
    }

    return (
        <>
            <style>{`
        .htimeline{position:relative;padding-left:32px}
        .htimeline::before{content:'';position:absolute;left:11px;top:0;bottom:0;width:1.5px;background:#e2e8f0}
        .hitem{position:relative;margin-bottom:18px}
        .hitem:last-child{margin-bottom:0}
        .hdot{position:absolute;left:-32px;top:14px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;border:2px solid #f8fafc}
        .dot-added{background:#ede9fe;color:#5b21b6}
        .dot-updated{background:#dbeafe;color:#1e40af}
        .dot-active{background:#d1fae5;color:#065f46}
        .dot-inactive{background:#fee2e2;color:#991b1b}
        .hcard{background:#ffffff;border:0.5px solid #e2e8f0;border-radius:10px;padding:20px 24px}
        .hcard-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
        .hbadge{font-size:11px;font-weight:500;padding:3px 10px;border-radius:20px}
        .badge-added{background:#ede9fe;color:#5b21b6}
        .badge-updated{background:#dbeafe;color:#1e40af}
        .badge-active{background:#d1fae5;color:#065f46}
        .badge-inactive{background:#fee2e2;color:#991b1b}
        .htime {font-size: 13px;color: #1e293b;font-weight: 500;margin-left: 6px;}
        .hby{font-size:12px;color:#64748b;margin-bottom:8px}
        .hby strong{color:#1e293b}
        .hdata{border-top:0.5px solid #e2e8f0;padding-top:10px;display:grid;grid-template-columns:130px 1fr;row-gap:6px;column-gap:12px;margin-top:8px}
        .hdata-label{font-size:12px;color:#64748b;font-weight:500}
        .hdata-label-title{font-size:12px;color:#10b981;font-weight:600;grid-column:1 / -1;margin-bottom:2px}
        .hdata-val{font-size:12px;color:#1e293b;font-weight:500;word-break:break-word}
      `}</style>

            <div className="container-fluid"
                style={{
                    padding: "24px",
                    paddingTop: "120px",
                    paddingBottom: "100px",
                    background: "#f8fafc",
                    minHeight: "100vh"
                }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            background: "white",
                            border: "0.5px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "#36565F",
                            fontWeight: "500"
                        }}
                    >
                        ← Back
                    </button>
                    <div>
                        <h2 style={{ margin: 0, color: "#1e293b", fontWeight: "600" }}>
                            History
                        </h2>
                    </div>
                </div>

                {/* Timeline */}
                {historyData.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#94a3b8", padding: "60px 0" }}>
                        No history found
                    </p>
                ) : (
                    <div style={{ width: "100%" }}>
                        <div className="htimeline">
                            {historyData.map((item, index) => {
                                const cfg = badgeConfig[item.action] || badgeConfig.UPDATED;
                                const dataEntries = item.data
                                    ? Object.entries(item.data).filter(
                                        ([k, v]) => k !== "logo" && v !== null && v !== undefined && v !== ""
                                    )
                                    : [];

                                return (
                                    <div className="hitem" key={index}>
                                        <div className={`hdot ${cfg.dot}`}>{cfg.sym}</div>
                                        <div className="hcard">
                                            <div className="hcard-top">
                                                <span className={`hbadge ${cfg.cls}`}>{cfg.label}</span>
                                            </div>
                                            <div className="hby">
                                                Changed by: <strong>{item.changed_by_name || item.changed_by}</strong>
                                                <span className="htime"> • {new Date(item.changed_at).toLocaleString()}</span>
                                            </div>
                                            {dataEntries.length > 0 && (
                                                <div className="hdata">
                                                    <span className="hdata-label-title">Updated Data</span>
                                                    {item.readable_event && (
                                                        <>
                                                            <span className="hdata-label">Event</span>
                                                            <span className="hdata-val">{item.readable_event}</span>
                                                        </>
                                                    )}
                                                    {dataEntries.map(([key, value]) =>
                                                        key !== "event" ? (
                                                            <React.Fragment key={key}>
                                                                <span className="hdata-label">{formatKey(key)}</span>
                                                                <span className="hdata-val">{renderValue(value)}</span>
                                                            </React.Fragment>
                                                        ) : null
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
         <DashboardFooter />
        </>
    );
};

export default HistoryPage;