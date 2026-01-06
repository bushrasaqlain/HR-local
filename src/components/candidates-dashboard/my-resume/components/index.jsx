"use client"
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

import Education from "./Education";
import Experiences from "./Experiences";
import SkillsMultiple from "./SkillsMultiple";
import Projects from "./Projects";
import CertificateAwards from "./CertificateAwards";
import CvUploader from "../../CvUploader";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import api from "../../../../../lib/api";

const index = () => {
  const { userId } = useSelector((state) => state.user);
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState("Choose Option");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  let firstErrorField = null;

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const linksRef = useRef(null);

  const educationRef = useRef(null);
  const projectsRef = useRef(null);
  const awardsRef = useRef(null);
  const workRef = useRef(null);


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    links: [],
    professionalSummary: "",
    skills: []
  });
  const [error, setError] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    links: "",
    professionalSummary: "",
    skills: []
  });

  useEffect(() => {
    // Only fetch and set formData if it's empty (first load and not in sessionStorage)
    if (!formData.name && !formData.email && !formData.phone && !formData.address && !formData.portfolioLink && !formData.professionalSummary && (!formData.skills || formData.skills.length === 0)) {
      const fetchUserData = async () => {
        try {
          const response = await api.get(`http://localhost:8080/candidateProfile/candidate/`);
          const userData = response.data;
          console.log("User Data:", userData);

          if (userData && Object.keys(userData).length > 0) {
            // Parse skills: if it's a stringified array of objects, convert to array of values
            let skillsArr = [];
            if (userData.skills) {
              try {
                let parsed = typeof userData.skills === 'string' ? JSON.parse(userData.skills) : userData.skills;
                if (Array.isArray(parsed)) {
                  // If array of objects, extract .value, else use as is
                  skillsArr = parsed.map(s => typeof s === 'object' && s !== null ? s.value : s);
                }
              } catch (e) {
                skillsArr = [];
              }
            }
            const newFormData = {
              name: userData.full_name || "",
              email: userData.email || "",
              phone: userData.Phone || "",
              address: userData.city || "",
              links: userData.Links ? JSON.parse(userData.Links) : [],
              professionalSummary: userData.Description || "",
              skills: skillsArr
            };
            setFormData(newFormData);
          }
        } catch (error) {
          console.log("Error fetching user data:", error);
        }
      };
      fetchUserData();
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    // Validate and only clear error if value is valid
    let err = "";
    if (name === "name") {
      if (!value.trim()) {
        err = "Name is required.";
      } else if (!isValidName(value)) {
        err = "Name must be alphabetic and up to 30 characters long.";
      }
    } else if (name === "email") {
      if (!value.trim()) {
        err = "Email is required.";
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        err = "Please enter a valid email address.";
      }
    } else if (name === "phone") {
      if (!value.trim()) {
        err = "Phone number is required.";
      } else if (!/^(\+\d{12}|\d{11})$/.test(value)) {
        err = "Please enter a valid phone number.";
      }
    } else if (name === "address") {
      if (!value.trim()) {
        err = "Address is required.";
      }
    }
    else if (name === "links") {
      if (formData.links !== "" && !/^https?:\/\/[^\s]+$/.test(value)) {
        err = "Please enter a valid URL starting with http:// or https://";
      }
    }
    setError((prevError) => ({
      ...prevError,
      [name]: err
    }));
  }

  // Optionally, validate onBlur for instant feedback
  const handleBlur = (e) => {
    handleInputChange(e);
  };

  const isValidName = (Name) => {
    return /^[A-Za-z\s]{1,30}$/.test(Name);
  }


  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
  };

  function formatDate(dateStr) {
    if (!dateStr) return "Present"; // null = ongoing
    return dayjs(dateStr).format("MMM YYYY"); // e.g. "Jul 2025"
  }


  // Only called by Generate CV button, not by form submit
  const handleGenerateCV = async () => {
    let valid = true;
    let newErrors = {};
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
      valid = false;
      if (!firstErrorField) firstErrorField = nameRef;
    } else if (!isValidName(formData.name)) {
      newErrors.name = "Name must be alphabetic and up to 30 characters long.";
      valid = false;
      if (!firstErrorField) firstErrorField = nameRef;

    }
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
      valid = false;
      if (!firstErrorField) firstErrorField = emailRef;

    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
      if (!firstErrorField) firstErrorField = emailRef;

    }
    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
      valid = false;
      if (!firstErrorField) firstErrorField = phoneRef;
    } else if (!/^(\+\d{12}|\d{11})$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (11 digits or + followed by 12 digits).";
      valid = false;
      if (!firstErrorField) firstErrorField = phoneRef;

    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
      valid = false;
      if (!firstErrorField) firstErrorField = addressRef;

    }

    // portfolio link validation
    if (formData.links !== "" && !/^https?:\/\/[^\s]+$/.test(formData.links)) {
      err = "Add a valid URL Link.";
      valid = false;
      if (!firstErrorField) firstErrorField = linksRef;

    }
    setError((prevError) => ({ ...prevError, ...newErrors }));
    if (firstErrorField) {
      firstErrorField.current.focus();
      return;
    }

    if (!valid) return;

    setLoading(true);

    // put userdata into user profile table
    const newFormData = new FormData();
    newFormData.append("fullName", formData.name);
    newFormData.append("email", formData.email);
    newFormData.append("phone", formData.phone);
    newFormData.append("city", formData.address);
    newFormData.append("Links", formData.links);
    newFormData.append("description", formData.professionalSummary);
    // Always send skills as a JSON array of strings (values only)
    let skillsArr = Array.isArray(formData.skills)
      ? formData.skills.map(s => typeof s === 'object' && s !== null ? s.value : s)
      : [];
    newFormData.append("skills", JSON.stringify(skillsArr));
    newFormData.append("links", JSON.stringify(formData.links));
    for (let [key, value] of newFormData.entries()) {
      console.log(key, value);
    }


    const updateUserData = async () => {
      try {
        const response = await api.put(
          `http://localhost:8080/candidateProfile/candidate/`,
          newFormData,
          // {
          //   headers: {
          //     "Content-Type": "multipart/form-data",
          //   },
          // }
        );
        if (response.status === 200) {
          console.log("Form submitted successfully!");
        }
      } catch (error) {
        if (error.response) {
          console.error("Backend error:", error.response.data);
        } else {
          console.error("form submission failed. Please try again.", error);
        }
      }
    };

    await updateUserData();

    try {
      const response = await api.post(
        "http://localhost:8080/resume/generate-cv/",
        {},
        { responseType: "blob" } // 👈 tells Axios to expect a Blob
      );

      const contentType = response.headers["content-type"];

      if (contentType.includes("application/json")) {
        // 🔹 If backend sent JSON error/info instead of PDF
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const json = JSON.parse(reader.result);
            toast.error(json.msg || "Error generating CV");
          } catch (err) {
            toast.error("Unexpected error from server");
          }
        };
        reader.readAsText(response.data);
      } else if (contentType.includes("application/pdf")) {
        // 🔹 If backend sent PDF
        toast.success("CV generated successfully!");
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = "CV.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("Error downloading CV:", error);
      toast.error("Failed to generate CV");
    }
    finally {
      setLoading(false);
    }
  };


  // Save formData to sessionStorage on every change
  useEffect(() => {
    console.log("Form data changed:", formData);
  }, [formData]);


  return (
    <>
      <form className="default-form" onSubmit={e => e.preventDefault()}>
        <div className="row">
          <div className="form-group col-lg-6 col-md-12">
            <label>Select Your CV</label>
            <select
              className="chosen-single form-select"
              value={selectedOption}
              onChange={handleSelectChange}
            >
              <option>Choose Option </option>

              <option>My CV</option>
              <option>Upload CV</option>
            </select>
          </div>

          {selectedOption === "My CV" && (
            <>
              {/* <!-- Input --> */}

              <div className="form-group col-lg-12 col-md-12">
                <label>
                  Full Name <span className="text-danger">*</span>
                </label>

                <input
                  type="text"
                  ref={nameRef}
                  name="name"
                  className="input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={!!formData.name}
                  required
                />
                <div className="error-message text-danger">
                  {error.name}
                </div>
              </div>
              {/* <!-- Input --> */}
              <div className="form-group col-lg-12 col-md-12">
                <label>Email <span className="text-danger">*</span> </label>
                <input
                  type="email"
                  ref={emailRef}
                  name="email"
                  className="input"
                  placeholder="johndoe@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={!!formData.email}
                  required
                />
                <div className="error-message text-danger">
                  {error.email}
                </div>
              </div>
              {/* <!-- email --> */}
              <div className="form-group col-lg-12 col-md-12">
                <label>Phone <span className="text-danger">*</span> </label>
                <input
                  type="text"
                  ref={phoneRef}
                  name="phone"
                  className="input"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  required
                />
                <div className="error-message text-danger">
                  {error.phone}
                </div>
              </div>
              {/* <!-- phone --> */}

              <div className="form-group col-lg-12 col-md-12">
                <label>Address <span className="text-danger">*</span> </label>
                <input
                  type="text"
                  ref={addressRef}
                  name="address"
                  className="input"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                />
                <div className="error-message text-danger">
                  {error.address}
                </div>
              </div>
              {/* <!-- address --> */}

              <div className="form-group col-lg-12 col-md-12">
                <label>Skills</label>
                <SkillsMultiple
                  skills={
                    // Convert array of strings to array of {value,label} for select
                    Array.isArray(formData.skills)
                      ? formData.skills.map(s => typeof s === 'object' && s !== null ? s : { value: s, label: s })
                      : []
                  }
                  setSkills={skillsArr =>
                    setFormData(prev => ({
                      ...prev,
                      skills: Array.isArray(skillsArr)
                        ? skillsArr.map(s => typeof s === 'object' && s !== null ? s.value : s)
                        : []
                    }))
                  }
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <label className="form-label fw-semibold me-5">
                    Links (Portfolio, LinkedIn, GitHub)
                  </label>

                  <button
                    className="add-info-btn fs-6"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, links: [...prev.links, ""] }))
                    }
                  >
                    <span className="icon flaticon-plus"></span> Add Link
                  </button>
                </div>


                {formData.links.map((link, index) => (
                  <div key={index} className="input-group mb-2">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://example.com"
                      value={link}
                      ref={linksRef}
                      name="links"
                      onChange={(e) => {
                        const newLinks = [...formData.links];
                        newLinks[index] = e.target.value;
                        setFormData((prev) => ({ ...prev, links: newLinks }));
                        const value = e.target.value;
                        if (value.startsWith("https://") || value.startsWith("http://")) {
                          setError((prevErr) => {
                            const { links, ...rest } = prevErr;
                            return rest;
                          })
                        } else {
                          setError((prevErr) => ({ ...prevErr, links: "Link must start with http:// or https://" }))
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => {
                        const newLinks = formData.links.filter((_, i) => i !== index);
                        setFormData((prev) => ({ ...prev, links: newLinks }));
                      }}
                    >
                      <span className="icon flaticon-close"></span> {/* Bootstrap Icons */}
                    </button>
                  </div>
                ))}
                {error.links && <span className="text-danger" >{error.links}</span>}

              </div>


              <div className="form-group col-lg-12 col-md-12">
                <label>Professional Summary</label>
                <textarea
                  name="professionalSummary"
                  value={formData.professionalSummary}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Spent several years working on sheep on Wall Street. Had moderate success investing in Yugo's on Wall Street. Managed a small team buying and selling Pogo sticks for farmers. Spent several years licensing licorice in West Palm Beach, FL. Developed several new methods for working it banjos in the aftermarket. Spent a weekend importing banjos in West Palm Beach, FL.In this position, the Software Engineer collaborates with Evention's Development team to continuously enhance our current software solutions as well as create new solutions to eliminate the back-office operations and management challenges present"
                />
              </div>
              {/* <!-- professional Summary --> */}



              <div className="form-group col-lg-12 col-md-12" ref={educationRef}>
                <Education
                  userId={userId} />
                {/* <!-- Resume / Education --> */}
              </div>

              <div className="form-group col-lg-12 col-md-12" ref={workRef}>
                <Experiences
                  userId={userId} />
                {/* <!-- Resume / Work & Experience --> */}
              </div>
              {/* <!--  education and word-experiences --> */}


              <div className="form-group col-lg-12 col-md-12" ref={awardsRef}>
                {/* <!-- certification / Awards --> */}
                <CertificateAwards userId={userId} />
              </div>
              {/* <!-- End Award/certification --> */}


              <div className="form-group col-lg-12 col-md-12" ref={projectsRef}>
                {/* <!-- Projects --> */}
                <Projects userId={userId} />
              </div>
              {/* <!-- End projects --> */}


            </>
          )}

          {/* <!-- Multi Selectbox --> */}

          {/* Render the "Submit" button only if the selected option is not "Upload CV" */}
          {/* {selectedOption !== "Upload CV" && (
          <div className="form-group col-lg-12 col-md-12">
            <button type="submit" className="theme-btn btn-style-one">
              Submit
            </button>
          </div>
        )} */}

          {/* <!-- Input --> */}
        </div>
        {/* End .row */}
        {selectedOption === "My CV" && (
          <div className="form-group col-lg-12 col-md-12">
            <button type="button" className="btn btn-primary py-3" disabled={loading} onClick={handleGenerateCV}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="w-5 h-5 border-2 border-blue-600 border-dashed rounded-full animate-spin"></span>
                  Generating CV ...
                </span>
              ) : (
                "Generate CV"
              )}
            </button>
          </div>
        )}

        {/* call this model when cv is generated successfully */}
        {selectedOption === "My CV" && success && (
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
            onClick={() => setSuccess(false)}
          >
            <div style={{ background: "#fff", borderRadius: 8, minWidth: 350, maxWidth: 400, padding: 32, boxShadow: "0 2px 24px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h5 style={{ margin: 0 }}>CV Generated Successfully</h5>
                <button
                  type="button"
                  style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}
                  aria-label="Close"
                  onClick={() => setSuccess(false)}
                >
                  &times;
                </button>
              </div>
              <div style={{ marginBottom: 24 }}>
                <img src="/images/cv_success.webp" alt="Success" />
                <p>Your CV has been generated and downloaded successfully.</p>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button type="button" className="btn btn-primary" style={{ background: "#0984ff" }} >
                  <Link href="/job-list/job-list-v1" style={{ color: "white" }}>
                    Start Applying for Jobs
                  </Link>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
      {selectedOption === "Upload CV" && (
        <div className="form-group col-lg-12 col-md-12">
          {/* Render the component for uploading CV */}
          <CvUploader userId={userId} />
        </div>
      )}

    </>
  );
};

export default index;
