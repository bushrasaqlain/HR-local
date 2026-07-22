import React from "react";
class ThemedTimeInput extends React.Component {
  state = { open: false, hour: "09", minute: "00", period: "AM" };

  componentDidMount() {
    this.syncFromValue(this.props.value);
    document.addEventListener("mousedown", this.handleOutsideClick);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) this.syncFromValue(this.props.value);
  }
  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleOutsideClick);
  }

  handleOutsideClick = (e) => {
    if (this.wrapRef && !this.wrapRef.contains(e.target)) {
      this.setState({ open: false });
    }
  };

  syncFromValue(value) {
    if (!value) return;
    const [h24, m] = value.split(":");
    let h = parseInt(h24, 10);
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    this.setState({
      hour: String(h).padStart(2, "0"),
      minute: m || "00",
      period,
    });
  }

  emit(hour, minute, period) {
    let h = parseInt(hour, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const value = `${String(h).padStart(2, "0")}:${minute}`;
    this.props.onChange({ target: { value } });
  }

  render() {
    const { open, hour, minute, period } = this.state;
    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
    const minuteStep = this.props.minuteStep || 15;
const minutes = Array.from({ length: 60 / minuteStep }, (_, i) =>
  String(i * minuteStep).padStart(2, "0")
);

    return (
      <div
        ref={(r) => (this.wrapRef = r)}
        style={{ position: "relative", fontFamily: "inherit" }}
      >
        <div
          onClick={() => this.setState((p) => ({ open: !p.open }))}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: `1px solid #dbe8e8`,
            borderRadius: 10,
            padding: "10px 14px",
            background: "#fff",
            cursor: "pointer",
            color: this.props.value ? "#36565f" : "#9ab0b0",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <span>{this.props.value ? `${hour}:${minute} ${period}` : "--:-- --"}</span>
          <span style={{ color: "#5f8190" }}>🕐</span>
        </div>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 20,
              background: "#fff",
              border: "1px solid #dbe8e8",
              borderRadius: 14,
              boxShadow: "0 10px 30px rgba(54,86,95,.18)",
              padding: 12,
              display: "flex",
              gap: 8,
              width: 220,
            }}
          >
            {[
              { list: hours, val: hour, key: "hour" },
              { list: minutes, val: minute, key: "minute" },
              { list: ["AM", "PM"], val: period, key: "period" },
            ].map((col) => (
              <div
                key={col.key}
                style={{
                  flex: 1,
                  maxHeight: 180,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {col.list.map((item) => {
                  const isActive = item === col.val;
                  return (
                    <div
                      key={item}
                      onClick={() => {
                        const next = { hour, minute, period, [col.key]: item };
                        this.setState(next);
                        this.emit(next.hour, next.minute, next.period);
                      }}
                      style={{
                        textAlign: "center",
                        padding: "6px 0",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        background: isActive ? "#36565f" : "transparent",
                        color: isActive ? "#fff" : "#5f8190",
                        transition: "background .15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "#e2f0f0";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
export default ThemedTimeInput;