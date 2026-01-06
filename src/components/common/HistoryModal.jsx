import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";

const HistoryModal = ({ isOpen, toggle, historyData }) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>History</ModalHeader>
      <ModalBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {historyData.length > 0 ? (
            historyData.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <p style={{ margin: "2px 0" }}>
                  <strong>Action:</strong> {item.action}
                </p>
                <p style={{ margin: "2px 0" }}>
                  <strong>Changed By:</strong> {item.changed_by_name || item.changed_by}
                </p>
                <p style={{ margin: "2px 0" }}>
                  <strong>Date:</strong> {new Date(item.changed_at).toLocaleString()}
                </p>
                {item.data && (
                  <div style={{ marginTop: "8px", paddingLeft: "8px", borderLeft: "2px solid #ced4da" }}>
                    <strong>Updated Data:</strong>
                    {Object.keys(item.data).map((key) => (
                      <p key={key} style={{ margin: "2px 0" }}>
                        <strong>{formatKey(key)}:</strong> {item.data[key]}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center">No history found.</p>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};

// Helper to format key names
const formatKey = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default HistoryModal;
