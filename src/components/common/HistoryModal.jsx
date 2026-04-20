import React from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";

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
    if (value.title) return value.title;
    return JSON.stringify(value);
  }
  return String(value);
};

const HistoryModal = ({ isOpen, toggle, historyData = [] }) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
      <ModalHeader toggle={toggle} className="custom-modal-header">
        History
      </ModalHeader>

      <ModalBody style={{ maxHeight: "70vh", overflowY: "auto", backgroundColor: "#f8fafc", padding: "20px" }}>
        <style>{`
          .htimeline { position: relative; padding-left: 32px; }
          .htimeline::before { content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 1.5px; background: #e2e8f0; }
          .hitem { position: relative; margin-bottom: 18px; }
          .hitem:last-child { margin-bottom: 0; }
          .hdot { position: absolute; left: -32px; top: 14px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; border: 2px solid #f8fafc; }
          .dot-added    { background: #ede9fe; color: #5b21b6; }
          .dot-updated  { background: #dbeafe; color: #1e40af; }
          .dot-active   { background: #d1fae5; color: #065f46; }
          .dot-inactive { background: #fee2e2; color: #991b1b; }
          .hcard { background: #ffffff; border: 0.5px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
          .hcard-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
          .hbadge { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
          .badge-added    { background: #ede9fe; color: #5b21b6; }
          .badge-updated  { background: #dbeafe; color: #1e40af; }
          .badge-active   { background: #d1fae5; color: #065f46; }
          .badge-inactive { background: #fee2e2; color: #991b1b; }
          .htime { font-size: 11px; color: #94a3b8; }
          .hby { font-size: 12px; color: #64748b; margin-bottom: 8px; }
          .hby strong { color: #1e293b; }
          .hdata { border-top: 0.5px solid #e2e8f0; padding-top: 10px; display: grid; grid-template-columns: 130px 1fr; row-gap: 6px; column-gap: 12px; margin-top: 8px; }
          .hdata-label { font-size: 12px; color: #64748b; font-weight: 500; }
          .hdata-label-title { font-size: 12px; color: #10b981; font-weight: 600; grid-column: 1 / -1; margin-bottom: 2px; }
          .hdata-val { font-size: 12px; color: #1e293b; font-weight: 500; word-break: break-word; }
        `}</style>

        {historyData.length > 0 ? (
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

                    {/* Top: badge + time */}
                    <div className="hcard-top">
                      <span className={`hbadge ${cfg.cls}`}>{cfg.label}</span>
                      <span className="htime">
                        {new Date(item.changed_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Changed by */}
                    <div className="hby">
                      Changed by: <strong>{item.changed_by_name || item.changed_by}</strong>
                    </div>

                    {/* Data rows */}
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
        ) : (
          <p className="text-center text-muted py-4">No history found.</p>
        )}
      </ModalBody>
    </Modal>
  );
};

export default HistoryModal;