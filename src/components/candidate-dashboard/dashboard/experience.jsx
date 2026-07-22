import React, { Component } from "react";
import AsyncSelect from "react-select/async";
import api from "../../lib/api";
import { Container } from "reactstrap";

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
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#e6eeef",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#36565F",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#36565F",
    "&:hover": {
      backgroundColor: "#36565F",
      color: "#fff",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 30,
  }),
};

// ✅ Helper function to format date from UTC to local YYYY-MM-DD
const formatDateToLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Check if date is valid
  if (isNaN(date.getTime())) return "";

  // Convert to local date without timezone offset
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ✅ Helper to format date for display (e.g., "2021-10-21" or "Oct 21, 2021")
const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const isDateOngoing = (dateStr) => {
  if (!dateStr) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(dateStr);
  return endDate > today;
};

const emptyExperienceDraft = {
  companyName: "",
  designation: "",
  speciality: "",
  speciality_label: "",
  specialityObj: null,
  startDate: "",
  endDate: "",
  job_type_id: "",
  job_type_label: "",
  jobTypeObj: null,
  id: null,
  editingSkills: false,
};

class ExperienceStep extends Component {
  state = {
    formData: {
      experience: [],
    },
    experienceDraft: { ...emptyExperienceDraft },
    specialityOptions: [],
    jobTypeOptions: [],
    showExperienceModal: false,
    skills: "",
    successMessage: "",
    errorMessage: "",
  };

  componentDidMount() {
    this.fetchCandidateExperience();
    this.loadSkills();
    this.loadSpecialities();
    this.loadJobTypesAsync();
  }

  loadJobTypesAsync = async () => {
    try {
      const res = await api.get("/getalljobtypes");
      const jobTypes = res.data?.jobtypes || [];
      const options = jobTypes.map(jt => ({
        value: jt.id,
        label: jt.name,
      }));
      this.setState({ jobTypeOptions: options });
      return options;
    } catch (err) {
      console.error("Failed to load job types:", err);
      return [];
    }
  };

