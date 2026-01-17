"use client";

import React, { Component, createRef } from "react";
import Select from "react-select";
import api from "../lib/api.jsx";
import { toast } from "react-toastify";

class CandidateRegisterForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      formData: {
        fullName: "",
        phone: "",
        email: "",
        currentSalary: "",
        expectedSalary: "",
        experience: "0-1 years",
        age: "",
        education: "",
        categories: [],
        skills: [],
        city: "",
        address: "",
        description: "",
        account_id: "",
        logo: "",
        logoName: "",
        links: [],
      },
      errors: {},
      logoImg: "",
      isNewImageUploaded: false,
    };

    // Refs
    this.fullNameRef = createRef();
    this.emailRef = createRef();
    this.phoneRef = createRef();
    this.logoRef = createRef();
    this.currentSalaryRef = createRef();
    this.expectedSalaryRef = createRef();
    this.experienceRef = createRef();
    this.ageRef = createRef();
    this.educationRef = createRef();
    this.categoriesRef = createRef();
    this.skillsRef = createRef();
    this.cityRef = createRef();
    this.addressRef = createRef();
    this.LinksRef = createRef();

    // Options
    this.catOptions = [
      { value: "Banking", label: "Banking" },
      { value: "Digital & Creative", label: "Digital & Creative" },
      { value: "Retail", label: "Retail" },
      { value: "Human Resources", label: "Human Resources" },
      { value: "Management", label: "Management" },
      { value: "Accounting & Finance", label: "Accounting & Finance" },
      { value: "Digital", label: "Digital" },
      { value: "Creative Art", label: "Creative Art" },
    ];

    this.skillsOptions = [...this.catOptions];
  }

