import React, { Component } from "react";
import AsyncSelect from "react-select/async";
import api from "../../lib/api";
// import { toast } from "react-toastify";

const CustomSelect = ({ options, value, onChange, placeholder = "Select...", error = false, disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        style={{
          height: "38px",
          padding: "0 12px",
          fontSize: "14px",
          border: `1px solid ${open ? "#36565f" : error ? "#dc3545" : "#ced4da"}`,
          borderRadius: "6px",
          background: disabled ? "#e9ecef" : "#fff",
          color: selectedOption ? "#212529" : "#6c757d",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: open ? "0 0 0 3px rgba(54,86,95,0.15)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: "10px", color: "#9ca3af", marginLeft: "8px" }}>▾</span>
      </div>

      {open && !disabled && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
            background: "#fff", borderRadius: "6px", border: "1px solid #ced4da",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: "220px", overflowY: "auto",
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
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

const selectTealStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#36565F" : base.borderColor,
    boxShadow: state.isFocused ? "0 0 0 1px #36565F" : base.boxShadow,
    "&:hover": {
      borderColor: "#36565F",
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#36565F"
      : state.isFocused
        ? "#e6eeef"
        : "#fff",
    color: state.isSelected ? "#fff" : "#212529",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#36565F",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 30,
  }),
};

const emptyDraft = {
  degree: "",
  degreeTitle: "",
  degreeTitle_label: "",
  institute: "",
  institute_label: "",
  instituteObj: null,
  startDate: "",
  endDate: "",
  ongoing: false,
  id: null,
};

class EducationStep extends Component {
  state = {
    formData: {
      education: [], // start empty
      experience: [],
      // add other formData fields if needed
    },
    educationDraft: { ...emptyDraft },
    degreeFieldData: [],
    showEducationModal: false,
    successMessage: "",
    errorMessage: "",
  };

  componentDidMount() {
    this.fetchDegreeFields();
    this.fetchCandidateEducation();
    this.loadDegreeTitles();
    this.loadInstitutes();
  }

  // Fetch all degree types
  fetchDegreeFields = async () => {
    try {
      const res = await api.get("/getalldegreetype");
      const degreesArray = Array.isArray(res.data?.degreetypes)
        ? res.data.degreetypes
        : [];
      this.setState({ degreeFieldData: degreesArray });
    } catch (err) {
      console.error("Failed to fetch degree fields", err);
      this.setState({ degreeFieldData: [] });
    }
  };
  loadDegreeTitles = (degreeId) => async (inputValue) => {
    console.log("🔥 API CALL TRIGGERED", degreeId, inputValue);

    if (!degreeId) return [];

    const res = await api.get("/getDegreeFieldsDropdown", {
      params: {
        search: inputValue || "",
        degree_type_id: degreeId,
      },
    });
    console.log("DATA", res.data);

    return (res.data.degreefields || []).map((t) => ({
      value: t.id,
      label: t.name,
    }));
  };
  loadInstitutes = async (inputValue) => {
    try {
      const res = await api.get("/institute/getallInstitute", {
        params: {
          search: inputValue || "",
          status: "Active",
        },
      });

      const institutes = Array.isArray(res.data?.institutes)
        ? res.data.institutes
        : [];

      return institutes.map((inst) => ({
        label: inst.name, // MUST exist
        value: inst.id, // MUST exist
      }));
    } catch (err) {
      console.error("Institute load failed:", err);
      return [];
    }
  };

  fetchCandidateEducation = async () => {
    try {
      const res = await api.get("/candidateeducation/getallcandidateeducation");

      // Use res.data directly, NOT res.data.data
      const educationList = res.data.map((item) => ({
        id: item.id,
        degree: item.degreetype_id || null,
        degree_label: item.degreetype || "",
        degreeTitle: item.degreefield_id || null,
        degreeTitle_label: item.degreefield || "",
        degreeTitleObj: item.degreefield_id
          ? { value: item.degreefield_id, label: item.degreefield }
          : null,
        institutes: item.institute_id || null,
        institutes_label: item.institute || "",
        instituteObj: item.institute_id
          ? { value: item.institute_id, label: item.institute }
          : null,
        startDate: item.start_date ? item.start_date.split("T")[0] : "",
        endDate: item.end_date ? item.end_date.split("T")[0] : "",
        ongoing: Boolean(item.is_ongoing),
      }));

      this.setState((prev) => ({
        formData: {
          ...prev.formData,
          education: educationList,
        },
      }));

      console.log("Fetched education:", educationList);
    } catch (err) {
      console.error("Failed to fetch candidate education", err);
      this.setState({ errorMessage: "Failed to load qualifications" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  mapEducation = (eduData) => {
    return eduData.map((item) => ({
      degreeTitle: item.degreetype || "",
      degreeTitle_label: item.degreefield || "",
      institutes: item.institute || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      ongoing: Boolean(item.is_ongoing), // ⭐ THIS LINE MATTERS
    }));
  };
  handleDraftChange = (key, value, type = "normal") => {
    this.setState((prev) => {
      const newDraft = { ...prev.educationDraft };

      if (type === "select") {
        newDraft[key] = value?.value || ""; // numeric ID
        newDraft[`${key}_label`] = value?.label || ""; // label
        newDraft[`${key}Obj`] = value || null; // full object
      } else {
        newDraft[key] = value;
      }

      return { educationDraft: newDraft };
    });
  };

  saveEducation = async () => {
    const { educationDraft, formData } = this.state;

    // Required fields check
    if (
      !educationDraft.degree ||
      !educationDraft.degreeTitleObj ||
      !educationDraft.instituteObj
    ) {
      this.setState({ errorMessage: "Please fill all required fields" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    // Prepare payload as an array for backend
    const payload = [
      {
        id: educationDraft.id || null,
        degree: Number(educationDraft.degree),
        degreeTitle: Number(educationDraft.degreeTitleObj.value),
        institutes: Number(educationDraft.instituteObj.value),
        startDate: educationDraft.startDate || "",
        endDate: educationDraft.ongoing ? null : educationDraft.endDate || "",
        ongoing: educationDraft.ongoing || false,
      },
    ];

    try {
      if (educationDraft.id) {
        // Edit existing
        await api.put("/candidateeducation/editcandidateeducation", {
          education: payload,
        });
        this.setState({ successMessage: "Qualification updated" });
        setTimeout(() => this.setState({ successMessage: "" }), 3000);

        // Update the frontend state immediately
        const updatedEducation = formData.education.map((edu) =>
          edu.id === educationDraft.id
            ? {
              ...edu,
              degree: educationDraft.degree,
              degree_label: educationDraft.degree_label,
              degreeTitle: educationDraft.degreeTitleObj.value,
              degreeTitle_label: educationDraft.degreeTitleObj.label,
              degreeTitleObj: educationDraft.degreeTitleObj,
              institutes: educationDraft.instituteObj.value,
              institutes_label: educationDraft.instituteObj.label,
              instituteObj: educationDraft.instituteObj,
              startDate: educationDraft.startDate,
              endDate: educationDraft.endDate,
              ongoing: educationDraft.ongoing,
            }
            : edu,
        );

        this.setState({
          formData: {
            ...formData,
            education: updatedEducation,
          },
          showEducationModal: false,
          educationDraft: {},
        });
      } else {
        // Add new
        const res = await api.post(
          "/candidateeducation/addcandidateeducation",
          { education: payload },
        );
        this.setState({ successMessage: "Qualification added" });
        setTimeout(() => this.setState({ successMessage: "" }), 3000);

        // Add to frontend table immediately
        const newEdu = {
          ...payload[0],
          id: res.data?.id || Date.now(), // fallback ID if backend doesn't return
          degree_label: educationDraft.degree_label,
          degreeTitle_label: educationDraft.degreeTitleObj.label,
          degreeTitleObj: educationDraft.degreeTitleObj,
          institutes_label: educationDraft.instituteObj.label,
          instituteObj: educationDraft.instituteObj,
        };

        this.setState({
          formData: {
            ...formData,
            education: [...formData.education, newEdu],
          },
          showEducationModal: false,
          educationDraft: {},
        });
      }
    } catch (err) {
      console.error(err);
      this.setState({ errorMessage: "Failed to save qualification" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  openEditModal = (eduRow) => {
    // degree object from local degreeFieldData (optional)
    const degreeObj =
      this.state.degreeFieldData.find((d) => d.id === eduRow.degree) || {};

    // Degree Title object for AsyncSelect
    const degreeTitleObj = eduRow.degreeTitle
      ? {
        value: Number(eduRow.degreeTitle),
        label: eduRow.degreeTitle_label || "Unknown",
      }
      : null;

    // Institute object for AsyncSelect
    const instituteObj = eduRow.institutes
      ? {
        value: Number(eduRow.institutes),
        label: eduRow.institutes_label || "Unknown",
      }
      : null;

    this.setState({
      showEducationModal: true,
      educationDraft: {
        id: eduRow.id || null,
        degree: degreeObj.id || eduRow.degree || null,
        degree_label: degreeObj.name || eduRow.degree_label || "",
        degreeTitle: degreeTitleObj?.value || null,
        degreeTitle_label: degreeTitleObj?.label || "",
        degreeTitleObj: degreeTitleObj,
        institutes: instituteObj?.value || null,
        institutes_label: instituteObj?.label || "",
        instituteObj: instituteObj,
        startDate: eduRow.startDate || "",
        endDate: eduRow.endDate || "",
        ongoing: eduRow.ongoing || false,
      },
    });
  };

  render() {
    const { formData, educationDraft, showEducationModal, degreeFieldData } =
      this.state;

    return (
      <div className="table-responsive">

        {this.state.successMessage && (
          <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
            <i className="bi bi-check-circle-fill text-success"></i>
            <span>{this.state.successMessage}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ successMessage: "" })} />
          </div>
        )}
        {this.state.errorMessage && (
          <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
            <i className="bi bi-x-circle-fill"></i>
            <span>{this.state.errorMessage}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ errorMessage: "" })} />
          </div>
        )}
        <h5>Qualifications</h5>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Degree</th>
              <th>Field</th>
              <th>Institute</th>
              <th>Year</th>
              <th style={{ width: "100px" }}>Action</th> {/* Add this */}
            </tr>
          </thead>
          <tbody>
            {formData.education.length > 0 ? (
              formData.education.map((edu, idx) => (
                <tr key={idx}>
                  <td>{edu.degree_label || "-"}</td> {/* Show name, not ID */}
                  <td>{edu.degreeTitle_label || "-"}</td>{" "}
                  {/* Show name, not ID */}
                  <td>{edu.institutes_label || "-"}</td>{" "}
                  {/* Show name, not ID */}
                  <td>
                    {edu.endDate
                      ? new Date(edu.endDate).getFullYear()
                      : edu.ongoing
                        ? "Ongoing"
                        : "-"}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm custom-progress-bar text-white"
                      onClick={() => this.openEditModal(edu)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  No qualifications added
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <button
          className="btn custom-progress-bar text-white"
          onClick={() =>
            this.setState({ showEducationModal: true, educationDraft: { ...emptyDraft }, })
          }
        >
          + Add Qualification
        </button>

        {showEducationModal && (
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {educationDraft.id
                      ? "Edit Qualification"
                      : "Add Qualification"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => this.setState({ showEducationModal: false })}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Degree select */}
                  <div className="mb-3">
                    <label>Degree</label>
                    <CustomSelect
                      options={degreeFieldData.map((d) => ({ value: d.id, label: d.name }))}
                      value={educationDraft.degree || ""}
                      onChange={(val) => {
                        const selectedDegree = this.state.degreeFieldData.find(
                          (d) => String(d.id) === String(val)
                        );

                        this.setState((prev) => ({
                          educationDraft: {
                            ...prev.educationDraft,
                            degree: val,
                            degree_label: selectedDegree?.name || "",
                            degreeTitle: "",
                            degreeTitleObj: null,
                          },
                        }));
                      }}
                      placeholder="Select Degree"
                    />
                  </div>

                  {/* <<< Add this below inside modal-body >>> */}
                  {/* Degree Title */}
                  <div className="mb-3">
                    <label>Degree Title</label>
                    <AsyncSelect
                      key={educationDraft.degree}
                      cacheOptions
                      defaultOptions
                      loadOptions={(inputValue) => {
                        const degreeId = Number(educationDraft.degree);
                        if (!degreeId || isNaN(degreeId)) return [];
                        return this.loadDegreeTitles(degreeId)(inputValue);
                      }}
                      value={educationDraft.degreeTitleObj || null}
                      onChange={(opt) =>
                        this.handleDraftChange("degreeTitle", opt, "select")
                      }
                      placeholder="Select Degree Title"
                      styles={selectTealStyles}
                    />
                  </div>

                  {/* Institute */}
                  <div className="mb-3">
                    <label>Institute</label>
                    <AsyncSelect
                      cacheOptions
                      defaultOptions
                      loadOptions={this.loadInstitutes}
                      value={educationDraft.instituteObj || null}
                      onChange={(opt) =>
                        this.handleDraftChange("institute", opt, "select")
                      }
                      placeholder="Select Institute"
                      styles={selectTealStyles}
                    />
                  </div>

                  {/* Dates */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label>Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={educationDraft.startDate || ""}
                        onChange={(e) =>
                          this.setState({
                            educationDraft: {
                              ...educationDraft,
                              startDate: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label>End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        disabled={educationDraft.ongoing}
                        value={educationDraft.endDate || ""}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          const today = new Date().toISOString().split("T")[0]; // current date in yyyy-mm-dd
                          if (selectedDate > today) {
                            this.setState({ errorMessage: "End Date cannot be in the future" });
                            setTimeout(() => this.setState({ errorMessage: "" }), 3000);
                            return;
                          }
                          this.setState({
                            educationDraft: {
                              ...educationDraft,
                              endDate: selectedDate,
                            },
                          });
                        }}
                        max={new Date().toISOString().split("T")[0]} // prevent picking future dates
                      />
                    </div>
                  </div>

                  {/* Ongoing */}
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={educationDraft.ongoing || false}
                      onChange={(e) =>
                        this.setState({
                          educationDraft: {
                            ...educationDraft,
                            ongoing: e.target.checked,
                            endDate: e.target.checked
                              ? ""
                              : educationDraft.endDate,
                          },
                        })
                      }
                    />
                    <label className="form-check-label">Ongoing</label>
                  </div>
                  {/* <<< End of added modal content >>> */}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => this.setState({ showEducationModal: false })}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn custom-progress-bar text-white"
                    onClick={this.saveEducation}
                  >
                    {educationDraft.id ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default EducationStep;
