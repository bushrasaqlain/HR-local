import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import SkillsMultiple from "./SkillsMultiple";
import { toast } from "react-toastify";

const EducationForm = ({ userId, educationId, isEditMode, setEducationData, onClose }) => {
  // const router = useRouter();
  // const { isEditMode, educationId } = router.query;

  const [formData, setFormData] = useState({
    degreeTitle: "",
    fieldOfStudy: "",
    instituteName: "",
    passingYear: "",
    educationDescription: "",
    startDate: "",
    endDate: "",
    user_id: userId,
  });
  const [isOngoing, setIsOngoing] = useState(false);
  const [errors, setErrors] = useState({});



  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "degreeTitle":
        if (!value.trim()) {
          error = "Degree title is required";
        } else if (!/^[A-Za-z\s]+$/.test(value)) {
          error = "Degree title must contain only letters";
        }
        break;

      case "fieldOfStudy":
        if (!value.trim()) {
          error = "Field of study is required";
        } else if (!/^[A-Za-z\s]+$/.test(value)) {
          error = "Field of study must contain only letters";
        }
        break;

      case "instituteName":
        if (!value.trim()) error = "Institute name is required";
        break;


      case "startDate":
        if (!value) {
          error = "Start date is required";
        }
        break;

      case "endDate":
        if (!isOngoing && !value) {
          error = "End date is required unless ongoing";
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
        case "degreeTitle":
          if (!value.trim()) {
            error = "Degree title is required";
          } else if (!/^[A-Za-z\s]+$/.test(value)) {
            error = "Degree title must contain only letters";
          }
          break;

        case "fieldOfStudy":
          if (!value.trim()) {
            error = "Field of study is required";
          } else if (!/^[A-Za-z\s]+$/.test(value)) {
            error = "Field of study must contain only letters";
          }
          break;

        case "instituteName":
          if (!value.trim()) error = "Institute name is required";
          break;

        case "startDate":
          if (!value) error = "Start date is required";
          break;

        case "endDate":
          if (!isOngoing && !value) error = "End date is required unless ongoing";
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

  useEffect(() => {
    if (isEditMode && educationId) {
      const apiUrl = `http://localhost:8080/education-get/${educationId}`;

      const fetchData = async () => {
        try {
          const response = await axios.get(apiUrl);
          if (response.status === 200) {
            const {
              degree_title,
              field_of_study,
              institute_name,
              start_date,
              end_date,
              education_description,
            } = response.data[0];

            setFormData({
              degreeTitle: degree_title,
              fieldOfStudy: field_of_study,
              instituteName: institute_name,
              startDate: start_date,
              endDate: end_date,
              educationDescription: education_description,
              user_id: userId,
            });

            if (end_date === null) setIsOngoing(true);
          }
        } catch (error) {
          console.error("Error:", error.message);
        }
      };

      fetchData();
    }
  }, [isEditMode, educationId, userId]);


  const handleSubmit = async (e) => {
    e.preventDefault(); // prevents default form submission (query params in URL)
    if (!validateForm()) return;

    const submissionData = {
      ...formData,
      startDate: formData.startDate?.slice(0, 10),
      endDate: formData.endDate ? formData.endDate.slice(0, 10) : null,
    };

    const apiUrl = isEditMode
      ? `http://localhost:8080/education/${educationId}`
      : "http://localhost:8080/education";

    try {
      const response = isEditMode
        ? await axios.put(apiUrl, submissionData)
        : await axios.post(apiUrl, submissionData);

      if (response.status === 200) {
        console.log("educaiton data", response.data);
        if (isEditMode) {
          toast.success("Updated Successfully!");
          setEducationData((prev) => prev.map((item) =>
            item.id === response.data.id ? response.data : item
          ));
        } else {
          toast.success("Education is added Successfully!");

          setEducationData(prev => [...prev, response.data])

        }
        onClose();
      }
    } catch (error) {
      console.error("Error:", error.message);
      toast.error("Form submission failed. Please try again.");
    }
  };


  useEffect(() => {
    console.log("isongoing", isOngoing);
  }, [isOngoing])


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
    overflowY: "auto" 
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
          <div className="text-center mt-3">
            <h3>Education Form</h3>
          </div>
          <div className="col-lg-12 col-md-12 offset-lg-1 offset-md-1">
            {/* form start here */}
            <div className="default-form">
              <div className="row">
                <div className="form-group col-lg-10 col-md-10 ">
                  <label>Degree Title<span className="text-danger"> *</span></label>
                  <input
                    type="text"
                    name="degreeTitle"
                    placeholder="Degree Title"
                    onChange={handleChange}
                    // ref={phoneRef}
                    value={formData.degreeTitle}
                  />
                  {errors.degreeTitle && <small className="text-danger">{errors.degreeTitle}</small>}
                </div>
                <div className="form-group col-lg-10 col-md-10 ">
                  <label>Field of Study<span className="text-danger"> *</span></label>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    placeholder="Field of Study"
                    onChange={handleChange}
                    // ref={phoneRef}
                    value={formData.fieldOfStudy}
                  />
                  {errors.fieldOfStudy && <small className="text-danger">{errors.fieldOfStudy}</small>}
                </div>
                <div className="form-group col-lg-10 col-md-10 ">
                  <label>Institute Name<span className="text-danger"> *</span></label>
                  <input
                    type="text"
                    name="instituteName"
                    placeholder="Institute Name"
                    onChange={handleChange}
                    // ref={phoneRef}
                    value={formData.instituteName}
                  />
                  {errors.instituteName && <small className="text-danger">{errors.instituteName}</small>}
                </div>

                

                <div className="form-group col-lg-5 col-md-5">
                  <label>
                    Start Date <span className="text-danger"> *</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    placeholder="12/09/2023"
                    onChange={handleChange}
                    value={formData.startDate ? formData.startDate.slice(0, 10) : ""}
                    className="form-control"
                    max={new Date().toISOString().split("T")[0]} // disable future dates
                  />
                  {errors.startDate && <small className="text-danger">{errors.startDate}</small>}
                </div>


                {!isOngoing &&
                  <div className="form-group col-lg-5 col-md-5">
                    <label>
                      End Date <span className="text-danger"> *</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      placeholder="08/11/2025"
                      onChange={handleChange}
                      value={formData.endDate ? formData.endDate.slice(0, 10) : ""}
                      className="form-control"
                      max={new Date().toISOString().split("T")[0]} // disable future dates
                    />
                    {errors.endDate && <small className="text-danger">{errors.endDate}</small>}
                  </div>
                }

                <div className="form-group col-lg-10 col-md-10">
                  <input
                    type="checkbox"
                    id="isOngoing"
                    name="isOngoing"
                    checked={isOngoing} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsOngoing(checked);
                      setFormData((prevData) => ({
                        ...prevData,
                        endDate: checked ? "" : prevData.endDate // reset endDate if ongoing
                      }));
                    }}
                    className="form-check-input me-2"
                  />
                  <label htmlFor="isOngoing">Is this ongoing?</label>
                </div>

                <div className="form-group  col-lg-10 col-md-10">
                  <label>Education Description</label>
                  <textarea
                    name="educationDescription"
                    placeholder="Description"
                    onChange={handleChange}
                    value={formData.educationDescription}
                    rows={3}
                    className="form-control no-scrollbar"
                    style={{ resize: "vertical", overflow: "auto" }}
                  />
                </div>

                <div className="form-group col-lg-12 col-md-12 mb-2">
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

export default EducationForm;