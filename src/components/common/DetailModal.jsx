import React, { Component } from "react";
import { Modal, ModalHeader, ModalBody, Row, Col } from "reactstrap";
import PropTypes from "prop-types";

class DetailModal extends Component {
  static formatValue(value) {
    if (value === undefined || value === null || value === "") return "-";

    // ✅ Format price/salary with commas (for numbers)
    if (typeof value === "number" || (!isNaN(value) && value !== "")) {
      // Check if key indicates price or salary (handled in render)
      // This will be applied to all numbers, but we'll let the key check happen in render
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue.toLocaleString('en-IN'); // For Indian format (12,000)
        // or use 'en-US' for US format (12,000)
      }
    }

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
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
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

  // Special formatter for price/salary fields
  static formatPrice(value) {
    if (value === undefined || value === null || value === "") return "-";
    const numValue = Number(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('en-IN'); // or 'en-US'
  }

  render() {
    const { isOpen, toggle, title, details, fields, customRenderers } =
      this.props;

    if (!details || !fields) return null;

    return (
      <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
        <ModalHeader toggle={toggle} className="custom-progress-bar text-white">
          <h4>Job Details</h4>
        </ModalHeader>

        <ModalBody className="p-4">
          {fields.map((key, index) => {
            let value = customRenderers?.[key]
              ? customRenderers[key](details)
              : details[key];

            if (value === undefined || value === null || value === "")
              return null;

            // Check if this is a price or salary field
            const isPriceField = key.toLowerCase().includes('price') || 
                                key.toLowerCase().includes('salary') ||
                                key.toLowerCase().includes('amount') ||
                                key.toLowerCase().includes('cost');

            // Format price/salary fields with commas
            if (isPriceField && !isNaN(value) && value !== '') {
              value = Number(value).toLocaleString('en-IN');
            }

            return (
              <div
                key={key}
                className={`d-flex py-3 ${
                  index !== fields.length - 1 ? "border-bottom" : ""
                }`}
              >
                {/* Label */}
                <div className="col-4">
                  <span className="fw-semibold text-secondary">
                    {DetailModal.formatKey(key)}
                  </span>
                </div>

                {/* Value */}
                <div className="col-8">
                  <span className="text-dark">
                    {DetailModal.formatValue(value)}
                  </span>
                </div>
              </div>
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