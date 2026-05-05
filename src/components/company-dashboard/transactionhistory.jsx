import React, { Component } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Head from "next/head";

const TYPE_META = {
  cv_credits:   { label: "CV Credits",   color: "#185FA5", bg: "#E6F1FB" },
  job_slot:     { label: "Job Slots",    color: "#534AB7", bg: "#EEEDFE" },
  subscription: { label: "Subscription", color: "#0F6E56", bg: "#E1F5EE" },
  bundle:       { label: "Bundle",       color: "#854F0B", bg: "#FAEEDA" },
  daily_budget: { label: "Daily Budget", color: "#B45309", bg: "#FEF3C7" },
};

const PAGE_SIZE = 8;

const fmtPrice = (n) => `PKR ${Number(n || 0).toLocaleString("en-PK")}`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "N/A";

// ─── Icons ────────────────────────────────────────────────────────────────────
const SpinnerIcon = () => (
  <svg className="tx-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);
const SearchIcon = () => (
  <svg className="tx-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
class TransactionHistory extends Component {
  constructor(props) {
    super(props);
    this.state = { transactions: [], loading: true, error: null, filter: "all", search: "", page: 1 };
    this.userId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("userId") : null;
  }

  componentDidMount() { this.fetchTransactions(); }

  fetchTransactions = async () => {
    this.setState({ loading: true, error: null });
    try {
      const { userId } = this;
      if (!userId || userId === "undefined") {
        this.setState({ error: "User ID is missing. Please log in again.", loading: false });
        return;
      }
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}job/getTransactionHistory/${userId}`);
      const formatted = (res.data || []).map((t) => ({
        id: t.transaction_id, name: t.package_name, type: t.pricing_model,
        price: t.amount_paid, status: t.status, purchasedAt: t.purchased_at,
        expiresAt: t.end_date, total: t.total_units, used: t.used_units, remaining: t.remaining_units,
      }));
      this.setState({ transactions: formatted, loading: false });
    } catch (err) {
      this.setState({ error: "Failed to load transactions. Please check your connection and try again.", loading: false });
    }
  };

exportPDF = () => {
  const { transactions } = this.state;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header bar — dark teal
  doc.setFillColor(54, 86, 95);  // #36565f
  doc.rect(0, 0, pageW, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17); doc.setFont("helvetica", "bold");
  doc.text("Transaction History", 36, 32);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 220, 224);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}   ·   Total records: ${transactions.length}`, 36, 47);

  const totalSpent = transactions.reduce((s, t) => s + Number(t.price || 0), 0);
  const summaryItems = [
    { label: "Total Spent",    value: fmtPrice(totalSpent) },
    { label: "Total Packages", value: String(transactions.length) },
    { label: "Active",         value: String(transactions.filter((t) => t.status === "active").length) },
    { label: "Expired",        value: String(transactions.filter((t) => t.status === "expired").length) },
  ];

  const boxW = (pageW - 72 - 24) / 4;
  summaryItems.forEach((item, i) => {
    const x = 36 + i * (boxW + 8);

    // Alternating box backgrounds using your two colors
    const isEven = i % 2 === 0;
    const [r, g, b] = isEven ? [54, 86, 95] : [95, 129, 144];  // #36565f : #5f8190
    doc.setFillColor(r, g, b);
    doc.roundedRect(x, 68, boxW, 46, 4, 4, "F");

    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 220, 224);
    doc.text(item.label.toUpperCase(), x + 14, 82);
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(item.value, x + 14, 102);
  });

  autoTable(doc, {
    startY: 126,
    head: [["#", "Package Name", "Type", "Purchased", "Expires", "Units Used", "Amount (PKR)", "Status"]],
    body: transactions.map((t, i) => [
      String(i + 1), t.name || "—", (TYPE_META[t.type] || TYPE_META.bundle).label,
      fmtDate(t.purchasedAt), fmtDate(t.expiresAt), `${t.used ?? 0} / ${t.total ?? 0}`,
      `PKR ${Number(t.price || 0).toLocaleString("en-PK")}`,
      t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : "—",
    ]),
    margin: { left: 36, right: 36 },
    styles: { fontSize: 9, cellPadding: { top: 7, bottom: 7, left: 8, right: 8 }, textColor: [30, 41, 59] },
    headStyles: { fillColor: [54, 86, 95], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 }, // #36565f
    alternateRowStyles: { fillColor: [240, 246, 248] }, // very light teal tint
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 7) {
        const v = (data.cell.raw || "").toLowerCase();
        data.cell.styles.textColor = v === "active" ? [16, 185, 129] : v === "expired" ? [239, 68, 68] : [100, 116, 139];
      }
    },
  });

  doc.save("transaction_history.pdf");
};

  getFiltered() {
    const { transactions, filter, search } = this.state;
    return transactions
      .filter((t) => filter === "all" ? true : filter === "active" ? t.status === "active" : filter === "expired" ? t.status === "expired" : t.type === filter)
      .filter((t) => !search || (t.name || "").toLowerCase().includes(search.toLowerCase()));
  }

  render() {
    const { loading, error, filter, search, page } = this.state;

    if (loading) return (
      <div className="tx-wrap">
        <div className="tx-loading"><SpinnerIcon /> Loading transactions…</div>
      </div>
    );

    if (error) return (
      <div className="tx-wrap">
        <div className="tx-error">{error}</div>
      </div>
    );

    const all = this.state.transactions;
    const filtered = this.getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const totalSpent = all.reduce((s, t) => s + Number(t.price || 0), 0);
    const activeCount = all.filter((t) => t.status === "active").length;
    const expiredCount = all.filter((t) => t.status === "expired").length;

    const FILTERS = [
      { key: "all", label: "All" }, { key: "active", label: "Active" }, { key: "expired", label: "Expired" },
      { key: "cv_credits", label: "CV Credits" }, { key: "job_slot", label: "Job Slots" },
      { key: "subscription", label: "Subscription" }, { key: "bundle", label: "Bundle" },{ key: "daily_budget", label: "Daily Budget" },
    ];

    const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
      .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…"); acc.push(p); return acc; }, []);

    const CARDS = [
      { label: "Total Spent",      value: fmtPrice(totalSpent), sub: "All time",    accent: "#36565f" },
      { label: "Total Packages",   value: all.length,            sub: "Purchased",   accent: "#5f8190" },
      { label: "Active Packages",  value: activeCount,           sub: `${all.length ? Math.round((activeCount / all.length) * 100) : 0}% of total`, accent: "#49839c" },
      { label: "Expired Packages", value: expiredCount,          sub: `${all.length ? Math.round((expiredCount / all.length) * 100) : 0}% of total`, accent: "#37474e" },
    ];

    return (
      <div className="tx-wrap">
<Head>
  <title>Transaction History</title>
</Head>
        <div className="tx-topbar">
          <div>
            <div className="tx-title">Transaction History</div>
            <div className="tx-sub">{all.length} transaction{all.length !== 1 ? "s" : ""} on record</div>
          </div>
          <div className="tx-actions">
            <button className="tx-btn" onClick={this.exportPDF}>↓ Export PDF</button>
            <button className="tx-btn tx-btn-primary" onClick={this.fetchTransactions}>↺ Refresh</button>
          </div>
        </div>

        <div className="tx-cards">
          {CARDS.map((c) => (
            <div key={c.label} className="tx-card" style={{ "--tx-accent": c.accent }}>
              <div className="tx-card-label">{c.label}</div>
              <div className="tx-card-value">{c.value}</div>
              <div className="tx-card-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="tx-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`tx-pill${filter === f.key ? " tx-pill-active" : ""}`}
              onClick={() => this.setState({ filter: f.key, page: 1 })}
            >
              {f.label}
              {f.key === "all" && (
                <span style={{ marginLeft: 5, background: filter === "all" ? "rgba(255,255,255,0.2)" : "#020202", color: filter === "all" ? "#fff" : "#64748b", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                  {all.length}
                </span>
              )}
            </button>
          ))}
          <div className="tx-search-wrap">
            <input className="tx-search" placeholder="Search packages…" value={search} onChange={(e) => this.setState({ search: e.target.value, page: 1 })} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="tx-table-wrap"><div className="tx-empty">No transactions match your current filter.</div></div>
        ) : (
<div className="row">
  <div className="col-12 col-lg-12">
    
    <div className="tx-table-wrap">
      <div className="table-responsive">
       <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead className="text-black" style={{color: "black"}}>
            <tr className="tx-thead" >
              <th className="tx-th tx-col-idx">#</th>
              <th className="tx-th">Package</th>
              <th className="tx-th tx-col-type">Type</th>
              <th className="tx-th tx-col-purchased">Purchased</th>
              <th className="tx-th tx-col-expires">Expires</th>
              <th className="tx-th tx-col-units">Units</th>
              <th className="tx-th">Amount</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((t, i) => {
              const meta   = TYPE_META[t.type] || TYPE_META.bundle;
              const isExp  = t.status === "expired";
              const rowIdx = (safePage - 1) * PAGE_SIZE + i + 1;
              const usePct = t.total > 0 ? Math.min(100, Math.round((t.used / t.total) * 100)) : 0;

              return (
                <tr key={t.id ?? rowIdx} className="tx-row">
                  <td className="tx-idx tx-col-idx">{rowIdx}</td>
                  <td>
                    <div className="tx-pkg-name">{t.name || "—"}</div>
                    <div className="tx-pkg-status" style={{ color: isExp ? "#ef4444" : "#10b981" }}>
                      <span className="tx-dot" style={{ background: isExp ? "#ef4444" : "#10b981" }} />
                      {isExp ? "Expired" : "Active"}
                    </div>
                  </td>
                  <td className="tx-col-type">
                    <span className="tx-badge" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="tx-date tx-col-purchased">{fmtDate(t.purchasedAt)}</td>
                  <td className="tx-date tx-col-expires" style={{ color: isExp ? "#f87171" : "#64748b" }}>
                    {fmtDateShort(t.expiresAt)}
                  </td>
                  <td className="tx-col-units">
                    <div className="tx-units-wrap">
                      <span className="tx-units-text">{t.used ?? 0}/{t.total ?? 0}</span>
                      <div className="tx-bar-bg">
                        <div
                          className="tx-bar-fill"
                          style={{ width: `${usePct}%`, background: isExp ? "#f87171" : meta.color }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="tx-amount">{fmtPrice(t.price)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
         <div className="tx-footer">
    <span className="tx-page-info">
      Showing {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
    </span>
    <div className="tx-page-btns">
      <button className="tx-page-btn" disabled={safePage === 1} onClick={() => this.setState({ page: safePage - 1 })}>← Prev</button>
      {pageNums.map((p, i) => p === "…"
        ? <span key={`e${i}`} style={{ padding: "0 4px", fontSize: 12, color: "#94a3b8" }}>…</span>
        : <button key={p} className={`tx-page-btn${safePage === p ? " tx-page-btn-active" : ""}`} onClick={() => this.setState({ page: p })}>{p}</button>
      )}
      <button className="tx-page-btn" disabled={safePage === totalPages} onClick={() => this.setState({ page: safePage + 1 })}>Next →</button>
    </div>
  </div>
      </div>

    </div>

  </div>
</div>
        )}
      </div>
    );
  }
}

export default TransactionHistory;