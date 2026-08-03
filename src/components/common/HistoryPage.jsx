import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../lib/api";
import DashboardFooter from "../../layout/dashboard-footer";
import Head from "next/head";

const badgeConfig = {
    ADDED:              { label: "Added",       bg: "#EEEDFE", color: "#3C3489" },
    ACTIVE:             { label: "Active",      bg: "#EAF3DE", color: "#27500A" },
    UPDATED:            { label: "Updated",     bg: "#E6F1FB", color: "#0C447C" },
    INACTIVE:           { label: "Inactive",    bg: "#FCEBEB", color: "#791F1F" },
    PAYMENT:            { label: "Payment",     bg: "#FAEEDA", color: "#633806" },
    PACKAGE_SUBSCRIBED: { label: "Subscribed",  bg: "#E1F5EE", color: "#085041" },
    CREATED:            { label: "Created",     bg: "#FBEAF0", color: "#72243E" },
    APPROVED:           { label: "Approved",    bg: "#EAF3DE", color: "#27500A" },
    SHORTLISTED:        { label: "Shortlisted", bg: "#EEEDFE", color: "#3C3489" },
    CARD_SAVED: { label: "Card Saved", bg: "#FAEEDA", color: "#633806" },
    BOOST_REQUESTED:      { label: "Boost Req",   bg: "#EEEDFE", color: "#3C3489" },
BOOST_ACTIVATED:      { label: "Boosted",      bg: "#EAF3DE", color: "#27500A" },
BOOST_REJECTED:       { label: "Boost Denied", bg: "#FCEBEB", color: "#791F1F" },
APPLIED:              { label: "Applied",      bg: "#E6F1FB", color: "#0C447C" },
INTERVIEW_SCHEDULED:  { label: "Interview",    bg: "#EEEDFE", color: "#3C3489" },
INTERVIEW_CONFIRMED:  { label: "Confirmed",    bg: "#EAF3DE", color: "#27500A" },
RESCHEDULE_REQUESTED: { label: "Reschedule",   bg: "#FAEEDA", color: "#633806" },
OFFER_RECEIVED:       { label: "Offer",        bg: "#E1F5EE", color: "#085041" },
OFFER_ACCEPTED:       { label: "Accepted",     bg: "#EAF3DE", color: "#27500A" },
OFFER_REJECTED:       { label: "Declined",     bg: "#FCEBEB", color: "#791F1F" },
REJECTED:             { label: "Rejected",     bg: "#FCEBEB", color: "#791F1F" },
JOB_APPLIED:                 { label: "Applied",      bg: "#E6F1FB", color: "#0C447C" },
APPLICATION_RECEIVED:        { label: "New App",       bg: "#EEEDFE", color: "#3C3489" },
PROFILE_VIEWED:              { label: "Profile Seen",  bg: "#E1F5EE", color: "#085041" },
CANDIDATE_UNLOCKED:          { label: "Unlocked",      bg: "#FAEEDA", color: "#633806" },
CANDIDATE_PROFILE_REVISITED: { label: "Re-viewed",     bg: "#f8fafc", color: "#64748b" },
VIEWED_APPLICANTS:           { label: "Viewed Apps",   bg: "#f8fafc", color: "#64748b" },
};

const accentColor = {
    ADDED:              "#534AB7",
    ACTIVE:             "#3B6D11",
    UPDATED:            "#185FA5",
    INACTIVE:           "#A32D2D",
    PAYMENT:            "#854F0B",
    PACKAGE_SUBSCRIBED: "#0F6E56",
    CREATED:            "#993556",
    APPROVED:           "#3B6D11",
    SHORTLISTED:        "#534AB7",
    CARD_SAVED: "#854F0B",
    BOOST_REQUESTED:      "#534AB7",
BOOST_ACTIVATED:      "#3B6D11",
BOOST_REJECTED:       "#A32D2D",
APPLIED:              "#185FA5",
INTERVIEW_SCHEDULED:  "#534AB7",
INTERVIEW_CONFIRMED:  "#3B6D11",
RESCHEDULE_REQUESTED: "#854F0B",
OFFER_RECEIVED:       "#0F6E56",
OFFER_ACCEPTED:       "#3B6D11",
OFFER_REJECTED:       "#A32D2D",
REJECTED:             "#A32D2D",
JOB_APPLIED:                 "#185FA5",
APPLICATION_RECEIVED:        "#534AB7",
PROFILE_VIEWED:              "#0F6E56",
CANDIDATE_UNLOCKED:          "#854F0B",
CANDIDATE_PROFILE_REVISITED: "#94a3b8",
VIEWED_APPLICANTS:           "#94a3b8",
};

