import React, { Component } from "react";
import { Card, CardBody, CardHeader } from "reactstrap";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import api from "../../../lib/api";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1f2937", color: "#fff",
      borderRadius: "8px", padding: "9px 13px", fontSize: "12px",
    }}>
      <div style={{ fontWeight: 500, marginBottom: "3px" }}>{label}</div>
      <div>PKR {Number(payload[0].value).toLocaleString()}</div>
    </div>
  );
};

class RevenueChart extends Component {
  constructor(props) {
    super(props);
    this.state = { months: 6, data: props.trend || [], activeIndex: null };
  }

  handleMonthChange = async (months) => {
    this.setState({ months, activeIndex: null });
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/admin/revenue/trend", {
        headers: { Authorization: `Bearer ${token}` },
        params: { months },
      });
      this.setState({ data: res.data.data || [] });
    } catch (err) {
      console.error("Trend fetch failed", err);
    }
  };

  render() {
    const { months, data, activeIndex } = this.state;
    const options = [3, 6, 12, 24];
    const total = data.reduce((s, d) => s + (d.revenue || 0), 0);
    const avg = data.length ? Math.round(total / data.length) : 0;
    const peak = data.reduce((p, d) => d.revenue > (p?.revenue || 0) ? d : p, null);

    const btnStyle = (m) => ({
      padding: "4px 11px", borderRadius: "20px", fontSize: "11px",
      fontWeight: 500, cursor: "pointer",
      border: `0.5px solid ${months === m ? "#36565f" : "#e5e7eb"}`,
      background: months === m ? "#36565f" : "transparent",
      color: months === m ? "#fff" : "#6b7280",
      transition: "all .15s",
    });

    const statStyle = {
      background: "#f9fafb", borderRadius: "8px",
      padding: "10px 14px", flex: 1,
    };

    return (
      <Card style={{ border: "0.5px solid #e5e7eb", borderRadius: "12px" }}>
        <CardHeader style={{
          background: "#fff", borderBottom: "0.5px solid #f3f4f6",
          borderRadius: "12px 12px 0 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px",
        }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: "14px", color: "#111827" }}>Revenue trend</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Monthly earnings overview</div>
          </div>
          <div style={{ display: "flex", gap: "5px" }}>
            {options.map((m) => (
              <button key={m} onClick={() => this.handleMonthChange(m)} style={btnStyle(m)}>
                {m}M
              </button>
            ))}
          </div>
        </CardHeader>

        <CardBody style={{ padding: "16px 18px 18px" }}>
          {/* stat strip */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            {[
              ["Peak month", peak ? `${peak.month_label} · PKR ${(peak.revenue/1000).toFixed(0)}k` : "—"],
              ["Period total", `PKR ${(total/1000).toFixed(0)}k`],
              ["Monthly avg", `PKR ${(avg/1000).toFixed(0)}k`],
            ].map(([lbl, val]) => (
              <div key={lbl} style={statStyle}>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>{lbl}</div>
                <div style={{ fontSize: "15px", fontWeight: 500, color: "#111827", marginTop: "2px" }}>{val}</div>
              </div>
            ))}
          </div>

          {data.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "13px" }}>
              No trend data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                onMouseLeave={() => this.setState({ activeIndex: null })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="revenue" radius={[5, 5, 0, 0]} barSize={28}
                  onMouseEnter={(_, i) => this.setState({ activeIndex: i })}>
                  {data.map((_, i) => (
                    <Cell key={i}
                      fill={activeIndex === i ? "#4a7a87" : "#36565f"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    );
  }
}

export default RevenueChart;