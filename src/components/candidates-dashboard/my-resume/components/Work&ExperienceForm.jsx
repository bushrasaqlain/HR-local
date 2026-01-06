import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { toast } from "react-toastify";
// import { Container, Col, Row, Form, Label } from "reactstrap";

// const Experience = ({ userId, isEditMode, experienceId }) => {
const Experience = ({ userId, experienceId, isEditMode, setWorkExperienceData, onClose }) => {

  const [formData, setFormData] = useState({
    designation: "",
    startDate: "",
    endDate: "",
    company_name: "",
    description: "",
    user_id: userId,
  });
  const [isOngoing, setIsOngoing] = useState(false);

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "designation":
        if (!value.trim()) {
          error = "Designation is required";
        } else if (!/^[A-Za-z\s]+$/.test(value)) {
          error = "Designation must contain only letters";
        }
        break;

      case "company_name":
        if (!value.trim()) error = "Company name is required";
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
        case "designation":
          if (!value.trim()) {
            error = "Designation is required";
          } else if (!/^[A-Za-z\s]+$/.test(value)) {
            error = "Designation must contain only letters";
          }
          break;

        case "company_name":
          if (!value.trim()) error = "Company name is required";
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



  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   // Your API endpoint for adding education records
  //   const apiUrl = `http://localhost:8080/work-experience`;

  //   try {
  //     const response = await axios.post(apiUrl, formData);

  //     if (response.status === 200) {
  //       const data = response.data;
  //       alert("Form submitted successfully!");
  //       console.log('Work record added successfully:', data);
  //       // You can redirect to another page or perform any other action upon successful submission
  //       router.back();
  //     } else {
  //       console.error('Failed to add Work record:', response.statusText);
  //     }
  //   } catch (error) {
  //     console.error('Error:', error.message);
  //     alert("Form submission failed. Please try again.");
  //   }
  // };

  useEffect(() => {
    // Fetch the existing data if in edit mode
    // populates the form fields
    if (isEditMode && experienceId) {
      // Your API endpoint for fetching specific work experience data
      const apiUrl = `http://localhost:8080/work-experience-get/${experienceId}`;

      const fetchData = async () => {
        try {
          const response = await axios.get(apiUrl);
          if (response.status === 200) {
            // console.log("ResponseData: ", response.data);
            // setFormData(response.data); not working like this
            // Ensure the response.data structure matches the state structure
            const { designation, start_date, end_date, company_name, description } =
              response.data[0];

            // Set the form data
            setFormData({
              designation,
              startDate: start_date,
              endDate: end_date,
              company_name,
              description,
              user_id: userId,
            });
            if (end_date === null) setIsOngoing(true);

            // console.log("checkkkkkkkkk", isEditMode )
            // console.log("fetcheddddddddddddd", formData )
          } else {
            console.error(
              "Failed to fetch work experience data:",
              response.statusText
            );
          }
        } catch (error) {
          console.error("Error:", error.message);
        }
      };

      fetchData();
    }
  }, [isEditMode, experienceId, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      startDate: formData.startDate.slice(0, 10),
      endDate: formData.endDate ? formData.endDate.slice(0, 10) : null,
    };

    // Determine the API endpoint based on add or edit mode
    const apiUrl = isEditMode
      ? `http://localhost:8080/work-experience/${experienceId}`
      : "http://localhost:8080/work-experience";
    // console.log("testingggggggggg", isEditMode)
    try {
      const response = isEditMode
        ? await axios.put(apiUrl, payload)
        : await axios.post(apiUrl, payload);

      if (response.status === 200) {
        
          console.log("EXP returend", response.data)
        if (isEditMode) {
          toast.success("Updated Successfully!");
          setWorkExperienceData((prev) => prev.map((item) =>
            item.id === response.data.id ? response.data.record : item
          ));
        } else {
          toast.success("Education is added Successfully!");

          setWorkExperienceData(prev => [...prev, response.data.record])

        }
        onClose();
      }
      } catch (error) {
        console.error("Error:", error.message);
        toast.error("Form submission failed. Please try again.");
      }
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
>          <div style={{ display: "flex", justifyContent: "end", alignItems: "center" }}>
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
              <h3>Work and Experience Form</h3>
            </div>
            <div className="col-lg-12 col-md-12 offset-lg-1 offset-md-1">
              <div className="default-form ">
                <div className="row">
                  <div className="form-group col-lg-10 col-md-10 ">
                    <label>Designation <span className="text-danger"> *</span></label>
                    <input
                      type="text"
                      name="designation"
                      placeholder="Designation"
                      onChange={handleChange}
                      // ref={phoneRef}
                      value={formData.designation}
                    />
                    {errors.designation && <small className="text-danger">{errors.designation}</small>}
                  </div>
                  
                  <div className="form-group  col-lg-10 col-md-10">
                    <label>Company Name <span className="text-danger"> *</span></label>
                    <input
                      type="text"
                      name="company_name"
                      placeholder="comapny name"
                      onChange={handleChange}
                      // ref={phoneRef}
                      value={formData.company_name}
                    />
                    {errors.companyName && <small className="text-danger">{errors.companyName}</small>}
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
                      checked={isOngoing} // ✅ only controlled by state
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
                    <label>Description</label>
                    <textarea
                      name="description"
                      placeholder="description"
                      onChange={handleChange}
                      // ref={phoneRef}
                      value={formData.description}
                      rows={3}
                    className="form-control no-scrollbar"
                    style={{ resize: "vertical", overflow: "auto" }}
                    />
                  </div>


                  <div className="form-group col-lg-12 col-md-12">
                    <button type="button" className="theme-btn btn-style-one" onClick={handleSubmit}>
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

  export default Experience;
