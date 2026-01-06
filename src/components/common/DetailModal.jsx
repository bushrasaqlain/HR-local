import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col } from "reactstrap";

const DetailModal = ({ isOpen, toggle, title, details, fields }) => {
  if (!details || !fields) return null;

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>{title || "Details"}</ModalHeader>
      <ModalBody>
        <div style={{ fontSize: "0.95rem" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {fields.map((key) => {
              const value = details[key];
              if (value === undefined || value === null) return null;

              return (
                <Row
                  key={key}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    alignItems: "center",
                    boxShadow: "0px 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <Col md="4" style={{ fontWeight: 600, color: "#495057" }}>
                    {formatKey(key)}
                  </Col>
                  <Col md="8" style={{ color: "#343a40" }}>
                    {typeof value === "boolean" ? (
                      <span className={`badge ${value ? "bg-success" : "bg-danger"}`}>
                        {value ? "Active" : "Inactive"}
                      </span>
                    ) : (
                      value.toString()
                    )}
                  </Col>
                </Row>
              );
            })}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

// Format key names to readable text
const formatKey = (key) => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default DetailModal;
