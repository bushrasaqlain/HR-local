import React, { Component } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Row,
  Col,
} from "reactstrap";
import api from "../../lib/api";

const CustomSelect = ({ options, value, onChange, placeholder = "Select...", disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        style={{
          height: "38px", padding: "0 12px", fontSize: "14px",
          border: `1px solid ${open ? "#36565f" : "#ced4da"}`,
          borderRadius: "6px", background: disabled ? "#e9ecef" : "#fff",
          color: selectedOption ? "#212529" : "#6c757d",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: open ? "0 0 0 3px rgba(54,86,95,0.15)" : "none",
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: "10px", color: "#9ca3af", marginLeft: "8px" }}>▾</span>
      </div>

      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
          background: "#fff", borderRadius: "6px", border: "1px solid #ced4da",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: "220px", overflowY: "auto",
        }}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: "8px 12px", fontSize: "14px", cursor: "pointer",
                  background: isSelected ? "#36565f" : "#fff",
                  color: isSelected ? "#fff" : "#212529",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#e6eeef"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

class AvailabilityStep extends Component {
  state = {
    availability: [],
    loading: false,

    showModal: false,
    editIndex: null,

    dayOptions: [
      "All Days",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],

    shiftOptions: ["All Shifts", "morning", "evening", "night"],

    form: {
      day: "",
      shift: "",
      startTime: "",
      endTime: "",
    },

    // For All Shifts - separate timings for each shift (only used when NOT 24/7)
    allShiftsTimings: {
      morning: { startTime: "09:00", endTime: "17:00" },
      evening: { startTime: "15:00", endTime: "23:00" },
      night: { startTime: "21:00", endTime: "06:00" },
    },

    timingError: null, // For validation errors
  };

  componentDidMount() {
    this.loadAvailability();
  }

  loadAvailability = async () => {
    try {
      this.setState({ loading: true });
      const res = await api.get("/candidate_availability/getavailability");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      this.setState({ availability: data, loading: false });
    } catch (err) {
      console.error("Failed to load availability:", err);
      this.setState({ loading: false });
    }
  };

  openAddModal = () => {
    this.setState({
      showModal: true,
      editIndex: null,
      form: { day: "", shift: "", startTime: "", endTime: "" },
      timingError: null,
      allShiftsTimings: {
        morning: { startTime: "09:00", endTime: "17:00" },
        evening: { startTime: "15:00", endTime: "23:00" },
        night: { startTime: "21:00", endTime: "06:00" },
      },
    });
  };

  openEditModal = (index) => {
    const item = this.state.availability[index];

    this.setState({
      showModal: true,
      editIndex: index,
      timingError: null,
      form: {
        id: item.id,
        day: item.day || "",
        shift: item.shift || "",
        startTime: item.startTime || "",
        endTime: item.endTime || "",
      },
    });
  };

  // ✅ Shift validation - simple and clean
  validateShiftTiming = (shift, startTime, endTime) => {
    if (!startTime || !endTime) {
      return { isValid: false, error: "Please select both start and end time" };
    }

    switch (shift) {
      case "morning":
        // Morning shift should start before 12:00 PM (noon)
        if (startTime >= "12:00") {
          return { isValid: false, error: "❌ Morning shift must start before 12:00 PM (e.g., 09:00 AM)" };
        }
        if (startTime >= endTime) {
          return { isValid: false, error: "❌ End time must be after start time" };
        }
        return { isValid: true, error: null };

      case "evening":
        // Evening shift should start after 12:00 PM (noon)
        if (startTime <= "12:00") {
          return { isValid: false, error: "❌ Evening shift must start after 12:00 PM (e.g., 15:00 PM)" };
        }
        if (startTime >= endTime) {
          return { isValid: false, error: "❌ End time must be after start time" };
        }
        return { isValid: true, error: null };

      case "night":
        // Night shift must cross midnight (start time > end time)
        if (startTime <= endTime) {
          return { isValid: false, error: "❌ Night shift must cross midnight (e.g., 21:00 to 06:00 next day)" };
        }
        return { isValid: true, error: null };

      default:
        return { isValid: true, error: null };
    }
  };

  handleAllShiftsTimingChange = (shift, field, value) => {
    this.setState((prev) => ({
      allShiftsTimings: {
        ...prev.allShiftsTimings,
        [shift]: {
          ...prev.allShiftsTimings[shift],
          [field]: value,
        },
      },
      timingError: null,
    }));
  };

  // ✅ Helper to check if selection is 24/7 (Any day + All Shifts)
  is247Selection = (day, shift) => {
    return shift === "All Shifts";
  };

