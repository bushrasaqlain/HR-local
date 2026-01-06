import React, { Component } from "react";
import { Modal, ModalHeader, ModalBody,Col } from "reactstrap";
import PropTypes from "prop-types";

class DetailModal extends Component {
  render() {
    const { isOpen, toggle, title, details, fields } = this.props;

    if (!details || !fields) return null;

    return (
      <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
        <ModalHeader toggle={toggle} className="bg-primary text-white">
          {title || "Details"}
        </ModalHeader>
        <ModalBody>
          <div className="container-fluid">
            {fields.map((key) => {
              const value = details[key];
              if (value === undefined || value === null) return null;

              return (
                <div
                  key={key}
                  className="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded shadow-sm"
                >
                  <div className="fw-bold text-secondary">
                    {DetailModal.formatKey(key)}
                  </div>
                  <div className="fw-medium text-dark">
                    <Col md="8" style={{ color: "#343a40" }}>
                      {Array.isArray(value) ? (
                        value.length > 0 ? (
                          value.map((v, idx) => (
                            <span
                              key={idx}
                              className="badge bg-info me-1"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {v}
                            </span>
                          ))
                        ) : (
                          "-"
                        )
                      ) : typeof value === "boolean" ? (
                        <span className={`badge ${value ? "bg-success" : "bg-danger"}`}>
                          {value ? "Active" : "Inactive"}
                        </span>
                      ) : (
                        value || "-"
                      )}
                    </Col>

                  </div>
                </div>
              );
            })}
          </div>
        </ModalBody>
      </Modal>
    );
  }

  // Static helper to format keys
  static formatKey(key) {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

DetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  title: PropTypes.string,
  details: PropTypes.object.isRequired,
  fields: PropTypes.array.isRequired,
};

export default DetailModal;
