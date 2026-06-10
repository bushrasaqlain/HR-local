// components/admin/revenue/KpiStrip.js
import React from "react";
import { Card, CardBody } from "reactstrap";

const KpiCard = ({ title, value, sub, color }) => (
  <Card className="h-100">
    <CardBody>
      <h6 className="text-muted">{title}</h6>
      <h2 className="fw-bold" style={{ color }}>{value}</h2>
      <p className="small text-muted mb-0">{sub}</p>
    </CardBody>
  </Card>
);

const KpiStrip = ({ summary }) => {
  if (!summary) return null;
  const mom = summary.mom_growth;

  return (
    <div className="row g-3 mt-1">
      <div className="col-6 col-md-4">
        <KpiCard
          title="Total Revenue"
          value={`PKR ${Number(summary.total_revenue).toLocaleString()}`}
          sub="All time"
        />
      </div>
      <div className="col-6 col-md-4">
        <KpiCard
          title="This Month"
          value={`PKR ${Number(summary.revenue_this_month).toLocaleString()}`}
          sub={
            mom !== null
              ? `${mom >= 0 ? "+" : ""}${mom}% vs last month`
              : "No data last month"
          }
          color={mom >= 0 ? "#065f46" : "#991b1b"}
        />
      </div>
      <div className="col-6 col-md-4">
        <KpiCard
          title="Active Subscriptions"
          value={summary.active_subscriptions}
          sub="Right now"
        />
      </div>
      {/* <div className="col-6 col-md-4">
        <KpiCard
          title="Expiring Soon"
          value={summary.expiring_soon}
          sub="Within 7 days"
          color={summary.expiring_soon > 0 ? "#92400e" : undefined}
        />
      </div> */}
    </div>
  );
};

export default KpiStrip;