  // Get real-time validation error for single shift
  getSingleShiftTimingError = () => {
    const { form } = this.state;
    if (!form.shift || !form.startTime || !form.endTime) return null;
    const validation = this.validateShiftTiming(form.shift, form.startTime, form.endTime);
    return validation.error;
  };

  handleSave = async () => {
    const { editIndex, form, allShiftsTimings } = this.state;

    try {
      if (editIndex !== null) {
        // EDIT - single entry
        // Validate for edit mode
        if (form.shift !== "All Shifts") {
          const validation = this.validateShiftTiming(form.shift, form.startTime, form.endTime);
          if (!validation.isValid) {
            this.setState({ timingError: validation.error });
            alert(validation.error);
            return;
          }
        }

        await api.put(`/candidate_availability/updateavailability/${form.id}`, {
          day: form.day,
          shift: form.shift,
          startTime: form.startTime,
          endTime: form.endTime,
        });
      } else {
        // ADD
        const daysToAdd = form.day === "All Days"
          ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          : [form.day];

        let availabilityArray = [];

        // ✅ Check if it's 24/7 availability (Any day + All Shifts)
        const is247 = this.is247Selection(form.day, form.shift);

        if (is247) {
          // For 24/7 availability - add entries for all days and shifts with NULL time
          const shifts = ["morning", "evening", "night"];
          for (const day of daysToAdd) {
            for (const shift of shifts) {
              availabilityArray.push({
                day: day,
                shift: shift,
                startTime: null,
                endTime: null,
              });
            }
          }
        } else if (form.shift === "All Shifts") {
          // Validate all shifts timings
          const shifts = ["morning", "evening", "night"];
          let hasError = false;

          for (const shift of shifts) {
            const timing = allShiftsTimings[shift];
            if (!timing.startTime || !timing.endTime) {
              this.setState({ timingError: `Please set timings for ${shift} shift` });
              alert(`Please set timings for ${shift} shift`);
              hasError = true;
              break;
            }
            const validation = this.validateShiftTiming(shift, timing.startTime, timing.endTime);
            if (!validation.isValid) {
              this.setState({ timingError: validation.error });
              alert(validation.error);
              hasError = true;
              break;
            }
          }

          if (hasError) return;

          for (const day of daysToAdd) {
            for (const shift of shifts) {
              const timing = allShiftsTimings[shift];
              availabilityArray.push({
                day: day,
                shift: shift,
                startTime: timing.startTime,
                endTime: timing.endTime,
              });
            }
          }
        } else {
          // Single shift - validate time fields and shift timing
          if (!form.startTime || !form.endTime) {
            this.setState({ timingError: "Please select start time and end time" });
            alert("Please select start time and end time");
            return;
          }

          // Validate based on shift type
          const validation = this.validateShiftTiming(form.shift, form.startTime, form.endTime);
          if (!validation.isValid) {
            this.setState({ timingError: validation.error });
            alert(validation.error);
            return;
          }

          for (const day of daysToAdd) {
            availabilityArray.push({
              day: day,
              shift: form.shift,
              startTime: form.startTime,
              endTime: form.endTime,
            });
          }
        }

        await api.post("/candidate_availability/addavailability", {
          availability: availabilityArray,
        });

        alert(`✅ ${availabilityArray.length} availability entr${availabilityArray.length === 1 ? 'y' : 'ies'} added successfully!`);
      }

      this.setState({ showModal: false, timingError: null });
      this.loadAvailability();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save availability");
    }
  };

  closeModal = () => {
    this.setState({
      showModal: false,
      editIndex: null,
      form: { day: "", shift: "", startTime: "", endTime: "" },
      timingError: null,
    });
  };

  handleFormChange = (field, value) => {
    const newForm = { ...this.state.form, [field]: value };
    const is247 = this.is247Selection(newForm.day, newForm.shift);

    // Reset timing error
    this.setState({ timingError: null });

    // Set default timings when a specific shift is selected (not All Shifts)
    if (field === "shift" && value !== "All Shifts" && !is247) {
      const defaultTimings = {
        morning: { startTime: "09:00", endTime: "17:00" },
        evening: { startTime: "15:00", endTime: "23:00" },
        night: { startTime: "21:00", endTime: "06:00" },
      };
      const timing = defaultTimings[value];
      if (timing) {
        newForm.startTime = timing.startTime;
        newForm.endTime = timing.endTime;
      }
    }

    this.setState({ form: newForm });
  };

  // Helper to check if time crosses midnight
  isTimeCrossingMidnight = (startTime, endTime) => {
    if (!startTime || !endTime) return false;
    return startTime > endTime;
  };

