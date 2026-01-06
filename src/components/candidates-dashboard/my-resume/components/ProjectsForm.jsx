import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import SkillsMultiple from "./SkillsMultiple";
import { toast } from "react-toastify";

const ProjectsForm = ({ userId, projectsId, isEditMode, setProjectsData, onClose }) => {

  const [formData, setFormData] = useState({
    projectTitle: "",
    role: "",
    projectDescription: "",
    skillsUsed: [],
    projectLink: "",
    user_id: userId
  });

  const [errors, setErrors] = useState({});



  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "projectTitle":
        if (!value.trim()) {
          error = "Project title is required";
        } else if (!/^[A-Za-z\s]+$/.test(value)) {
          error = "Project title must contain only letters";
        }
        break;

      case "role":
        if (!value.trim()) {
          error = "Role is required";
        } else if (!/^[A-Za-z\s]+$/.test(value)) {
          error = "Role must contain only letters";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };


  const validateForm = () => {
    let newErrors = {};

    Object.keys(formData).forEach((key) => {
      let error = "";
      const value = formData[key];

      switch (key) {
        case "projectTitle":
          if (!value.trim()) {
            error = "Project title is required";
          } else if (!/^[A-Za-z\s]+$/.test(value)) {
            error = "Project title must contain only letters";
          }
          break;

        case "role":
          if (!value.trim()) {
            error = "Role is required";
          } else if (!/^[A-Za-z\s]+$/.test(value)) {
            error = "Role must contain only letters";
          }
          break;

        default:
          break;
      }

      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };




  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      user_id: userId,
    });
    validateField(name, value); // real-time validation
  };



  const skillsOptions = [
    { value: "Banking", label: "Banking" },
    { value: "Digital & Creative", label: "Digital & Creative" },
    { value: "Retail", label: "Retail" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Managemnet", label: "Managemnet" },
    { value: "Accounting & Finance", label: "Accounting & Finance" },
    { value: "Digital", label: "Digital" },
    { value: "Creative Art", label: "Creative Art" },
  ];


  useEffect(() => {
    console.log("form data", formData);
  }, [formData])

  useEffect(() => {
    // Fetch the existing data if in edit mode
    // populates the form fields
    if (isEditMode && projectsId) {
      // Your API endpoint for fetching specific work experience data
      const apiUrl = `http://localhost:8080/project-get/${projectsId}`;

      const fetchData = async () => {
        try {
          const response = await axios.get(apiUrl);
          if (response.status === 200) {
            console.log("ResponseData: ", response.data);
            // setFormData(response.data); not working like this
            // Ensure the response.data structure matches the state structure
            const {
              project_title,
              role,
              project_description,
              skills_used,
              project_link
            } = response.data[0];

            // Set the form data
            setFormData({
              projectTitle: project_title,
              role: role,
              projectDescription: project_description,
              skillsUsed: skills_used,
              projectLink: project_link,
              user_id: userId,
            });

            // console.log("checkkkkkkkkk", isEditMode )
            console.log("fetcheddddddddddddd", formData);
          } else {
            console.error(
              "Failed to fetch project data:",
              response.statusText
            );
          }
        } catch (error) {
          console.error("Error:", error.message);
        }
      };

      fetchData();
    }
  }, [isEditMode, projectsId, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;


    // Format dates and skillsUsed for backend
    const payload = {
      ...formData,
      ProjectTitle: formData.projectTitle,
      skillsUsed: JSON.stringify(formData.skillsUsed),
    };
    delete payload.projectTitle; // Remove lowercase key

    // Determine the API endpoint based on add or edit mode
    const apiUrl = isEditMode
      ? `http://localhost:8080/projects/${projectsId}`
      : "http://localhost:8080/projects";
    try {
      const response = isEditMode
        ? await axios.put(apiUrl, payload)
        : await axios.post(apiUrl, payload);

      if (response.status === 200) {
        if (isEditMode) {
          toast.success("Updated Successfully!");
          setProjectsData((prev) => prev.map((item) =>
            item.id === response.data.id ? response.data : item
          ));
        } else {
          toast.success("Project is added Successfully!");

          setProjectsData(prev => [...prev, response.data])

        }
        onClose();
      } else {
        console.error(
          "Failed to add/update Project record:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Form submission failed. Please try again.");
    }
  };

  const handleSkillChange = (selectedSkills) => {
    const selectedValues = selectedSkills.map((option) => option.value);
    setFormData((prevData) => ({
      ...prevData,
      skillsUsed: selectedValues,
    }));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
<div
  className="no-scrollbar"
  style={{
    background: "#fff",
    borderRadius: 8,
    maxWidth: "50vw",
    maxHeight: "80vh",
    padding: 32,
    boxShadow: "0 2px 24px rgba(0,0,0,0.2)",
    overflowY: "auto"   // ✅ scrollable inside
  }}
  onClick={(e) => e.stopPropagation()}
>        <div style={{ display: "flex", justifyContent: "end", alignItems: "center" }}>
          <button
            type="button"
            style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", position: "absolute" }}
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="row">
          <div className="text-center mt-5">
            <h3>Project Form</h3>
          </div>
          <div className="col-lg-12 col-md-12 offset-lg-1 offset-md-1">
            <div className="default-form">
              <div className="row">
                <div className="form-group col-lg-10 col-md-10 ">
                  <label>Project Name <span className="text-danger"> *</span></label>
                  <input
                    type="text"
                    name="projectTitle"
                    placeholder="project title"
                    onChange={handleChange}
                    // ref={phoneRef}
                    value={formData.projectTitle}
                  />
                  {errors.projectTitle && <small className="text-danger">{errors.projectTitle}</small>}

                </div>
                <div className="form-group col-lg-10 col-md-10 ">
                  <label>Role <span className="text-danger"> *</span></label>
                  <input
                    type="text"
                    name="role"
                    placeholder="role"
                    onChange={handleChange}
                    // ref={phoneRef}
                    value={formData.role}
                  />
                  {errors.role && <small className="text-danger">{errors.role}</small>}
                </div>

                <div className="form-group col-lg-10 col-md-10">
                  <label>Project Link / Demo</label>
                  <input
                    type="text"
                    name="projectLink"
                    placeholder="https://yourproject.com"
                    value={formData.projectLink}
                    onChange={handleChange}
                  />
                  {/* <div className="error-message text-danger">
                    {error.portfolioLink}
                </div> */}
                </div>

                <div className="form-group col-lg-10 col-md-12">
                  <label>Skills </label>
                  <Select
                    // defaultValue={[catOptions[1]]}
                    value={formData.skillsUsed.map((skill) =>
                      skillsOptions.find((option) => option.value === skill)
                    )}

                    isMulti
                    name="skills"
                    options={skillsOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={handleSkillChange}
                  />
                  {/* {errors.skills && (
                          <span style={{ color: "red" }}>{errors.skills}</span>
                        )} */}
                </div>
                <div className="form-group  col-lg-10 col-md-10">
                  <label>Project Description</label>
                  <textarea
                    name="projectDescription"
                    placeholder="Description"
                    onChange={handleChange}
                    // ref={phoneRef}
                    value={formData.projectDescription}
                    rows={3}
                    className="form-control no-scrollbar"
                    style={{ resize: "vertical", overflow: "auto" }}
                  />
                </div>
                <div className="form-group col-lg-12 col-md-12 ">
                  <button
                    type="button"
                    className="theme-btn btn-style-one"
                    onClick={handleSubmit} // directly call your handler
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsForm;
