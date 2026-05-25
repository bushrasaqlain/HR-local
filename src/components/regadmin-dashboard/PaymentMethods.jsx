import React from "react";
import { Card, CardBody, CardHeader } from "reactstrap";

const METHOD_ICONS = {
  Card:      "💳",
  EasyPaisa: "📱",
  JazzCash:  "🟠",
  Bank:      "🏦",
  QR:        "📷",
};

const METHOD_COLORS = ["#36565f", "#5f8190", "#93b5be", "#c2d8de", "#708791"];

const PaymentMethods = ({ data = [] }) => {
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <Card style={{ border: "1px solid #e5e7eb", borderRadius: "14px" }}>
      <CardHeader style={{
        background: "#fff", borderBottom: "1px solid #f3f4f6",
        borderRadius: "14px 14px 0 0", padding: "14px 20px",
      }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>Payment Methods</div>
        <div style={{ fontSize: "11px", color: "#6b7280" }}>Revenue by payment channel</div>
      </CardHeader>
      <CardBody style={{ padding: "16px 20px" }}>
        {data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: "13px" }}>
            No payment data
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {data.map((d, i) => {
              const pct   = total > 0 ? (d.revenue / total) * 100 : 0;
              const color = METHOD_COLORS[i % METHOD_COLORS.length];
              const icon  = METHOD_ICONS[d.payment_method] || "💰";

              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "18px" }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                          {d.payment_method}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                          PKR {Number(d.revenue).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
                        <span>{d.transactions} transactions</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: "5px", background: "#f3f4f6", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: color, borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default PaymentMethods;