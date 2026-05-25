import React from "react";
import { Card, CardBody, CardHeader } from "reactstrap";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#36565f", "#5f8190", "#93b5be", "#c2d8de", "#e2f0f2", "#708791"];

const LABELS = {
  job_slot:        "Job Slots",
  cv_credits:      "CV Credits",
  duration_bundle: "Duration Bundle",
  daily_budget:    "Daily Budget",
  per_apply:       "Per Apply",
  featured_boost:  "Featured Boost",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "#1f2937", color: "#fff",
      borderRadius: "10px", padding: "10px 14px",
      fontSize: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
        {LABELS[d.pricing_model] || d.pricing_model}
      </div>
      <div>PKR {Number(d.revenue).toLocaleString()}</div>
      <div style={{ color: "#93c5fd" }}>{d.transactions} transactions</div>
      <div style={{ color: "#6ee7b7" }}>{d.companies} companies</div>
    </div>
  );
};

const ModelBreakdown = ({ data = [] }) => {
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <Card style={{ border: "1px solid #e5e7eb", borderRadius: "14px", height: "100%" }}>
      <CardHeader style={{
        background: "#fff", borderBottom: "1px solid #f3f4f6",
        borderRadius: "14px 14px 0 0", padding: "14px 20px",
      }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>By Pricing Model</div>
        <div style={{ fontSize: "11px", color: "#6b7280" }}>Revenue split per model</div>
      </CardHeader>
      <CardBody style={{ padding: "12px" }}>
        {data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "13px" }}>
            No data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data} dataKey="revenue"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* legend rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              {data.map((d, i) => {
                const pct = total > 0 ? ((d.revenue / total) * 100).toFixed(1) : 0;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "10px", height: "10px", borderRadius: "3px",
                      background: COLORS[i % COLORS.length], flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, fontSize: "12px", color: "#374151" }}>
                      {LABELS[d.pricing_model] || d.pricing_model}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>{pct}%</div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#111827" }}>
                      PKR {Number(d.revenue).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default ModelBreakdown;