const formatKey = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const renderValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return value.name || JSON.stringify(value);
    return String(value);
};

const formatDate = (str) =>
    new Date(str).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

// Builds a human-readable summary sentence
const buildSummary = (item) => {
    const who  = item.changed_by_name || item.changed_by || "System";
    const when = formatDate(item.changed_at);
    const event = item.readable_event || item.action;
    return { who, when, event };
};
const actionTextMap = {
    ADDED: "added",
    ACTIVE: "activated",
    UPDATED: "updated",
    PAYMENT: "recorded a payment",
    PACKAGE_SUBSCRIBED: "subscribed to a package",
    CREATED: "created",
    APPROVED: "approved",
    SHORTLISTED: "shortlisted a candidate",
};
const fieldLabels = {
    company_name:            "Company name",
    Business_entity_type_id: "Business type",
    phone:                   "Phone",
    country_id:              "Country",
    district_id:             "District",
    city_id:                 "City",
    company_address:         "Address",
    company_website:         "Website",
    NTN:                     "NTN",
    size_of_company:         "Company size",
    established_date:        "Established date",
    username:                "Username",
    email:                   "Email",
};

const buildSentence = (item) => {
    const who = item.changed_by_name || item.changed_by || "System";
    const when = new Date(item.changed_at).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    }).replace(",", " at");

    const entity = item.entity_type;
    const data = item.data || {};
const actionMap = {
    employer: {
        ADDED: (data) => {
            if (data?.event === "Company profile created") return "completed the company profile";
            return "signed up";
        },
        CREATED:  "created a company profile",
        UPDATED:  "updated the company profile",
        ACTIVE:   "activated the account",
        INACTIVE: "deactivated the account",
         CARD_SAVED: () => "saved a payment card",
         APPLICATION_RECEIVED:        (data) => `received a new application for job: ${data?.jobTitle || ""}`,
CANDIDATE_UNLOCKED:          (data) => `unlocked a candidate profile for job: ${data?.jobTitle || ""}`,
CANDIDATE_PROFILE_REVISITED: (data) => `re-viewed an already unlocked profile for job: ${data?.jobTitle || ""}`,
VIEWED_APPLICANTS:           (data) => `viewed applicants for job: ${data?.jobTitle || ""}`,
    },
        job: {
            CREATED:  "created a job posting",
            UPDATED:  "updated the job posting",
            APPROVED: "approved the job",
            ACTIVE:   "activated the job",
            INACTIVE: "deactivated the job",
        },
        candidate: {
        ADDED:       "was added to the system",
        UPDATED:     "updated their profile",
        SHORTLISTED: (data) => `was shortlisted for job: ${data?.job_title || data?.event?.split("job: ")[1]?.split(" at")[0] || ""}`,
        APPROVED:    (data) => `was approved for job: ${data?.job_title || ""}`,
        REJECTED:    (data) => `was rejected for job: ${data?.job_title || ""}`,
        BOOST_REQUESTED:      "requested a profile boost",
BOOST_ACTIVATED:      "had their profile boost activated by admin",
BOOST_REJECTED:       "had their boost request rejected by admin",
APPLIED:              (data) => `applied for job: ${data?.job_title || ""}`,
INTERVIEW_SCHEDULED:  (data) => `was scheduled for an interview for: ${data?.job_title || ""}`,
INTERVIEW_CONFIRMED:  (data) => `confirmed the interview for: ${data?.job_title || ""}`,
RESCHEDULE_REQUESTED: (data) => `requested a reschedule for: ${data?.job_title || ""}`,
OFFER_RECEIVED:       (data) => `received an offer for: ${data?.job_title || ""}`,
OFFER_ACCEPTED:       (data) => `accepted the offer for: ${data?.job_title || ""}`,
OFFER_REJECTED:       (data) => `declined the offer for: ${data?.job_title || ""}`,
REJECTED:             (data) => `was rejected for job: ${data?.job_title || ""}`,
JOB_APPLIED:    (data) => `applied for job: ${data?.jobTitle || ""} at ${data?.companyName || ""}`,
PROFILE_VIEWED: (data) => `profile was viewed by an employer for job: ${data?.jobTitle || ""}`,
    },
    
    };
