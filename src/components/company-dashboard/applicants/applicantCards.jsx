import React from "react";
import { Button } from "reactstrap";

// ── Status meta ──────────────────────────────────────────────────
const STATUS_META = {
  Pending: { label: "Pending", color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  Saved: { label: "Saved", color: "#1e40af", bg: "#dbeafe", border: "#93c5fd" },
  Interview_Scheduled: { label: "Interview Scheduled", color: "#0f766e", bg: "#ccfbf1", border: "#5eead4" },
  Interview_Conducted: { label: "Interview Conducted", color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc" },
  Shortlisted: { label: "Shortlisted", color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  Considered: { label: "Considered", color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd" },
  Offered: { label: "Offered", color: "#7c3aed", bg: "#f5f3ff", border: "#a78bfa" },
  Selected: { label: "Selected", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  Joined: { label: "Joined", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  Rejected: { label: "Rejected", color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
  "Refused to Join": { label: "Refused to Join", color: "#92400e", bg: "#fff7ed", border: "#fdba74" },
};

// ── What buttons to show per current status ──────────────────────
const ACTIONS = {
  Pending:             ["Saved", "Interview_Scheduled"],
  Applied:             [ "Interview_Scheduled", "Rejected"],
  Saved:               ["Interview_Scheduled", "Rejected"],
  Interview_Scheduled: ["Interview_Conducted", "Rejected"],
  Interview_Conducted: ["Considered", "Offered", "Rejected"],
  Shortlisted: ["Offered", "Rejected"],
  Considered: ["Offered", "Rejected"],
};

// Statuses that need a modal before firing
const MODAL_REQUIRED = {
  Interview_Scheduled: "interview",
  Offered: "offer",
  Selected: "joining",
};

// Button style variant per action
const BTN_STYLE = {
  Saved: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  Interview_Scheduled: { bg: "#ccfbf1", color: "#0f766e", border: "#5eead4" },
  Interview_Conducted: { bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc" },
  Shortlisted: { bg: "#fef3c7", color: "#b45309", border: "#fcd34d" },
  Considered: { bg: "#ede9fe", color: "#6d28d9", border: "#c4b5fd" },
  Offered: { bg: "#f5f3ff", color: "#7c3aed", border: "#a78bfa" },
  Selected: { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
  Joined: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  Rejected: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
  "Refused to Join": { bg: "#fff7ed", color: "#92400e", border: "#fdba74" },
};

const BTN_LABEL = {
  Saved: "Save",
  Considered: "Consider",
  Offered: "Offer",
};

// ── Time options generator (12-hour format) ──
const generateTimeOptions = () => {
  const slots = [];
  // 12:00 AM to 11:30 AM
  slots.push({ v: '00:00', l: '12:00 AM' });
  slots.push({ v: '00:30', l: '12:30 AM' });
  for (let hour = 1; hour <= 11; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    slots.push({ v: `${hourStr}:00`, l: `${hour}:00 AM` });
    slots.push({ v: `${hourStr}:30`, l: `${hour}:30 AM` });
  }
  // 12:00 PM to 11:30 PM
  slots.push({ v: '12:00', l: '12:00 PM' });
  slots.push({ v: '12:30', l: '12:30 PM' });
  for (let hour = 1; hour <= 11; hour++) {
    const hourStr = (hour + 12).toString();
    slots.push({ v: `${hourStr}:00`, l: `${hour}:00 PM` });
    slots.push({ v: `${hourStr}:30`, l: `${hour}:30 PM` });
  }
  return slots;
};

// ── Convert 24-hour to 12-hour format for display ──
const convertTo12Hour = (time24) => {
  if (!time24) return '';
  const [hour, minute] = time24.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${minute} ${ampm}`;
};

// ── Convert 12-hour input to 24-hour format for storage ──
const convertTo24Hour = (time12) => {
  if (!time12) return '';

  // Check if it's already in 24-hour format
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time12)) {
    return time12;
  }

  // Try to parse 12-hour format
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }

  return time12;
};

class ApplicantCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: null,
      pendingStatus: null,
      interviewDay: "",
      interviewTime: "",
      interviewTimeDisplay: "",
      offerDate: "",
      offeredSalary: "",
      joiningDate: "",
    };
  }

  closeModal = () => this.setState({
    modal: null, pendingStatus: null,
    interviewDay: "", interviewTime: "", interviewTimeDisplay: "",
    offerDate: "", offeredSalary: "",
    joiningDate: "",
  });

  handleActionClick = (statusKey) => {
    const { candidate } = this.props;
    const isHired = candidate.is_hired_elsewhere;

    const proceed = () => {
      const modalType = MODAL_REQUIRED[statusKey];
      if (modalType) {
        this.setState({ modal: modalType, pendingStatus: statusKey });
      } else {
        this.props.onStatusChange(candidate.candidate_id, statusKey);
      }
    };

    if (isHired && ["Interview_Scheduled", "Shortlisted", "Offered", "Selected", "Joined"].includes(statusKey)) {
      if (!window.confirm(`⚠️ ${candidate.full_name} has already been hired elsewhere. Continue?`)) return;
    }
    proceed();
  };

  handleTimeChange = (e) => {
    const value = e.target.value;
    this.setState({ interviewTimeDisplay: value });

    const time24 = convertTo24Hour(value);
    if (time24) {
      this.setState({ interviewTime: time24 });
    }
  };

  confirmInterview = () => {
    const { interviewDay, interviewTime } = this.state;
    if (!interviewDay || !interviewTime) return alert("Please select both date and time.");
    this.props.onStatusChange(this.props.candidate.candidate_id, "Interview_Scheduled", interviewDay, interviewTime);
    this.closeModal();
  };

  confirmOffer = () => {
    const { offerDate, offeredSalary } = this.state;
    if (!offerDate || !offeredSalary) return alert("Please fill in offer date and salary.");
    this.props.onStatusChange(this.props.candidate.candidate_id, "Offered", null, null, { offerDate, offeredSalary });
    this.closeModal();
  };

  confirmJoining = () => {
    const { joiningDate } = this.state;
    if (!joiningDate) return alert("Please select a joining date.");
    this.props.onStatusChange(this.props.candidate.candidate_id, "Selected", null, null, { joiningDate });
    this.closeModal();
  };

  render() {
    const { candidate } = this.props;
    const { modal, interviewDay, interviewTimeDisplay, offerDate, offeredSalary, joiningDate } = this.state;
    const current = candidate.candidateStatus || "Pending";
    const isHired = candidate.is_hired_elsewhere;
    const actions = ACTIONS[current] || null;
    const isTerminal = !actions;
    const isWaitingForCandidate = current === "Offered";

    const timeOptions = generateTimeOptions();

    return (
      <div>
        {/* ── Already hired warning ── */}
        {isHired && (
          <span style={{
            background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5",
            borderRadius: "20px", padding: "2px 8px", fontSize: "10px",
            fontWeight: 600, display: "inline-block", marginBottom: "4px",
          }}>Already Hired</span>
        )}

        {/* ── Current status badge ── */}
        {current !== "Pending" && (
          <div style={{ marginBottom: "6px" }}>
            {isWaitingForCandidate && (
              <div style={{ fontSize: "11px", color: "#718096", marginTop: "4px" }}>
                Waiting for candidate response
              </div>
            )}
          </div>
        )}

        {/* ── Action buttons ── */}
        {!isTerminal && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {actions.map((statusKey) => {
              const s = BTN_STYLE[statusKey];
              return (
                <button
                  key={statusKey}
                  onClick={() => this.handleActionClick(statusKey)}
                  style={{
                    background: s.bg, color: s.color,
                    border: `1px solid ${s.border}`,
                    borderRadius: "20px", padding: "3px 10px",
                    fontSize: "11px", fontWeight: 600,
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  {BTN_LABEL[statusKey] || STATUS_META[statusKey].label}
                </button>
              );
            })}
          </div>
        )}

        {/* ════════════ MODALS ════════════ */}

        {/* Interview Modal with Time Dropdown + Manual Input (12-hour format) */}
        {modal === "interview" && (
          <ModalWrapper title="📅 Schedule Interview" onClose={this.closeModal}>
            <label className="form-label fw-semibold">Interview Date</label>
            <input
              type="date"
              className="form-control mb-3"
              min={new Date().toISOString().split("T")[0]}
              value={interviewDay}
              onChange={e => this.setState({ interviewDay: e.target.value })}
            />

            <label className="form-label fw-semibold">Interview Time</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-control mb-2"
                value={interviewTimeDisplay}
                onChange={this.handleTimeChange}
                placeholder="Type time (e.g., 2:30 PM) or select from dropdown"
                style={{
                  height: "44px",
                  padding: "0 14px",
                  fontSize: "14px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#fff",
                  width: "100%",
                }}
                list="time-options"
              />
              <datalist id="time-options">
                {timeOptions.map((slot) => (
                  <option key={slot.v} value={slot.l}>
                    {slot.l}
                  </option>
                ))}
              </datalist>
            </div>

            {/* ✅ Show selected time preview - WAPAS AAYA */}
            {interviewTimeDisplay && interviewDay && (
              <div style={{
                fontSize: "12px",
                color: "#0f766e",
                background: "#ccfbf1",
                padding: "6px 12px",
                borderRadius: "6px",
                marginBottom: "16px",
                textAlign: "center"
              }}>
                📅 Interview scheduled for {interviewDay} at {interviewTimeDisplay}
              </div>
            )}

            <ModalFooter onConfirm={this.confirmInterview} onClose={this.closeModal} />
          </ModalWrapper>
        )}

        {/* Offer Modal */}
        {modal === "offer" && (
          <ModalWrapper title="💼 Send Job Offer" onClose={this.closeModal}>
            <label className="form-label fw-semibold">Offer Date</label>
            <input type="date" className="form-control mb-3"
              min={new Date().toISOString().split("T")[0]}
              value={offerDate}
              onChange={e => this.setState({ offerDate: e.target.value })} />
            <label className="form-label fw-semibold">Offered Salary (PKR)</label>
            <input type="number" className="form-control mb-4"
              placeholder="e.g. 80000"
              value={offeredSalary}
              onChange={e => this.setState({ offeredSalary: e.target.value })} />
            <ModalFooter onConfirm={this.confirmOffer} onClose={this.closeModal} confirmLabel="Send Offer" />
          </ModalWrapper>
        )}

        {/* Joining Modal */}
        {modal === "joining" && (
          <ModalWrapper title="✅ Confirm Selection" onClose={this.closeModal}>
            <label className="form-label fw-semibold">Expected Joining Date</label>
            <input type="date" className="form-control mb-4"
              min={new Date().toISOString().split("T")[0]}
              value={joiningDate}
              onChange={e => this.setState({ joiningDate: e.target.value })} />
            <ModalFooter onConfirm={this.confirmJoining} onClose={this.closeModal} confirmLabel="Confirm Selection" />
          </ModalWrapper>
        )}
      </div>
    );
  }
}

// ── Reusable modal shell ─────────────────────────────────────────
function ModalWrapper({ title, onClose, children }) {
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
      <div className="bg-white rounded-4 p-4" style={{ width: "360px", maxWidth: "95vw" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{title}</h5>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: "20px",
            cursor: "pointer", color: "#718096", lineHeight: 1,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onConfirm, onClose, confirmLabel = "Confirm" }) {
  return (
    <div className="d-flex gap-2">
      <button className="w-100" onClick={onConfirm} style={{
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "white", border: "none", borderRadius: "8px",
        padding: "8px", fontWeight: 600, cursor: "pointer",
      }}>{confirmLabel}</button>
      <button className="w-100" onClick={onClose} style={{
        background: "#f1f5f9", color: "#2d3748", border: "1px solid #e2e8f0",
        borderRadius: "8px", padding: "8px", fontWeight: 600, cursor: "pointer",
      }}>Cancel</button>
    </div>
  );
}

export default ApplicantCard;