  renderShiftTimingInputs = () => {
    const { allShiftsTimings, form } = this.state;
    const is247 = this.is247Selection(form.day, form.shift);

    const shifts = [
      { key: "morning", label: "Morning Shift" },
      { key: "evening", label: "Evening Shift" },
      { key: "night", label: "Night Shift" },
    ];

    // ✅ For 24/7, show message instead of time inputs
    if (is247) {
      const dayText = form.day === "All Days" ? "all days" : form.day;
      return (
        <Alert color="success" className="mt-3" style={{ fontSize: "13px" }}>
          <strong>🕒 24/7 Availability Selected!</strong>
          <br />
          <small>You will be marked as available for {dayText} across all shifts without specific time restrictions.</small>
        </Alert>
      );
    }

    return (
      <div className="mt-3">
        <label className="fw-semibold mb-2">Set timings for each shift:</label>
        {shifts.map((shift) => {
          const timing = allShiftsTimings[shift.key];
          const validation = this.validateShiftTiming(shift.key, timing.startTime, timing.endTime);
          const crossesMidnight = this.isTimeCrossingMidnight(timing.startTime, timing.endTime);

          return (
            <div key={shift.key} className="mb-3 p-2 border rounded" style={{ background: "#f8f9fa" }}>
              <Row className="align-items-center">
                <Col md={3}>
                  <strong>{shift.label}</strong>
                </Col>
                <Col md={4}>
                  <label className="small">Start Time</label>
                  <Input
                    type="time"
                    value={timing.startTime}
                    onChange={(e) => this.handleAllShiftsTimingChange(shift.key, "startTime", e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <label className="small">End Time</label>
                  <Input
                    type="time"
                    value={timing.endTime}
                    onChange={(e) => this.handleAllShiftsTimingChange(shift.key, "endTime", e.target.value)}
                  />
                </Col>
                <Col md={1}>
                  {crossesMidnight && <span title="Next day" style={{ cursor: "help" }}>🕛+1</span>}
                </Col>
              </Row>
              {validation.isValid === false && (
                <small className="text-danger d-block mt-1 ms-3">{validation.error}</small>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  renderSingleShiftTimeInputs = () => {
    const { form, timingError } = this.state;
    const crossesMidnight = this.isTimeCrossingMidnight(form.startTime, form.endTime);
    const is247 = this.is247Selection(form.day, form.shift);
    const validationError = this.getSingleShiftTimingError();

    // ✅ For 24/7, time inputs not needed
    if (is247) {
      return null;
    }

    return (
      <>
        <div className="mb-3">
          <label className="fw-semibold">Start Time <span className="text-danger">*</span></label>
          <Input
            type="time"
            value={form.startTime}
            onChange={(e) => {
              this.handleFormChange("startTime", e.target.value);
            }}
          />
        </div>
        <div className="mb-3">
          <label className="fw-semibold">End Time <span className="text-danger">*</span></label>
          <Input
            type="time"
            value={form.endTime}
            onChange={(e) => {
              this.handleFormChange("endTime", e.target.value);
            }}
          />
        </div>

        {/* Show validation error */}
        {validationError && (
          <Alert color="danger" className="mt-2" style={{ fontSize: "12px", padding: "8px 12px" }}>
            ⚠️ {validationError}
          </Alert>
        )}

        {/* Shift info alerts (only for night shift to remind about midnight) */}
        {form.shift === "night" && !validationError && form.startTime && form.endTime && (
          <Alert color="warning" className="mt-2" style={{ fontSize: "12px" }}>
            🌙 Night shift must cross midnight
            {crossesMidnight && " ✓ Correct (crosses midnight)"}
            {!crossesMidnight && form.startTime && form.endTime && " ⚠️ Night shift should end next day"}
          </Alert>
        )}
      </>
    );
  };

  getEntryCountText = () => {
    const { day, shift } = this.state.form;
    if (!day || !shift) return "0 entries";

    const daysCount = day === "All Days" ? 7 : 1;
    const shiftsCount = shift === "All Shifts" ? 3 : 1;
    const total = daysCount * shiftsCount;

    if (shift === "All Shifts") {
      return `${total} entries (24/7 availability - no time restrictions)`;
    }
    return `${total} entr${total === 1 ? 'y' : 'ies'}`;
  };

  render() {
    const { availability, loading, showModal, form, editIndex, dayOptions, shiftOptions, timingError } = this.state;
    const isAllShifts = form.shift === "All Shifts";
    const isAllDays = form.day === "All Days";
    const is247 = this.is247Selection(form.day, form.shift);

    const formatShift = (shift) => {
      if (shift === "morning") return "Morning";
      if (shift === "evening") return "Evening";
      if (shift === "night") return "Night";
      return shift;
    };

    // Check if save button should be disabled
    const isSaveDisabled = () => {
      if (!form.day || !form.shift) return true;
      if (!is247 && !isAllShifts) {
        const validation = this.validateShiftTiming(form.shift, form.startTime, form.endTime);
        return !validation.isValid;
      }
      if (isAllShifts && !is247) {
        // Check all shifts timings
        for (const shift of ["morning", "evening", "night"]) {
          const timing = this.state.allShiftsTimings[shift];
          const validation = this.validateShiftTiming(shift, timing.startTime, timing.endTime);
          if (!validation.isValid) return true;
        }
      }
      return false;
    };

    return (
      <>
        <h5 className="mb-3">Availability</h5>

        <Button
          color="outline-secondary"
          className="mb-3 custom-progress-bar text-white"
          onClick={this.openAddModal}
        >
          + Add Availability
        </Button>

        {loading && <p>Loading availability…</p>}

        <Table bordered className="align-middle">
          <thead>
            <tr>
              <th>Day</th>
              <th>Shift</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th style={{ width: "120px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {availability.length > 0 ? (
              availability.map((item, index) => {
                const crossesMidnight = this.isTimeCrossingMidnight(item.startTime, item.endTime);
                const isFullDay = !item.startTime && !item.endTime;
                const validation = this.validateShiftTiming(item.shift, item.startTime, item.endTime);
                return (
                  <tr key={item.id || index}>
                    <td>{item.day}</td>
                    <td>{formatShift(item.shift)}</td>
                    <td>{isFullDay ? "24/7" : (item.startTime || "-")}</td>
                    <td style={{ color: !validation.isValid && !isFullDay ? "#dc3545" : "inherit" }}>
                      {isFullDay ? "Available" : (item.endTime || "-")}
                      {!isFullDay && item.shift === "night" && crossesMidnight && " (next day)"}
                      {!validation.isValid && !isFullDay && <span className="ms-1">⚠️</span>}
                    </td>
                    <td>
                      <Button size="sm" color="outline-secondary" onClick={() => this.openEditModal(index)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="5" className="text-center text-muted">No availability added</td></tr>
            )}
          </tbody>
        </Table>

        {/* MODAL */}
        <Modal isOpen={showModal} toggle={this.closeModal} size="lg">
          <ModalHeader toggle={this.closeModal}>
            {editIndex !== null ? "Edit Availability" : "Add Availability"}
          </ModalHeader>
          <ModalBody>
            {/* Day Selection */}
            <div className="mb-3">
              <label className="fw-semibold">Day <span className="text-danger">*</span></label>
              <CustomSelect
                options={dayOptions.map((d) => ({ value: d, label: d }))}
                value={form.day}
                onChange={(val) => this.handleFormChange("day", val)}
                placeholder="Select Day"
              />
              {isAllDays && !is247 && (
                <small className="text-muted d-block mt-1">
                  This will add availability for all 7 days (Monday to Sunday)
                </small>
              )}
            </div>

            {/* Shift Selection */}
            <div className="mb-3">
              <label className="fw-semibold">Shift <span className="text-danger">*</span></label>
              <CustomSelect
                options={shiftOptions.map((s) => ({
                  value: s,
                  label: s === "All Shifts" ? "All Shifts (24/7 availability)"
                    : s === "morning" ? "Morning"
                      : s === "evening" ? "Evening"
                        : s === "night" ? "Night" : s,
                }))}
                value={form.shift}
                onChange={(val) => this.handleFormChange("shift", val)}
                placeholder="Select Shift"
              />
            </div>

            {/* Time inputs based on selection */}
            {form.shift && (
              is247 ? this.renderShiftTimingInputs() : (
                isAllShifts ? this.renderShiftTimingInputs() : this.renderSingleShiftTimeInputs()
              )
            )}

            {/* Summary */}
            {form.day && form.shift && (
              <Alert color={is247 ? "success" : "info"} className="mt-3" style={{ fontSize: "13px" }}>
                <strong>📋 Summary:</strong> You are about to add <strong>{this.getEntryCountText()}</strong>
                {is247 && (
                  <div className="mt-1">
                    <small>✅ No time restrictions - you will be marked as available 24/7 for {form.day === "All Days" ? "all days" : form.day}</small>
                  </div>
                )}
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={this.closeModal}>Cancel</Button>
            <Button
              className="custom-progress-bar text-white"
              onClick={this.handleSave}
              disabled={isSaveDisabled()}
            >
              {editIndex !== null ? "Update" : `Save (${this.getEntryCountText()})`}
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default AvailabilityStep;