const actionEntry = actionMap[entity]?.[item.action];
    const actionText = typeof actionEntry === "function"
    ? actionEntry(data)
    : typeof actionEntry === "string"
    ? actionEntry
    : item.action.replace(/_/g, " ").toLowerCase();

    const summary = `${who} ${actionText} on ${when}.`;
    const details = [];
    if (item.action === "ADDED" && data.event === "Company profile created") {
    const profileFields = [
        "company_name", "phone", "NTN", "size_of_company",
        "established_date", "company_address", "company_website",
        "username", "email"
    ];
    profileFields.forEach((key) => {
        if (data[key]) {
            const label = fieldLabels[key] || formatKey(key);
            details.push(`${label}: ${data[key]}`);
        }
    });
}

    // ✅ Handle UPDATED with changes diff
    if (item.action === "UPDATED" && data.changes && typeof data.changes === "object") {
        Object.entries(data.changes).forEach(([key, val]) => {
            if (!val || (val.from === val.to)) return;
            const label = fieldLabels[key] || formatKey(key);
            const from  = val.from ?? "-";
            const to    = val.to   ?? "-";
            details.push(`${label} changed from "${from}" → "${to}"`);
        });
    }

    // Payment details
    if (data.amount)   details.push(`Amount: ${data.amount} ${data.currency || ""}`);
    if (data.method)   details.push(`Payment method: ${data.method}`);
    if (data.package_name)   details.push(`Package: ${data.package_name}`);
    if (data.pricing_model)  details.push(`Pricing model: ${data.pricing_model}`);
    if (data.job_title && item.action !== "UPDATED") details.push(`Job: ${data.job_title}`);
    if (data.billing_model)  details.push(`Billing model: ${data.billing_model}`);