componentDidMount() {
  const token = sessionStorage.getItem("token");
  if (!token) {
    toast.error("Please login first");
    this.props.router.push("/login");
    return;
  }
  this.fetchUserData(token); // Fetch profile data
}


  fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/candidateProfile/candidate/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data;
      if (userData && Object.keys(userData).length > 0) {
        const imageDataUrl = userData.logo ? `data:image/png;base64,${userData.logo}` : "";
        this.setState({
          formData: {
            fullName: userData.full_name || "",
            phone: userData.Phone || "",
            email: userData.email || "",
            currentSalary: userData.Current_Salary || "",
            expectedSalary: userData.Expected_Salary || "",
            experience: userData.Experience || "0-1 years",
            age: userData.Age || "",
            education: userData.Education || "",
            categories: Array.isArray(userData.categories) ? userData.categories : [],
            skills: Array.isArray(userData.skills) ? userData.skills : [],
            city: userData.city || "",
            address: userData.complete_address || "",
            description: userData.Description || "",
            logo: imageDataUrl,
            logoName: userData.logo_name || "",
            links: userData.Links ? JSON.parse(userData.Links) : [],
            account_id: userData.id,
          },
          logoImg: imageDataUrl,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to fetch user data. Please login again.");
    }
  };

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState((prevState) => ({
      formData: { ...prevState.formData, [name]: value },
      errors: { ...prevState.errors, [name]: "" },
    }));
  };

  handleCategoryChange = (selectedCategories) => {
    const selectedValues = selectedCategories.map((opt) => opt.value);
    this.setState((prevState) => ({
      formData: { ...prevState.formData, categories: selectedValues },
    }));
  };

  handleSkillChange = (selectedSkills) => {
    const selectedValues = selectedSkills.map((opt) => opt.value);
    this.setState((prevState) => ({
      formData: { ...prevState.formData, skills: selectedValues },
    }));
  };

  logoHandler = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.setState((prevState) => ({
          isNewImageUploaded: true,
          formData: { ...prevState.formData, logo: reader.result, logoName: file.name },
          logoImg: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      document.getElementById("upload").value = null;
    } else {
      this.setState((prevState) => ({
        isNewImageUploaded: false,
        formData: { ...prevState.formData, logo: "", logoName: "" },
        logoImg: "",
      }));
    }
  };

  base64toBlob = (base64Data, contentType = "image/png") => {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length).fill().map((_, i) => slice.charCodeAt(i));
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { formData, isNewImageUploaded } = this.state;
    const validationErrors = {};

    if (!formData.fullName.trim()) validationErrors.fullName = "Full Name is required";
    if (!formData.phone.trim()) validationErrors.phone = "Phone is required";
    else if (!/^\d+$/.test(formData.phone)) validationErrors.phone = "Phone must be numeric";
    else if (formData.phone.length < 10) validationErrors.phone = "Phone must be 10 digits";
    if (!formData.currentSalary) validationErrors.currentSalary = "Current Salary required";
    if (!formData.expectedSalary) validationErrors.expectedSalary = "Expected Salary required";
    if (!formData.experience) validationErrors.experience = "Experience required";
    if (!formData.age) validationErrors.age = "Age required";
    if (!formData.education) validationErrors.education = "Education required";
    if (!formData.categories.length) validationErrors.categories = "Select at least one category";
    if (!formData.skills.length) validationErrors.skills = "Select at least one skill";
    if (!formData.city) validationErrors.city = "City required";
    if (!formData.address) validationErrors.address = "Address required";

    formData.links.forEach((link) => {
      if (!link.startsWith("http://") && !link.startsWith("https://")) {
        validationErrors.links = "Links must start with http:// or https://";
      }
    });

    this.setState({ errors: validationErrors });

    if (Object.keys(validationErrors).length === 0) {
      try {
        const token = localStorage.getItem("token");
        const payload = new FormData();

        if (isNewImageUploaded && formData.logo) {
          const base64Data = formData.logo.split(",")[1];
          const logoBlob = this.base64toBlob(base64Data);
          payload.append("logo", logoBlob, formData.logoName);
        }

        Object.entries(formData).forEach(([key, value]) => {
          if (["categories", "skills", "links"].includes(key)) payload.append(key, JSON.stringify(value));
          else payload.append(key, value ?? "");
        });

        const response = await api.put(`/candidateProfile/candidate/${formData.account_id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 || response.status === 201) {
          toast.success("Profile updated successfully!");
        }
      } catch (error) {
        console.error(error);
        toast.error("Profile update failed!");
      }
    } else {
      const firstError = Object.keys(validationErrors)[0];
      if (this[`${firstError}Ref`] && this[`${firstError}Ref`].current) {
        this[`${firstError}Ref`].current.focus();
      }
    }
  };

  render() {
    const { formData, errors, logoImg } = this.state;
    const inputStyles = {
      height: "3.5rem",
      width: "100%",
      padding: "15px 20px",
      fontSize: "15px",
      color: "#696969",
      backgroundColor: "#f0f5f7",
      border: "1px solid #f0f5f7",
      borderRadius: "8px",
    };

    return (
      <form onSubmit={this.handleSubmit} className="default-form">
        <div className="row">
          {/* Logo Upload */}
          <div className="uploading-outer mb-4">
            <input
              type="file"
              id="upload"
              accept=".jpg,.jpeg,.png"
              className="form-control"
              style={inputStyles}
              onChange={(e) => this.logoHandler(e.target.files[0])}
            />
            <span>{formData.logoName}</span>
            <div style={{ marginTop: "10px" }}>
              {logoImg ? (
                <img
                  src={logoImg}
                  alt="Logo"
                  style={{ maxHeight: "100px", borderRadius: "50px" }}
                />
              ) : (
                <img
                  src="/images/index-11/header/Noimage.png"
                  alt="No Logo"
                  style={{ maxHeight: "100px", borderRadius: "50px" }}
                />
              )}
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Jerome"
              value={formData.fullName}
              onChange={this.handleInputChange}
              ref={this.fullNameRef}
            />
            {errors.fullName && <span className="text-danger">{errors.fullName}</span>}
          </div>

          {/* Phone */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={this.handleInputChange}
              ref={this.phoneRef}
            />
            {errors.phone && <span className="text-danger">{errors.phone}</span>}
          </div>

          {/* Email */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={this.handleInputChange}
              ref={this.emailRef}
            />
            {errors.email && <span className="text-danger">{errors.email}</span>}
          </div>

          {/* Current Salary */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Current Salary</label>
            <select
              name="currentSalary"
              value={formData.currentSalary}
              onChange={this.handleInputChange}
              ref={this.currentSalaryRef}
            >
              <option>40-70 K</option>
              <option>50-80 K</option>
              <option>60-90 K</option>
              <option>70-100 K</option>
              <option>100-150 K</option>
            </select>
            {errors.currentSalary && <span className="text-danger">{errors.currentSalary}</span>}
          </div>

          {/* Expected Salary */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Expected Salary</label>
            <select
              name="expectedSalary"
              value={formData.expectedSalary}
              onChange={this.handleInputChange}
              ref={this.expectedSalaryRef}
            >
              <option>120-350 K</option>
              <option>40-70 K</option>
              <option>50-80 K</option>
              <option>60-90 K</option>
              <option>70-100 K</option>
              <option>100-150 K</option>
            </select>
            {errors.expectedSalary && <span className="text-danger">{errors.expectedSalary}</span>}
          </div>

          {/* Experience */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Experience</label>
            <input
              type="text"
              name="experience"
              value={formData.experience}
              onChange={this.handleInputChange}
              ref={this.experienceRef}
            />
            {errors.experience && <span className="text-danger">{errors.experience}</span>}
          </div>

          {/* Age */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Age</label>
            <select
              name="age"
              value={formData.age}
              onChange={this.handleInputChange}
              ref={this.ageRef}
            >
              <option>23 - 27 Years</option>
              <option>24 - 28 Years</option>
              <option>25 - 29 Years</option>
              <option>26 - 30 Years</option>
            </select>
            {errors.age && <span className="text-danger">{errors.age}</span>}
          </div>

          {/* Education */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Education</label>
            <input
              type="text"
              name="education"
              placeholder="Certificate"
              value={formData.education}
              onChange={this.handleInputChange}
              ref={this.educationRef}
            />
            {errors.education && <span className="text-danger">{errors.education}</span>}
          </div>

          {/* Categories */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Categories</label>
            <Select
              value={formData.categories.map((c) => this.catOptions.find((o) => o.value === c))}
              isMulti
              options={this.catOptions}
              onChange={this.handleCategoryChange}
              ref={this.categoriesRef}
            />
            {errors.categories && <span className="text-danger">{errors.categories}</span>}
          </div>

          {/* Skills */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Skills</label>
            <Select
              value={formData.skills.map((s) => this.skillsOptions.find((o) => o.value === s))}
              isMulti
              options={this.skillsOptions}
              onChange={this.handleSkillChange}
              ref={this.skillsRef}
            />
            {errors.skills && <span className="text-danger">{errors.skills}</span>}
          </div>

          {/* City */}
          <div className="form-group col-lg-6 col-md-12">
            <label>City</label>
            <select
              name="city"
              value={formData.city}
              onChange={this.handleInputChange}
              ref={this.cityRef}
            >
              <option>Melbourne</option>
              <option>Pakistan</option>
              <option>China</option>
              <option>Japan</option>
              <option>India</option>
            </select>
            {errors.city && <span className="text-danger">{errors.city}</span>}
          </div>

          {/* Address */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Complete Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={this.handleInputChange}
              ref={this.addressRef}
            />
            {errors.address && <span className="text-danger">{errors.address}</span>}
          </div>

          {/* Links */}
          <div className="col-lg-12 mb-3">
            <div className="d-flex justify-content-between mb-2">
              <label>Links</label>
              <button
                type="button"
                onClick={() =>
                  this.setState((prev) => ({
                    formData: { ...prev.formData, links: [...prev.formData.links, ""] },
                  }))
                }
              >
                Add Link
              </button>
            </div>

            {formData.links.map((link, idx) => (
              <div key={idx} className="input-group mb-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...formData.links];
                    newLinks[idx] = e.target.value;
                    this.setState((prev) => ({ formData: { ...prev.formData, links: newLinks } }));

                    if (!e.target.value.startsWith("http")) {
                      this.setState((prev) => ({ errors: { ...prev.errors, links: "Links must start with http://" } }));
                    } else {
                      this.setState((prev) => {
                        const { links, ...rest } = prev.errors;
                        return { errors: rest };
                      });
                    }
                  }}
                  ref={this.LinksRef}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newLinks = formData.links.filter((_, i) => i !== idx);
                    this.setState((prev) => ({ formData: { ...prev.formData, links: newLinks } }));
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            {errors.links && <span className="text-danger">{errors.links}</span>}
          </div>

          {/* Description */}
          <div className="form-group col-lg-12 col-md-12">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={this.handleInputChange}
            ></textarea>
          </div>

          {/* Submit */}
          <div className="form-group col-lg-6 col-md-12">
            <button type="submit" className="theme-btn btn-style-one">
              Submit
            </button>
          </div>
        </div>
      </form>
    );
  }
}

export default CandidateRegisterForm;
