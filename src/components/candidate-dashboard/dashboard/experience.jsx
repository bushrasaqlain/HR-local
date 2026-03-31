import React, { Component } from "react";
import AsyncSelect from "react-select/async";
import api from "../../lib/api";
// import { toast } from "react-toastify";
import { Container } from "reactstrap";

const emptyExperienceDraft = {
  companyName: "",
  designation: "",
  speciality: "",
  speciality_label: "",
  specialityObj: null,
  startDate: "",
  endDate: "",
  ongoing: false,
  id: null,
  editingSkills: false, // ✅ new flag
};

class ExperienceStep extends Component {
  state = {
    formData: {
      experience: [],
    },
    experienceDraft: { ...emptyExperienceDraft },
    specialityOptions: [],
    showExperienceModal: false,
    skills: "",
    successMessage: "",
    errorMessage: "",
  };

  componentDidMount() {
    this.fetchCandidateExperience();
    this.loadSkills();
    this.loadSpecialities();
  }

  // Fetch all experiences
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
          startDate: item.start_date || "",
          endDate: item.end_date || "",
          ongoing: Boolean(item.is_ongoing),
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

      console.log("data fetched", {
        experienceList,
        candidateSkills,
      });
    } catch (err) {
      console.error("Profile load failed", err);
      this.setState({ errorMessage: "Failed to load profile data" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };



  loadSkills = async (inputValue) => {
    try {
      const res = await api.get("/getAllskills");
      const skillsArray = Array.isArray(res.data.skills) ? res.data.skills : [];

      // map to value/label
      const options = skillsArray.map((s) => ({
        value: s.id,
        label: s.name,
      }));

      return options; // important: AsyncSelect expects return of options
    } catch (err) {
      console.error("Failed to load skills", err);
      this.setState({ errorMessage: "Could not load skills" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return [];
    }
  };

  // Load speciality options for AsyncSelect
  loadSpecialities = async (inputValue) => {

    try {
      const res = await api.get("/getAllspeciality");

      // fix: use res.data.speciality
      const options = (res.data.speciality || []).map(s => ({
        value: s.id,
        label: s.name,
      }));

      this.setState({ specialityOptions: options }, () => {
      });

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

  // Open Edit Modal
  openEditModal = (expRow) => {
    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const offset = d.getTimezoneOffset();
      const adjusted = new Date(d.getTime() - offset * 60000);
      return adjusted.toISOString().split("T")[0];
    };
    const draft = {
      id: expRow.id,
      companyName: expRow.companyName,
      designation: expRow.designation,
      speciality: expRow.speciality_id || "",
      speciality_label: expRow.speciality_label || "",
      specialityObj: expRow.speciality_id
        ? { value: expRow.speciality_id, label: expRow.speciality_label }
        : null,
      startDate: formatDate(expRow.startDate),
      endDate: formatDate(expRow.endDate),
      ongoing: expRow.ongoing || false,
    };

    this.setState({
      showExperienceModal: true,
      experienceDraft: draft,
    });
  };



  saveExperience = async () => {
    const { experienceDraft } = this.state;
    console.log("EDIT ID:", experienceDraft.id);

    if (!experienceDraft.companyName || !experienceDraft.designation) {
      this.setState({ errorMessage: "Please fill required fields" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    try {
      const payload = {
        experience: [
          {
            companyName: experienceDraft.companyName,
            designation: experienceDraft.designation,
            speciality_id: experienceDraft.specialityObj
              ? Number(experienceDraft.specialityObj.value)
              : null,
            startDate: experienceDraft.startDate,
            endDate: experienceDraft.ongoing ? null : experienceDraft.endDate,
            ongoing: experienceDraft.ongoing,
          },
        ],
        mode: "save",
      };

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
            endDate: experienceDraft.ongoing ? null : experienceDraft.endDate,
            ongoing: experienceDraft.ongoing,
          }
        );
      } else {
        await api.post("/candidateexperience/addexperience", payload);
      }

      // ✅ Always refresh from backend
      await this.fetchCandidateExperience();

      this.setState({
        showExperienceModal: false,
        experienceDraft: { ...emptyExperienceDraft },
        successMessage: experienceDraft.id
          ? "Experience updated"
          : "Experience added",
      });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);

      // this.setState((prev) => ({
      //   formData: {
      //     ...prev.formData,
      //     experience: experienceDraft.id
      //       ? prev.formData.experience.map((e) =>
      //         e.id === experienceDraft.id
      //           ? { ...e, ...payload.experience[0] }
      //           : e
      //       )
      //       : [...(prev.formData.experience || []), payload.experience[0]],
      //   },
      //   showExperienceModal: false,
      //   experienceDraft: { ...emptyExperienceDraft },
      // }));
    } catch (err) {
      console.error(err);
      this.setState({ errorMessage: "Failed to save experience" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };

  render() {
    const { formData, experienceDraft, showExperienceModal, editingSkills } = this.state;

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
          <h5>Experince</h5>
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Company</th>
                <th>Designation</th>
                <th>Speciality</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th style={{ width: "120px" }} className="text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {formData.experience && formData.experience.length > 0 ? (
                formData.experience.map((exp, idx) => (
                  <tr key={idx}>
                    <td>{exp.companyName || "-"}</td>
                    <td>{exp.designation || "-"}</td>
                    <td>{exp.speciality_label || "-"}</td>
                    <td>{exp.startDate || "-"}</td>
                    <td>
                      {exp.endDate
                        ? new Date(exp.endDate).getFullYear()
                        : exp.ongoing
                          ? "Ongoing"
                          : "-"}
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
                  <td colSpan="6" className="text-center text-muted">
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
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {experienceDraft.id ? "Edit Experience" : "Add Experience"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() =>
                        this.setState({ showExperienceModal: false })
                      }
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label>Company Name</label>
                      <input
                        className="form-control"
                        value={experienceDraft.companyName}
                        onChange={(e) =>
                          this.handleDraftChange("companyName", e.target.value)
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label>Designation</label>
                      <input
                        className="form-control"
                        value={experienceDraft.designation}
                        onChange={(e) =>
                          this.handleDraftChange("designation", e.target.value)
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label>Speciality</label>
                      <AsyncSelect
                        cacheOptions
                        defaultOptions={this.state.specialityOptions} // preloaded for immediate display
                        loadOptions={this.loadSpecialities} // still fetches dynamically on search
                        value={experienceDraft.specialityObj} // object like {value, label}
                        onChange={(opt) => this.handleDraftChange("speciality", opt, "select")}
                        placeholder="Select Speciality"
                      />

                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label>Start Date</label>
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
                          disabled={experienceDraft.ongoing}
                          value={experienceDraft.endDate || ""}
                          onChange={(e) =>
                            this.handleDraftChange("endDate", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={experienceDraft.ongoing || false}
                        onChange={(e) =>
                          this.handleDraftChange("ongoing", e.target.checked)
                        }
                      />
                      <label className="form-check-label">Ongoing</label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() =>
                        this.setState({ showExperienceModal: false })
                      }
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

          {this.state.editingSkills ? (
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={this.loadSkills} // now returns [{value, label}]
              value={this.state.formData.skills || []}
              onChange={(selected) =>
                this.setState((prev) => ({
                  formData: { ...prev.formData, skills: selected },
                }))
              }
              placeholder="Select Skills"
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
            <button
              className="btn btn-sm btn-primary me-2"
              onClick={() => this.setState({ editingSkills: false })}
            >
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
