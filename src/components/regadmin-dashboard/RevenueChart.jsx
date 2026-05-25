import React, { Component } from "react";
import { Card, CardBody, CardHeader } from "reactstrap";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import api from "../../../lib/api";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1f2937", color: "#fff",
      borderRadius: "10px", padding: "10px 14px",
      fontSize: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontWeight: 600, marginBottom: "4px" }}>{label}</div>
      <div>PKR {Number(payload[0].value).toLocaleString()}</div>
      {payload[1] && <div style={{ color: "#93c5fd" }}>{payload[1].value} companies</div>}
    </div>
  );
};

class RevenueChart extends Component {
  constructor(props) {
    super(props);
    this.state = { months: 6, data: props.trend || [] };
  }

  handleMonthChange = async (months) => {
    this.setState({ months });
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
    const { months, data } = this.state;
    const options = [3, 6, 12, 24];

    return (
      <Card style={{ border: "1px solid #e5e7eb", borderRadius: "14px" }}>
        <CardHeader style={{
          background: "#fff", borderBottom: "1px solid #f3f4f6",
          borderRadius: "14px 14px 0 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>Revenue Trend</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>Monthly earnings overview</div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {options.map((m) => (
              <button
                key={m}
                onClick={() => this.handleMonthChange(m)}
                style={{
                  padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
                  fontWeight: 600, cursor: "pointer", border: "1px solid",
                  borderColor: months === m ? "#36565f" : "#e5e7eb",
                  background: months === m ? "#36565f" : "#fff",
                  color: months === m ? "#fff" : "#6b7280",
                }}
              >
                {m}M
              </button>
            ))}
          </div>
        </CardHeader>
        <CardBody style={{ padding: "16px 8px 8px" }}>
          {data.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "13px" }}>
              No trend data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#36565f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#36565f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="revenue"
                  stroke="#36565f" strokeWidth={2.5}
                  fill="url(#revenueGrad)" dot={{ r: 3, fill: "#36565f" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    );
  }
}

export default RevenueChart;