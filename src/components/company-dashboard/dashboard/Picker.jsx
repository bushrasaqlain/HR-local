// MonthYearPicker.js
import React, { useState, useRef, useEffect } from "react";

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MonthYearPicker = ({ month, year, onChange, style }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectMonth = (m) => {
        onChange(m, year);
        setOpen(false);
    };

    return (
        <div ref={wrapRef} style={{ position: "relative", ...style }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    fontSize: 11, border: "0.5px solid rgba(0,0,0,0.15)",
                    borderRadius: 20, padding: "3px 10px", color: "#fff",
                    background: "#36565f", cursor: "pointer", outline: "none",
                    fontWeight: 500,
                }}
            >
                {months[month]} {year} ▾
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "110%", right: 0, zIndex: 20,
                    background: "#fff", borderRadius: 10, padding: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)", width: 200,
                }}>
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 8, fontSize: 12, fontWeight: 600
                    }}>
                        <span onClick={() => onChange(month, year - 1)} style={{ cursor: "pointer" }}>‹</span>
                        <span>{year}</span>
                        <span onClick={() => onChange(month, year + 1)} style={{ cursor: "pointer" }}>›</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                        {months.map((m, i) => (
                            <div
                                key={m}
                                onClick={() => selectMonth(i)}
                                style={{
                                    textAlign: "center", fontSize: 11, padding: "6px 0",
                                    borderRadius: 6, cursor: "pointer",
                                    background: i === month ? "#36565f" : "transparent",
                                    color: i === month ? "#fff" : "#333",
                                    fontWeight: i === month ? 600 : 400,
                                }}
                            >
                                {m}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   CustomSelect — teal-themed replacement for
   native <select> dropdowns
───────────────────────────────────────────── */
const BLUE = "#36565f";
const BLUE_LIGHT = "#e6eeef";
const BORDER = "#d1d5db";
const TEXT_PRIMARY = "#111827";
const RED = "#dc2626";

const CustomSelect = ({
    options,          // [{ value, label }]
    value,             // current selected value
    onChange,          // (value) => void
    placeholder = "Select...",
    error = false,
    disabled = false,
    style,
}) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o) => o.value === value);

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
    };

    return (
        <div ref={wrapRef} style={{ position: "relative", width: "100%", ...style }}>
            <div
                onClick={() => !disabled && setOpen(!open)}
                style={{
                    height: "44px",
                    padding: "0 14px",
                    fontSize: "14px",
                    border: `1.5px solid ${open ? BLUE : error ? RED : BORDER}`,
                    borderRadius: "8px",
                    background: disabled ? "#f3f4f6" : "#fff",
                    color: selectedOption ? TEXT_PRIMARY : "#9ca3af",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: disabled ? "not-allowed" : "pointer",
                    boxShadow: open ? `0 0 0 3px rgba(54,86,95,0.15)` : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    userSelect: "none",
                }}
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <span style={{ fontSize: "10px", color: "#9ca3af", marginLeft: "8px" }}>▾</span>
            </div>

            {open && !disabled && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        zIndex: 30,
                        background: "#fff",
                        borderRadius: "8px",
                        border: `1px solid ${BORDER}`,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        maxHeight: "220px",
                        overflowY: "auto",
                    }}
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                style={{
                                    padding: "10px 14px",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    background: isSelected ? BLUE : "#fff",
                                    color: isSelected ? "#fff" : TEXT_PRIMARY,
                                    transition: "background 0.1s",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = BLUE_LIGHT;
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = "#fff";
                                }}
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

export default MonthYearPicker;
export { CustomSelect };