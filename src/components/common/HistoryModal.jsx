import React from "react";
import { Modal, ModalHeader, ModalBody } from "reactstrap";

const HistoryModal = ({ isOpen, toggle, historyData }) => {
const renderValue = (value) => {
  if (value === null || value === undefined) return "-";

  if (Array.isArray(value)) return value.join(", ");

  if (typeof value === "object") {
    if (value.name) return value.name;
    if (value.title) return value.title;
    return JSON.stringify(value);
  }

  return value;
};


  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
      <ModalHeader toggle={toggle}>History</ModalHeader>

      <ModalBody
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          backgroundColor: "#f1f3f5",
        }}
      >
        {historyData.length > 0 ? (
          historyData.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#ffffff",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "14px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontWeight: "600", color: "#0d6efd" }}>
                  {item.action}
                </span>
                <span style={{ fontSize: "12px", color: "#6c757d" }}>
                  {new Date(item.changed_at).toLocaleString()}
                </span>
              </div>

              {/* Meta */}
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                <strong>Changed By:</strong>{" "}
                {item.changed_by_name || item.changed_by}
              </p>

              {/* Updated Data */}
              {item.data && (
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid #dee2e6",
                  }}
                >
                  <strong style={{ fontSize: "14px" }}>Updated Data</strong>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr",
                      rowGap: "6px",
                      columnGap: "12px",
                      marginTop: "8px",
                    }}
                  >
                    {Object.keys(item.data).length === 1 && item.data.field
                      ? Object.entries({
                        [item.data.field]: item.data.new,
                      }).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <div
                            style={{
                              fontWeight: "500",
                              fontSize: "13px",
                              color: "#495057",
                            }}
                          >
                            {formatKey(key)}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#212529",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {value || "-"}
                          </div>
                        </React.Fragment>
                      ))
                      : Object.keys(item.data)
                        .filter((key) => key !== "logo")
                        .map((key) => (
                          <React.Fragment key={key}>
                            <div
                              style={{
                                fontWeight: "500",
                                fontSize: "13px",
                                color: "#495057",
                              }}
                            >
                              {formatKey(key)}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#212529",
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {renderValue(item.data[key])}
                            </div>
                          </React.Fragment>
                        ))}
                  </div>
                </div>
              )}

            </div>
          ))
        ) : (
          <p className="text-center text-muted">No history found.</p>
        )}
      </ModalBody>
    </Modal>
  );
};

// Helper
const formatKey = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export default HistoryModal;
