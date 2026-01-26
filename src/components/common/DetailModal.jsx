import React, { Component } from "react";
import { Modal, ModalHeader, ModalBody, Row, Col } from "reactstrap";
import PropTypes from "prop-types";

class DetailModal extends Component {
  static formatValue(value) {
    if (value === undefined || value === null || value === "") return "-";

    // ✅ Time formatting (HH:mm:ss or HH:mm) -> "6:05 PM"
    if (typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
      const [hStr, mStr] = value.split(":");
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);

      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;

      return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
    }

    // ✅ Date formatting (ISO string -> "DD-Mon-YYYY")
    if (typeof value === "string" && /\d{4}-\d{2}-\d{2}T/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        return `${day}-${monthNames[date.getMonth()]}-${date.getFullYear()}`;
      }
    }

    // Boolean
    if (typeof value === "boolean") {
      return (
        <span className={`badge ${value ? "bg-success" : "bg-danger"}`}>
          {value ? "Active" : "Inactive"}
        </span>
      );
    }

    // Array
    if (Array.isArray(value)) {
      return value.length
        ? value.map((v, i) => (
            <span key={i} className="badge bg-info me-1">
              {v}
            </span>
          ))
        : "-";
    }

    return value;
  }

  static formatKey(key) {
    return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  render() {
    const { isOpen, toggle, title, details, fields, customRenderers } = this.props;

    if (!details || !fields) return null;

    return (
      <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
        <ModalHeader toggle={toggle} className="bg-primary text-white">
          {title || "Details"}
        </ModalHeader>

        <ModalBody>
          {fields.map((key, index) => {
            const value = customRenderers?.[key]
              ? customRenderers[key](details)
              : details[key];

            if (value === undefined || value === null || value === "") return null;

            return (
              <Row
                key={key}
                className={`py-2 align-items-center ${
                  index !== fields.length - 1 ? "border-bottom" : ""
                }`}
              >
                {/* Label */}
                <Col md="4" className="fw-semibold text-muted">
                  {DetailModal.formatKey(key)}
                </Col>

                {/* Value */}
                <Col md="8" className="text-dark">
                  {DetailModal.formatValue(value)}
                </Col>
              </Row>
            );
          })}
        </ModalBody>
      </Modal>
    );
  }
}

DetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  title: PropTypes.string,
  details: PropTypes.object.isRequired,
  fields: PropTypes.array.isRequired,
  customRenderers: PropTypes.object,
};

export default DetailModal;