import React, { Component } from "react";
import { Card, CardBody, CardHeader, Input, Button, Alert } from "reactstrap";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
} from "recharts";
import api from "../../../lib/api";

// ─── Tooltips ────────────────────────────────────────────────────────────────

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1f2937", color: "#fff", borderRadius: "8px", padding: "9px 13px", fontSize: "12px" }}>
      <div style={{ fontWeight: 500, marginBottom: "3px" }}>{label}</div>
      <div>PKR {Number(payload[0].value).toLocaleString()}</div>
    </div>
  );
};

const SpendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1f2937", color: "#fff", borderRadius: "8px", padding: "9px 13px", fontSize: "12px" }}>
      <div style={{ fontWeight: 500, marginBottom: "3px" }}>{label}</div>
      <div>PKR {Number(payload[0].value).toLocaleString()}</div>
      {payload[1] && <div style={{ color: "#9ca3af", marginTop: "2px" }}>{payload[1].value} clicks</div>}
    </div>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardStyle  = { border: "0.5px solid #e5e7eb", borderRadius: "12px", marginBottom: "20px" };
const headerStyle = {
  background: "#fff", borderBottom: "0.5px solid #f3f4f6",
  borderRadius: "12px 12px 0 0",
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "14px 18px",
};
const statStyle = { background: "#f9fafb", borderRadius: "8px", padding: "10px 14px", flex: 1 };
const emptyStyle = { textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "13px" };

const pillBtn = (active) => ({
  padding: "4px 11px", borderRadius: "20px", fontSize: "11px",
  fontWeight: 500, cursor: "pointer",
  border: `0.5px solid ${active ? "#36565f" : "#e5e7eb"}`,
  background: active ? "#36565f" : "transparent",
  color: active ? "#fff" : "#6b7280",
  transition: "all .15s",
});

// ─── Main Component ───────────────────────────────────────────────────────────

class RevenueChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // trend
      months: 6,
      trendData: props.trend || [],
      activeIndex: null,

      // daily spend
      spendDays: 30,
      spendData: [],
      spendLoading: false,
      spendAccountId: "",

      // refund / adjustment
      refundType: "refund",
      rfAccountId: "",
      rfAmount: "",
      rfPaymentId: "",
      rfDescription: "",
      rfSuccess: null,
      rfError: null,
    };
  }

  // ── Trend ──────────────────────────────────────────────────────────────────

  handleMonthChange = async (months) => {
    this.setState({ months, activeIndex: null });
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/revenue/trend", {
        headers: { Authorization: `Bearer ${token}` },
        params: { months },
      });
      this.setState({ trendData: res.data.data || [] });
    } catch (err) {
      console.error("Trend fetch failed", err);
    }
  };

  // ── Daily Spend ────────────────────────────────────────────────────────────

  fetchDailySpend = async (days, accountId) => {
    const id = accountId ?? this.state.spendAccountId;
    if (!id) return;
    this.setState({ spendLoading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/revenue/daily-spend/account/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { days },
      });
      this.setState({ spendData: res.data || [], spendDays: days });
    } catch (err) {
      console.error("Daily spend fetch failed", err);
    } finally {
      this.setState({ spendLoading: false });
    }
  };

  // ── Refund / Adjustment ────────────────────────────────────────────────────

  handleRefundSubmit = async () => {
    const { refundType, rfAccountId, rfAmount, rfDescription, rfPaymentId } = this.state;
    if (!rfAccountId || !rfAmount) {
      return this.setState({ rfError: "Account ID and amount are required", rfSuccess: null });
    }
    try {
      const token = localStorage.getItem("token");
      const endpoint = refundType === "refund"
        ? "/revenue/refund"
        : "/revenue/adjustment";
      const payload = refundType === "refund"
        ? { account_id: rfAccountId, amount: rfAmount, description: rfDescription, payment_id: rfPaymentId || undefined }
        : { account_id: rfAccountId, amount: rfAmount, description: rfDescription };

      await api.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
      this.setState({
        rfSuccess: `${refundType === "refund" ? "Refund" : "Adjustment"} logged successfully`,
        rfError: null,
        rfAccountId: "", rfAmount: "", rfPaymentId: "", rfDescription: "",
      });
    } catch (err) {
      this.setState({ rfError: err.response?.data?.error || "Request failed", rfSuccess: null });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  render() {
    const {
      months, trendData, activeIndex,
      spendDays, spendData, spendLoading, spendAccountId,
      refundType, rfAccountId, rfAmount, rfPaymentId, rfDescription, rfSuccess, rfError,
    } = this.state;

    // trend stats
    const trendOptions = [3, 6, 12, 24];
    const total = trendData.reduce((s, d) => s + (d.revenue || 0), 0);
    const avg   = trendData.length ? Math.round(total / trendData.length) : 0;
    const peak  = trendData.reduce((p, d) => d.revenue > (p?.revenue || 0) ? d : p, null);

    const spendOptions = [7, 14, 30, 60];

    const inputStyle = {
      fontSize: "12px", borderRadius: "6px",
      border: "0.5px solid #e5e7eb", marginBottom: "10px",
    };
    const labelStyle = { fontSize: "11px", color: "#6b7280", marginBottom: "3px", display: "block" };

    return (
      <div>

        {/* ── 1. Revenue Trend ─────────────────────────────────────────── */}
        <Card style={cardStyle}>
          <CardHeader style={headerStyle}>
            <div>
              <div style={{ fontWeight: 500, fontSize: "14px", color: "#111827" }}>Revenue Trend</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Monthly earnings overview</div>
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              {trendOptions.map((m) => (
                <button key={m} onClick={() => this.handleMonthChange(m)} style={pillBtn(months === m)}>
                  {m}M
                </button>
              ))}
            </div>
          </CardHeader>

          <CardBody style={{ padding: "16px 18px 18px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              {[
                ["Peak month",   peak ? `${peak.month_label} · PKR ${(peak.revenue / 1000).toFixed(0)}k` : "—"],
                ["Period total", `PKR ${(total / 1000).toFixed(0)}k`],
                ["Monthly avg",  `PKR ${(avg / 1000).toFixed(0)}k`],
              ].map(([lbl, val]) => (
                <div key={lbl} style={statStyle}>
                  <div style={{ fontSize: "11px", color: "#9ca3af" }}>{lbl}</div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "#111827", marginTop: "2px" }}>{val}</div>
                </div>
              ))}
            </div>

            {trendData.length === 0 ? (
              <div style={emptyStyle}>No trend data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  onMouseLeave={() => this.setState({ activeIndex: null })}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="revenue" radius={[5, 5, 0, 0]} barSize={28}
                    onMouseEnter={(_, i) => this.setState({ activeIndex: i })}>
                    {trendData.map((_, i) => (
                      <Cell key={i} fill={activeIndex === i ? "#4a7a87" : "#36565f"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* ── 2. Daily Spend ───────────────────────────────────────────── */}
        {/* <Card style={cardStyle}>
          <CardHeader style={headerStyle}>
            <div>
              <div style={{ fontWeight: 500, fontSize: "14px", color: "#111827" }}>Daily Spend</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Per-day budget consumption by account</div>
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              {spendOptions.map((d) => (
                <button key={d} onClick={() => this.fetchDailySpend(d)} style={pillBtn(spendDays === d)}>
                  {d}D
                </button>
              ))}
            </div>
          </CardHeader>

          <CardBody style={{ padding: "16px 18px 18px" }}>
           
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", alignItems: "center" }}>
              <Input
                bsSize="sm"
                placeholder="Enter Account ID"
                value={spendAccountId}
                onChange={(e) => this.setState({ spendAccountId: e.target.value })}
                style={{ ...inputStyle, marginBottom: 0, maxWidth: "180px" }}
              />
              <Button
                size="sm"
                disabled={spendLoading || !spendAccountId}
                onClick={() => this.fetchDailySpend(spendDays)}
                style={{ background: "#36565f", border: "none", borderRadius: "6px", fontSize: "12px" }}
              >
                {spendLoading ? "Loading…" : "Load"}
              </Button>
            </div>

            {spendData.length === 0 ? (
              <div style={emptyStyle}>Enter an account ID and click Load</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                  {(() => {
                    const totalSpend  = spendData.reduce((s, d) => s + (d.total_spend || 0), 0);
                    const totalClicks = spendData.reduce((s, d) => s + (d.total_clicks || 0), 0);
                    const peakDay     = spendData.reduce((p, d) => d.total_spend > (p?.total_spend || 0) ? d : p, null);
                    return [
                      ["Total spend",   `PKR ${(totalSpend / 1000).toFixed(1)}k`],
                      ["Total clicks",  totalClicks.toLocaleString()],
                      ["Peak day",      peakDay ? `${peakDay.spend_date} · PKR ${(peakDay.total_spend / 1000).toFixed(1)}k` : "—"],
                    ].map(([lbl, val]) => (
                      <div key={lbl} style={statStyle}>
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{lbl}</div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827", marginTop: "2px" }}>{val}</div>
                      </div>
                    ));
                  })()}
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={spendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#36565f" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#36565f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="spend_date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<SpendTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Area dataKey="total_spend" stroke="#36565f" strokeWidth={2}
                      fill="url(#spendGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </CardBody>
        </Card> */}

        {/* ── 3. Refund / Adjustment ───────────────────────────────────── */}
        {/* <Card style={{ ...cardStyle, marginBottom: 0 }}>
          <CardHeader style={headerStyle}>
            <div>
              <div style={{ fontWeight: 500, fontSize: "14px", color: "#111827" }}>Issue Refund / Adjustment</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Logged as immutable billing events</div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["refund", "adjustment"].map((t) => (
                <button key={t} onClick={() => this.setState({ refundType: t, rfSuccess: null, rfError: null })}
                  style={pillBtn(refundType === t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardBody style={{ padding: "16px 18px 18px" }}>
            {rfSuccess && <Alert color="success" style={{ fontSize: "12px", padding: "8px 12px" }}>{rfSuccess}</Alert>}
            {rfError   && <Alert color="danger"  style={{ fontSize: "12px", padding: "8px 12px" }}>{rfError}</Alert>}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>

              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>Account ID</label>
                <Input bsSize="sm" value={rfAccountId}
                  onChange={(e) => this.setState({ rfAccountId: e.target.value })}
                  style={inputStyle} />
              </div>

              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>
                  Amount (PKR){refundType === "adjustment" ? " — negative to debit" : ""}
                </label>
                <Input bsSize="sm" type="number" value={rfAmount}
                  onChange={(e) => this.setState({ rfAmount: e.target.value })}
                  style={inputStyle} />
              </div>

              {refundType === "refund" && (
                <div style={{ flex: "1 1 160px" }}>
                  <label style={labelStyle}>Payment ID (optional)</label>
                  <Input bsSize="sm" value={rfPaymentId}
                    onChange={(e) => this.setState({ rfPaymentId: e.target.value })}
                    style={inputStyle} />
                </div>
              )}

              <div style={{ flex: "2 1 220px" }}>
                <label style={labelStyle}>Description</label>
                <Input bsSize="sm" value={rfDescription}
                  onChange={(e) => this.setState({ rfDescription: e.target.value })}
                  style={inputStyle} />
              </div>

            </div>

            <Button
              size="sm"
              onClick={this.handleRefundSubmit}
              style={{ background: "#36565f", border: "none", borderRadius: "8px", fontSize: "12px", marginTop: "4px" }}
            >
              Submit {refundType === "refund" ? "Refund" : "Adjustment"}
            </Button>
          </CardBody>
        </Card> */}

      </div>
    );
  }
}

export default RevenueChart;