  fetchCandidateExperience = async () => {
    try {
      const [expRes, infoRes] = await Promise.all([
        api.get("/candidateexperience/getexperience"),
        api.get("/candidateProfile/candidate"),
      ]);

      const experienceList = Array.isArray(expRes.data?.data)
        ? expRes.data.data.map((item) => ({
          id: item.id,
          companyName: item.company_name || "",
          designation: item.designation || "",
          speciality_id: item.speciality_id || "",
          speciality_label: item.speciality_name || "",
          specialityObj: item.speciality_id
            ? { value: item.speciality_id, label: item.speciality_name }
            : null,
          // ✅ Format start date correctly
          startDate: item.start_date ? formatDateToLocal(item.start_date) : "",
          endDate: item.is_ongoing ? "" : (item.end_date ? formatDateToLocal(item.end_date) : ""),
          job_type_id: item.job_type_id_value || "",
          job_type_label: item.job_type_name || "",
          jobTypeObj: item.job_type_id_value
            ? { value: item.job_type_id_value, label: item.job_type_name }
            : null,
        }))
        : [];

      const candidateSkills = Array.isArray(infoRes.data?.skills)
        ? infoRes.data.skills.map((s) => ({
          value: s.id,
          label: s.name,
        }))
        : [];

      this.setState((prev) => ({
        formData: {
          ...prev.formData,
          experience: experienceList,
          skills: candidateSkills,
        },
      }));
    } catch (err) {
      console.error("Profile load failed", err);
      this.setState({ errorMessage: "Failed to load profile data" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  loadSkills = async () => {
    try {
      const res = await api.get("/getAllskills");
      const skillsArray = Array.isArray(res.data.skills) ? res.data.skills : [];
      const options = skillsArray.map((s) => ({
        value: s.id,
        label: s.name,
      }));
      return options;
    } catch (err) {
      console.error("Failed to load skills", err);
      this.setState({ errorMessage: "Could not load skills" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return [];
    }
  };

  saveSkills = async () => {
    const { formData } = this.state;
    const skillIds = (formData.skills || []).map((s) => s.value);

    try {
      const formDataObj = new FormData();
      formDataObj.append("skills", JSON.stringify(skillIds));
      formDataObj.append("mode", "save");

      await api.post("/candidateProfile/candidate/passport-photo", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      this.setState({ editingSkills: false, successMessage: "Skills saved" });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (err) {
      console.error("Skills save failed", err);
      this.setState({ errorMessage: "Failed to save skills" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  loadSpecialities = async () => {
    try {
      const res = await api.get("/getAllspeciality");
      const options = (res.data.speciality || []).map(s => ({
        value: s.id,
        label: s.name,
      }));
      this.setState({ specialityOptions: options });
      return options;
    } catch (err) {
      console.error("Failed to load specialities:", err);
      return [];
    }
  };

  handleDraftChange = (key, value, type = "normal") => {
    this.setState((prev) => {
      let draft = { ...prev.experienceDraft };

      if (type === "select") {
        draft[key] = value?.value || "";
        draft[`${key}_label`] = value?.label || "";
        draft[`${key}Obj`] = value || null;
      } else {
        draft[key] = value;
      }

      return { experienceDraft: draft };
    });
  };

  shouldBeOngoing = (endDate) => {
    if (!endDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDateObj = new Date(endDate);
    return endDateObj > today;
  };

  openEditModal = (expRow) => {
    const draft = {
      id: expRow.id,
      companyName: expRow.companyName,
      designation: expRow.designation,
      speciality: expRow.speciality_id || "",
      speciality_label: expRow.speciality_label || "",
      specialityObj: expRow.speciality_id
        ? { value: expRow.speciality_id, label: expRow.speciality_label }
        : null,
      startDate: expRow.startDate || "",
      endDate: expRow.endDate || "",
      job_type_id: expRow.job_type_id || "",
      job_type_label: expRow.job_type_label || "",
      jobTypeObj: expRow.jobTypeObj || null,
    };

    this.setState({
      showExperienceModal: true,
      experienceDraft: draft,
    });
  };

  saveExperience = async () => {
    const { experienceDraft } = this.state;

    if (!experienceDraft.companyName || !experienceDraft.designation) {
      this.setState({ errorMessage: "Please fill required fields" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    const isOngoing = this.shouldBeOngoing(experienceDraft.endDate);
    const finalEndDate = isOngoing ? null : (experienceDraft.endDate || null);

    try {
      if (experienceDraft.id) {
        await api.put(
          `/candidateexperience/updateexperience/${experienceDraft.id}`,
          {
            companyName: experienceDraft.companyName,
            designation: experienceDraft.designation,
            speciality_id: experienceDraft.specialityObj
              ? Number(experienceDraft.specialityObj.value)
              : null,
            startDate: experienceDraft.startDate,
            endDate: finalEndDate,
            ongoing: isOngoing,
            job_type_id: experienceDraft.jobTypeObj
              ? Number(experienceDraft.jobTypeObj.value)
              : null,
          }
        );
      } else {
        await api.post("/candidateexperience/addexperience", {
          experience: [{
            companyName: experienceDraft.companyName,
            designation: experienceDraft.designation,
            speciality_id: experienceDraft.specialityObj
              ? Number(experienceDraft.specialityObj.value)
              : null,
            startDate: experienceDraft.startDate,
            endDate: finalEndDate,
            ongoing: isOngoing,
            job_type_id: experienceDraft.jobTypeObj
              ? Number(experienceDraft.jobTypeObj.value)
              : null,
          }],
          mode: "save",
        });
      }

      await this.fetchCandidateExperience();

      this.setState({
        showExperienceModal: false,
        experienceDraft: { ...emptyExperienceDraft },
        successMessage: experienceDraft.id ? "Experience updated" : "Experience added",
      });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);
    } catch (err) {
      console.error(err);
      this.setState({ errorMessage: "Failed to save experience" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  render() {
    const { formData, experienceDraft, showExperienceModal, editingSkills, jobTypeOptions } = this.state;

    return (
      <Container fluid>
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
          <h5>Experience</h5>
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Company</th>
                <th>Designation</th>
                <th>Speciality</th>
                <th>Job Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th style={{ width: "120px" }} className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.experience && formData.experience.length > 0 ? (
                formData.experience.map((exp, idx) => (
                  <tr key={idx}>
                    <td>{exp.companyName || "-"}</td>
                    <td>{exp.designation || "-"}</td>
                    <td>{exp.speciality_label || "-"}</td>
                    <td>{exp.job_type_label || "-"}</td>
                    {/* ✅ Format start date for display */}
                    <td>{formatDateForDisplay(exp.startDate) || "-"}</td>
                    <td>
                      {exp.endDate ? (
                        formatDateForDisplay(exp.endDate)
                      ) : (
                        <span className="badge bg-info">Ongoing</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm custom-progress-bar text-white"
                        onClick={() => this.openEditModal(exp)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No experience added
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <button
            className="btn btn-sm custom-progress-bar text-white mb-3"
            onClick={() =>
              this.setState({
                experienceDraft: { ...emptyExperienceDraft },
                showExperienceModal: true,
              })
            }
          >
            + Add Experience
          </button>

          {showExperienceModal && (
            <div className="modal d-block" tabIndex="-1" role="dialog">
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {experienceDraft.id ? "Edit Experience" : "Add Experience"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => this.setState({ showExperienceModal: false })}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label>Company Name *</label>
                        <input
                          className="form-control"
                          value={experienceDraft.companyName}
                          onChange={(e) =>
                            this.handleDraftChange("companyName", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label>Designation *</label>
                        <input
                          className="form-control"
                          value={experienceDraft.designation}
                          onChange={(e) =>
                            this.handleDraftChange("designation", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label>Speciality</label>
                        <AsyncSelect
                          cacheOptions
                          defaultOptions={this.state.specialityOptions}
                          loadOptions={this.loadSpecialities}
                          value={experienceDraft.specialityObj}
                          onChange={(opt) => this.handleDraftChange("speciality", opt, "select")}
                          placeholder="Select Speciality"
                          styles={selectTealStyles}
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label>Job Type</label>
                        <AsyncSelect
                          cacheOptions
                          defaultOptions={this.state.jobTypeOptions}
                          loadOptions={this.loadJobTypesAsync}
                          value={experienceDraft.jobTypeObj}
                          onChange={(opt) => this.handleDraftChange("jobType", opt, "select")}
                          placeholder="Select Job Type"
                          isClearable
                          styles={{
                            ...selectTealStyles,
                            control: (base, state) => ({
                              ...selectTealStyles.control(base, state),
                              borderRadius: "7px",
                              fontSize: 14,
                              minHeight: 38,
                            }),
                          }}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label>Start Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={experienceDraft.startDate || ""}
                          onChange={(e) =>
                            this.handleDraftChange("startDate", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label>End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={experienceDraft.endDate || ""}
                          onChange={(e) =>
                            this.handleDraftChange("endDate", e.target.value)
                          }
                        />
                        <small className="text-muted">
                          {experienceDraft.endDate && isDateOngoing(experienceDraft.endDate)
                            ? "📅 Future date — will be marked as ongoing"
                            : "Leave empty if currently working here"}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => this.setState({ showExperienceModal: false })}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn custom-progress-bar text-white"
                      onClick={this.saveExperience}
                    >
                      {experienceDraft.id ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-2">
          <label>Skills</label>
          {editingSkills ? (
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={this.loadSkills}
              value={this.state.formData.skills || []}
              onChange={(selected) =>
                this.setState((prev) => ({
                  formData: { ...prev.formData, skills: selected },
                }))
              }
              placeholder="Select Skills"
              styles={selectTealStyles}
            />
          ) : (
            <div
              className="form-control"
              onClick={() => this.setState({ editingSkills: true })}
              style={{ cursor: "pointer", minHeight: "38px" }}
            >
              {this.state.formData.skills?.map((s) => s.label).join(", ") || "-"}
            </div>
          )}
        </div>
        {editingSkills && (
          <div className="mt-1">
            <button className="btn btn-sm text-white me-2" style={{ background: "#36565F", border: "#36565F" }} onClick={this.saveSkills}>
              Save
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => this.setState({ editingSkills: false })}
            >
              Cancel
            </button>
          </div>
        )}
      </Container>
    );
  }
}

export default ExperienceStep;