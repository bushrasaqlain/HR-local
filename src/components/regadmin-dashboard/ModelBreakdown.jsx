  import React, { useState } from "react";
  import { Card, CardBody, CardHeader } from "reactstrap";
  import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
  

  const COLORS = ['#36565f','#5f8190','#8fa8b0','#b3cdd3','#3b6d11','#854f0b'];

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
  const [selected, setSelected] = useState(null);
  const filtered = data.filter(d => d.revenue > 0 && !isNaN(d.revenue));
  const total = filtered.reduce((s, d) => s + d.revenue, 0);
  const maxRev = filtered[0]?.revenue || 1;

  return (
    <Card style={{ border: "0.5px solid #e5e7eb", borderRadius: "12px", height: "100%" }}>
      <CardHeader style={{ padding: "14px 18px", borderBottom: "0.5px solid #f3f4f6",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>By pricing model</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Revenue split · click to drill in</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>Total</div>
          <div style={{ fontWeight: 500, fontSize: "17px" }}>PKR {total.toLocaleString()}</div>
        </div>
      </CardHeader>
      <CardBody style={{ padding: "18px" }}>
        {/* mini stacked bar */}
        <div style={{ display: "flex", height: "8px", borderRadius: "999px",
          overflow: "hidden", gap: "1px", marginBottom: "16px" }}>
          {filtered.map((d, i) => (
            <div key={i} style={{ flex: d.revenue, background: COLORS[i % COLORS.length] }} />
          ))}
        </div>
        {/* rows */}
        {filtered.map((d, i) => {
          const pct = total > 0 ? ((d.revenue / total) * 100).toFixed(1) : 0;
          return (
            <div key={i} onClick={() => setSelected(selected === i ? null : i)}
              style={{ display: "flex", alignItems: "center", gap: "10px",
                padding: "7px 6px", cursor: "pointer", borderRadius: "6px",
                background: selected === i ? "#f3f4f6" : "transparent" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2,
                background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <div style={{ width: 130, fontSize: 13, flexShrink: 0 }}>
                {LABELS[d.pricing_model] || d.pricing_model}
              </div>
              <div style={{ flex: 1, height: 6, background: "#f3f4f6",
                borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999,
                  width: `${(d.revenue / maxRev * 100).toFixed(1)}%`,
                  background: COLORS[i % COLORS.length] }} />
              </div>
              <div style={{ width: 36, textAlign: "right", fontSize: 12, color: "#6b7280" }}>{pct}%</div>
              <div style={{ width: 96, textAlign: "right", fontSize: 12, fontWeight: 500 }}>
                PKR {(d.revenue / 1000).toFixed(0)}k
              </div>
            </div>
          );
        })}
        {/* detail panel */}
        {selected !== null && (() => {
          const d = filtered[selected];
          const pct = ((d.revenue / total) * 100).toFixed(1);
          return (
            <div style={{ marginTop: 14, padding: 14, background: "#f9fafb",
              borderRadius: 8, border: "0.5px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3,
                  background: COLORS[selected % COLORS.length] }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {LABELS[d.pricing_model] || d.pricing_model}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, padding: "2px 8px",
                  borderRadius: 20, fontWeight: 500,
                  background: COLORS[selected % COLORS.length] + '22',
                  color: COLORS[selected % COLORS.length] }}>{pct}%</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10, marginTop: 10, textAlign: "center" }}>
                {[['PKR ' + d.revenue.toLocaleString(), 'Revenue'],
                  [d.transactions, 'Transactions'],
                  [d.companies, 'Companies']].map(([val, lbl]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>{val}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </CardBody>
    </Card>
  );
}

  export default ModelBreakdown;