// Add this after the payment details block:
if (item.action === "CARD_SAVED") {
    if (data.card_brand) details.push(`Card brand: ${data.card_brand}`);
    if (data.card_last4) details.push(`Card ending in: ${data.card_last4}`);
}
    return { summary, details };
};
const HistoryPage = ({ inlineId, inlineType, onBack }) => {
  const router = useRouter();
  const id   = inlineId  || router.query.id;
  const type = inlineType || router.query.type;

    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");
    const [openId, setOpenId]           = useState(null);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        if (id && type) fetchHistory();
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
        } catch {
            setError("Failed to load history.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ textAlign: "center", padding: "80px" }}>
            <div className="spinner-border" style={{ color: "#36565F" }} />
            <p style={{ marginTop: "12px", color: "#64748b", fontSize: "13px" }}>Loading history…</p>
        </div>
    );

    if (error) return (
        <p style={{ textAlign: "center", color: "red", padding: "60px" }}>{error}</p>
    );

    return (
        <>
            <style>{`
                .hp-wrap {
                    padding: 24px;
                    // padding-top: 110px;
                    padding-bottom: 100px;
                    background: #f8fafc;
                    min-height: 100vh;
                }
                .hp-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .hp-back {
                    background: #fff;
                    border: 0.5px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 8px 14px;
                    cursor: pointer;
                    font-size: 13px;
                    color: #36565F;
                    font-weight: 500;
                }
                .hp-back:hover { background: #f1f5f9; }
                .hp-title { margin: 0; font-size: 20px; font-weight: 600; color: #1e293b; }

                .hp-feed {
                    display: flex;
                    flex-direction: column;
                    border: 0.5px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #fff;
                }
                .hp-item { border-bottom: 0.5px solid #f1f5f9; }
                .hp-item:last-child { border-bottom: none; }

                .hp-row {
                    display: flex;
                    align-items: center;
                    padding: 14px 18px;
                    cursor: pointer;
                    gap: 14px;
                    transition: background 0.12s;
                    user-select: none;
                }
                .hp-row:hover { background: #f8fafc; }
                .hp-item.hp-open .hp-row { background: #f8fafc; }

                .hp-accent {
                    width: 3px;
                    height: 36px;
                    border-radius: 2px;
                    flex-shrink: 0;
                }
                .hp-badge {
                    font-size: 11px;
                    font-weight: 500;
                    padding: 3px 10px;
                    border-radius: 20px;
                    flex-shrink: 0;
                    min-width: 76px;
                    text-align: center;
                }
                .hp-row-info { flex: 1; min-width: 0; }
                .hp-row-by {
                    font-size: 13px;
                    color: #1e293b;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .hp-row-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }
                .hp-chevron {
                    color: #cbd5e1;
                    font-size: 15px;
                    flex-shrink: 0;
                    transition: transform 0.22s ease;
                }
                .hp-item.hp-open .hp-chevron {
                    transform: rotate(90deg);
                    color: #64748b;
                }

                /* accordion body */
                .hp-body {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }
                .hp-item.hp-open .hp-body { max-height: 800px; }

                .hp-body-inner {
                    padding: 16px 20px 20px 52px;
                    border-top: 0.5px solid #f1f5f9;
                }

                /* summary sentence */
                .hp-summary {
                    font-size: 13.5px;
                    color: #334155;
                    line-height: 1.7;
                    margin-bottom: 16px;
                }
                .hp-summary strong { color: #0f172a; font-weight: 600; }
                .hp-summary .hp-when {
                    display: inline-block;
                    background: #f1f5f9;
                    color: #475569;
                    font-size: 11.5px;
                    padding: 1px 7px;
                    border-radius: 5px;
                    font-weight: 500;
                    margin-left: 2px;
                }

                /* fields grid */
                .hp-fields-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.07em;
                    text-transform: uppercase;
                    color: #94a3b8;
                    margin-bottom: 10px;
                }
                .hp-fields {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .hp-field-chip {
                    display: flex;
                    align-items: baseline;
                    gap: 5px;
                    background: #f8fafc;
                    border: 0.5px solid #e2e8f0;
                    border-radius: 7px;
                    padding: 5px 10px;
                    font-size: 12px;
                }
                .hp-field-chip-key {
                    color: #94a3b8;
                    font-weight: 500;
                    white-space: nowrap;
                }
                .hp-field-chip-val {
                    color: #1e293b;
                    font-weight: 600;
                    word-break: break-word;
                }

                .hp-empty { text-align: center; padding: 60px 0; color: #94a3b8; font-size: 14px; }
                .hp-changes {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
}

.hp-change-item {
    background: #f8fafc;
    border: 0.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12.5px;
    color: #334155;
    line-height: 1.5;
}
            `}</style>
<Head>
    <title>History</title>
</Head>
            <div className="hp-wrap">
                <div className="hp-header">
                    
<button className="hp-back" onClick={onBack || (() => {
  const from = router.query.from || "district";
  sessionStorage.setItem("activeTab", from);
  window.location.href = "/"; // or your actual dashboard root route
})}>← Back</button>
                    <h2 className="hp-title">History</h2>
                </div>

                {historyData.length === 0 ? (
                    <div className="hp-empty">No history found.</div>
                ) : (
                    <div className="hp-feed">
                        {historyData.map((item, index) => {
                            const badge   = badgeConfig[item.action] || { label: item.action, bg: "#F1EFE8", color: "#5F5E5A" };
                            const accent  = accentColor[item.action] || "#888780";
                            const isOpen  = openId === (item.id || index);
                            const { who, when, event } = buildSummary(item);

                            const entries = item.data
                                ? Object.entries(item.data).filter(
                                    ([k, v]) =>
                                        k !== "logo" &&
                                        k !== "event" &&
                                        v !== null &&
                                        v !== undefined &&
                                        v !== ""
                                  )
                                : [];

                            return (
                                <div
                                    key={item.id || index}
                                    className={`hp-item ${isOpen ? "hp-open" : ""}`}
                                >
                                    <div
                                        className="hp-row"
                                        onClick={() => setOpenId(isOpen ? null : (item.id || index))}
                                    >
                                        <div className="hp-accent" style={{ background: accent }} />
                                        <span className="hp-badge" style={{ background: badge.bg, color: badge.color }}>
                                            {badge.label}
                                        </span>
                                        <div className="hp-row-info">
                                            <div className="hp-row-by">
                                                 <strong style={{ color: "#0f172a" }}>{who}</strong>
                                            </div>
                                            <div className="hp-row-time">{when}</div>
                                        </div>
                                        <span className="hp-chevron">›</span>
                                    </div>

                                    <div className="hp-body">
                                        <div className="hp-body-inner">

                                            {/* Human-readable summary */}
{/* Human-readable summary */}
{(() => {
    const result = buildSentence(item);

    // Special card display
    if (item.action === "CARD_SAVED" && item.data?.card_last4) {
        const brandColors = {
            visa:       { bg: "#1A1F71", label: "VISA" },
            mastercard: { bg: "#EB001B", label: "MC" },
            amex:       { bg: "#007BC1", label: "AMEX" },
            discover:   { bg: "#FF6600", label: "DISC" },
        };
        const brand = brandColors[item.data.card_brand?.toLowerCase()] || { bg: "#64748b", label: "CARD" };

        return (
            <>
                <p className="hp-summary">{result.summary}</p>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#f8fafc",
                    border: "0.5px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    marginTop: "4px",
                }}>
                    <div style={{
                        background: brand.bg,
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        letterSpacing: "0.05em",
                    }}>
                        {brand.label}
                    </div>
                    <span style={{
                        fontSize: "13px",
                        color: "#1e293b",
                        fontWeight: "500",
                        letterSpacing: "0.1em",
                        fontFamily: "monospace",
                    }}>
                        •••• •••• •••• {item.data.card_last4}
                    </span>
                </div>
            </>
        );
    }

    // Special payment display
    if (item.action === "PAYMENT" && item.data?.amount) {
        return (
            <>
                <p className="hp-summary">{result.summary}</p>
                <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "4px",
                }}>
                    <div style={{
                        background: "#FAEEDA",
                        border: "0.5px solid #f5d9a8",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        fontSize: "13px",
                        color: "#633806",
                        fontWeight: "600",
                    }}>
                        {item.data.currency || "PKR"} {item.data.amount}
                    </div>
                    {item.data.method && (
                        <div style={{
                            background: "#f8fafc",
                            border: "0.5px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "12px",
                            color: "#64748b",
                        }}>
                            via {item.data.method}
                        </div>
                    )}
                    {item.data.package_name && (
                        <div style={{
                            background: "#E1F5EE",
                            border: "0.5px solid #9FE1CB",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "12px",
                            color: "#085041",
                        }}>
                            {item.data.package_name}
                        </div>
                    )}
                </div>
            </>
        );
    }

    // Special package subscribed display
    if (item.action === "PACKAGE_SUBSCRIBED") {
        return (
            <>
                <p className="hp-summary">{result.summary}</p>
                <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "4px",
                }}>
                    {item.data?.package_name && (
                        <div style={{
                            background: "#E1F5EE",
                            border: "0.5px solid #9FE1CB",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "13px",
                            color: "#085041",
                            fontWeight: "600",
                        }}>
                            {item.data.package_name}
                        </div>
                    )}
                    {item.data?.pricing_model && (
                        <div style={{
                            background: "#f8fafc",
                            border: "0.5px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "12px",
                            color: "#64748b",
                        }}>
                            {item.data.pricing_model.replace(/_/g, " ")}
                        </div>
                    )}
                </div>
            </>
        );
    }

    // Default: summary + change bullets
    return (
        <>
            <p className="hp-summary">{result.summary}</p>
            {(result.details || []).length > 0 && (
                <div className="hp-changes">
                    {result.details.map((change, idx) => (
                        <div key={idx} className="hp-change-item">
                            • {change}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
})()}

                                            {/* Updated fields as chips
                                            {entries.length > 0 && (
                                                <>
                                                    <div className="hp-fields-label">Updated fields</div>
                                                    <div className="hp-fields">
                                                        {entries.map(([key, value]) => (
                                                            <div className="hp-field-chip" key={key}>
                                                                <span className="hp-field-chip-key">{formatKey(key)}:</span>
                                                                <span className="hp-field-chip-val">{renderValue(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )} */}

                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <DashboardFooter />
        </>
    );
};

export default HistoryPage;