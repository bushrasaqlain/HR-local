"use client";

import React, { Component } from "react";
import AsyncSelect from "react-select/async";
import axios from "axios";
import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import { useRouter } from "next/navigation";

class RegisterCompanyform extends Component {
  constructor(props) {
    super(props);

    this.state = {
      formData: {
        company_name: "",
        phone: "",
        company_address: "",
        company_website: "",
        NTN: "",
        size_of_company: "",
        established_date: "",
        logo: "",
        logoFile: null,
        logoName: "",
      },
      logoImg: "",
      isNewImageUploaded: false,
      errors: {},
      selectedCountry: null,
      selectedDistrict: null,
      selectedCity: null,
      selectedBusinessEntityType: null,
      originalData: null,
    };

    // Refs
    this.companyNameRef = React.createRef();
    this.businessEntityTypeRef = React.createRef();
    this.phoneRef = React.createRef();
    this.logoRef = React.createRef();
    this.countryRef = React.createRef();
    this.districtRef = React.createRef();
    this.cityRef = React.createRef();
    this.companyAddressRef = React.createRef();
    this.companyWebsiteRef = React.createRef();
    this.NTNRef = React.createRef();
    this.sizeOfCompanyRef = React.createRef();
    this.establishedDateRef = React.createRef();

    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  componentDidMount() {
    if (!this.props.isRegister) {
      this.fetchUserData();
    }
  }

  // ---------------------- Handlers ---------------------- //

  handleInputChange = (event) => {
    const { name, value } = event.target;
    let error = "";

    if (name === "company_name") {
      if (!value.trim()) error = "Company name is required.";
      else if (!/^[A-Za-z\s]{1,30}$/.test(value))
        error = "Company name must be under 30 characters and letters only.";
    } else if (name === "phone") {
      if (!value.trim()) error = "Phone number is required.";
      else if (!/^\d{11}$/.test(value)) error = "Invalid phone number.";
    } else if (name === "NTN") {
      if (!value.trim()) error = "NTN is required.";
      else if (!/^\d{7}$/.test(value)) error = "Invalid NTN.";
    } else if (name === "company_address") {
      if (!value.trim()) error = "Company address is required.";
      else if (value.trim().length < 10 || value.trim().length > 255)
        error = "Invalid company address.";
    } else if (name === "size_of_company") {
      if (!value.trim()) error = "Size of company is required.";
      else if (!/^\d+$/.test(value))
        error = "Size of company must be a number.";
    } else if (name === "company_website") {
      if (!value.trim()) error = "Company website URL is required.";
      else {
        const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;
        if (!urlPattern.test(value))
          error = "Please enter a valid website URL.";
      }
    } else if (name === "established_date") {
      if (!value.trim()) error = "Date of Establishment is required.";
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        error = "Please enter a valid date (YYYY-MM-DD).";
    }

    this.setState((prev) => ({
      formData: { ...prev.formData, [name]: value },
      errors: { ...prev.errors, [name]: error },
    }));
  };

  logoHandler = (file) => {
    this.setState((prev) => ({
      errors: { ...prev.errors, logo: "" },
    }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.setState((prev) => ({
          formData: {
            ...prev.formData,
            logoFile: file,
            logoName: file.name,
            logo: reader.result, 
          },
          logoImg: reader.result,
          isNewImageUploaded: true,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      this.setState((prev) => ({
        formData: { ...prev.formData, logoFile: null, logoName: "", logo: "" },
        logoImg: "",
        isNewImageUploaded: false,
      }));
    }
  };

  // ---------------------- Async Select Loaders ---------------------- //
  loadCountries = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallCountries`, {
        params: {
          name: "name",
          search: inputValue || "",
          status: "all", // ✅ REQUIRED
          page: 1,
          limit: 15,
        },
      });

      return (res.data.countries || []).map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error("AsyncSelect countries error:", error);
      return [];
    }
  };

  loadDistricts = async (inputValue) => {
    const { selectedCountry } = this.state;
    console.log("Country ID:", selectedCountry?.value);

    if (!selectedCountry?.value) return [];

    try {
      const res = await axios.get(`${this.apiBaseUrl}getalldistricts`, {
        params: {
          name: "name",
          search: inputValue || "",
          status: "all",
          page: 1,
          limit: 15,
          country_id: selectedCountry.value,
        },
      });

      return (res.data.districts || []).map((d) => ({
        label: d.name,
        value: d.id,
      }));
    } catch (error) {
      console.error("Error loading districts:", error);
      return [];
    }
  };

  fetchCities = async (inputValue) => {
    const { selectedDistrict } = this.state;
    if (!selectedDistrict?.value) return [];
    try {
      const res = await axios.get(
        `${this.apiBaseUrl}getCitiesByDistrict/${selectedDistrict.value}`,
        { params: { search: inputValue || "" } }
      );
      return (res.data.cities || []).map((city) => ({
        label: city.name,
        value: city.id,
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  loadBusinessType = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallbusinesstypes`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.business_types.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  fetchUserData = async () => {
    try {
      const response = await api.get(
        `http://localhost:8080/company-info/employer`
      );
      const userData = response.data;
      if (userData && Object.keys(userData).length > 0) {
        let imageDataUrl = userData.logo;
        if (userData.logo && !userData.logo.startsWith("data:")) {
          imageDataUrl = `data:image/png;base64,${userData.logo}`;
        }

        this.setState({
          logoImg: imageDataUrl,
          formData: {
            ...userData,
            logo: imageDataUrl,
          },
          originalData: {
            ...userData,
            logo: imageDataUrl,
          },
          selectedBusinessEntityType: {
            label: userData.business_type_name,
            value: userData.Business_entity_type_id,
          },
          selectedCountry: {
            label: userData.country_name,
            value: userData.country_id,
          },
          selectedDistrict: {
            label: userData.district_name,
            value: userData.district_id,
          },
          selectedCity: { label: userData.city_name, value: userData.city_id },
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // ---------------------- Form Submit ---------------------- //
  handleSubmit = async (event) => {
    event.preventDefault();

    const {
      formData,
      originalData,
      selectedCountry,
      selectedDistrict,
      selectedCity,
      selectedBusinessEntityType,
    } = this.state;

    // Check for changes
    const hasChanges =
      JSON.stringify({
        ...formData,
        country: selectedCountry?.value || "",
        district: selectedDistrict?.value || "",
        city: selectedCity?.value || "",
        Business_entity_type: selectedBusinessEntityType?.value || "",
      }) !== JSON.stringify(originalData);

    if (!hasChanges) {
      toast.error("Make some changes to update the profile.");
      return;
    }

    // Basic validation
    const validationErrors = {};
    if (!formData.logo) validationErrors.logo = "Logo is required.";
    if (!formData.company_name?.trim())
      validationErrors.company_name = "Company name is required.";
    if (!/^[A-Za-z\s]{1,30}$/.test(formData.company_name))
      validationErrors.company_name =
        "Company name must be under 30 characters and letters only.";
    if (!formData.phone?.trim())
      validationErrors.phone = "Phone number is required.";
    if (!/^\d{11}$/.test(formData.phone))
      validationErrors.phone = "Invalid phone number.";
    if (!selectedCountry?.value)
      validationErrors.country = "Country is required.";
    if (!selectedBusinessEntityType?.value)
      validationErrors.Business_entity_type = "Select your business type.";
    if (!selectedDistrict?.value)
      validationErrors.district = "District is required.";
    if (!selectedCity?.value) validationErrors.city = "City is required.";
    if (!formData.NTN?.trim()) validationErrors.NTN = "NTN is required.";
    if (!/^\d{7}$/.test(formData.NTN)) validationErrors.NTN = "Invalid NTN.";
    if (!formData.company_address?.trim())
      validationErrors.company_address = "Company address is required.";
    if (
      formData.company_address?.trim().length < 10 ||
      formData.company_address?.trim().length > 255
    )
      validationErrors.company_address = "Invalid company address.";
    if (!formData.size_of_company)
      validationErrors.size_of_company = "Size of company is required.";
    if (!/^\d+$/.test(formData.size_of_company))
      validationErrors.size_of_company = "Size of company must be a number.";
    if (!formData.company_website?.trim())
      validationErrors.company_website = "Company website URL is required.";
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;
    if (!urlPattern.test(formData.company_website))
      validationErrors.company_website = "Please enter a valid website URL.";
    if (!formData.established_date?.trim())
      validationErrors.established_date = "Date of Establishment is required.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.established_date))
      validationErrors.established_date =
        "Please enter a valid date (YYYY-MM-DD).";

    this.setState({ errors: validationErrors });

    if (Object.keys(validationErrors).length > 0) return;

    // Prepare FormData
    const formDataToSend = new FormData();
    if (this.state.isNewImageUploaded && formData.logoFile) {
      formDataToSend.append("logo", formData.logoFile);
    } else {
      formDataToSend.append("logo", formData.logo || "");
    }

    formDataToSend.append("company_name", formData.company_name);
    formDataToSend.append(
      "Business_entity_type",
      selectedBusinessEntityType.value
    );
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("country", selectedCountry.value);
    formDataToSend.append("district", selectedDistrict.value);
    formDataToSend.append("city", selectedCity.value);
    formDataToSend.append("company_address", formData.company_address);
    formDataToSend.append("company_website", formData.company_website);
    formDataToSend.append("NTN", formData.NTN);
    formDataToSend.append("size_of_company", formData.size_of_company);
    formDataToSend.append("established_date", formData.established_date);

    try {
      let response;
      if (this.props.isRegister) {
        if (this.props.userId)
          formDataToSend.append("userId", this.props.userId);
        response = await axios.put(
          "http://localhost:8080/company-info/employer",
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        response = await api.put(
          "http://localhost:8080/company-info/employer",
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      if (response.status === 200) {
        if (this.props.isRegister) {
          toast.success("Profile created successfully.");
          toast.info("Please wait for admin approval to post jobs.");
          setTimeout(() => this.props.router.push("/login"), 1500);
        } else {
          toast.success("Profile Updated Successfully!");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Profile Updation failed. Please try again.");
    }
  };

  // ---------------------- Render ---------------------- //
  render() {
    const {
      formData,
      errors,
      logoImg,
      selectedCountry,
      selectedDistrict,
      selectedCity,
      selectedBusinessEntityType,
    } = this.state;

    const inputStyles = {
      height: "3.5rem",
      position: "relative",
      width: "100%",
      display: "block",
      lineHeight: "30px",
      padding: "15px 20px",
      fontSize: "15px",
      color: "#696969",
      backgroundColor: "#f0f5f7",
      border: "1px solid #f0f5f7",
      WebkitBoxSizing: "border",
      boxSizing: "border-box",
      borderRadius: "8px",
    };

    return (
      <form
        action="#"
        className="default-form"
        onSubmit={this.handleSubmit} // <- use "this."
      >
        <div className="row p-4">
          <label>
            <b>Logo:</b>
            <span className="text-danger"> *</span>
          </label>

          <div className="uploading-outer">
            <div className="uploadButton d-flex flex-column mt-4">
              <input
                className="form-control"
                style={inputStyles}
                type="file"
                name="logo"
                id="upload"
                multiple={false}
                accept=".jpg,.jpeg,.png"
                onChange={(e) => this.logoHandler(e.target.files[0])}
                ref={this.logoRef}
              />
            </div>
            {""}
            <div style={{ marginLeft: "130px" }}>
              {" "}
              {/* Adjust margin-top as needed */}
              <strong className="ml-4">Current Logo: </strong>{" "}
              {logoImg ? (
                <img
                  src={logoImg}
                  alt="Selected Logo"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100px",
                    borderRadius: "50px",
                  }}
                />
              ) : (
                <img
                  src="/images/index-11/header/Noimage.png"
                  alt="No Logo"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100px",
                    borderRadius: "50px",
                  }}
                />
              )}
            </div>
            <div className="ms-3">
              {errors.logo && (
                <span style={{ color: "red" }}>{errors.logo}</span>
              )}
            </div>
          </div>

          {/* <!-- Input --> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>
              Company Name<span className="text-danger"> *</span>
            </label>
            <input
              type="text"
              name="company_name"
              placeholder="Microsoft Inc"
              onChange={this.handleInputChange}
              value={formData.company_name ?? ""}
              ref={this.companyNameRef}
            />
            {errors.company_name && (
              <span style={{ color: "red" }}>{errors.company_name}</span>
            )}
          </div>
          <div className="form-group col-lg-6 col-md-12">
            <label>
              Business Entity Type<span className="text-danger"> *</span>
            </label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={this.loadBusinessType}
              value={selectedBusinessEntityType ?? ""}
              onChange={(option) => {
                this.setState({
                  selectedBusinessEntityType: option,
                  errors: {
                    ...this.state.errors,
                    Business_entity_type: "",
                  },
                });
              }}
              placeholder="Select Business Entity type"
              ref={this.businessEntityTypeRef}
              className="Modal-input"
            />
            {errors.Business_entity_type && (
              <span style={{ color: "red" }}>
                {errors.Business_entity_type}
              </span>
            )}
          </div>

          {/* <!-- Input --> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>
              Office Phone<span className="text-danger"> *</span>
            </label>
            <input
              type="text"
              name="phone"
              placeholder="0 123 456 7890"
              onChange={this.handleInputChange}
              ref={this.phoneRef}
              value={formData.phone ?? ""}
            />
            {errors.phone && (
              <span style={{ color: "red" }}>{errors.phone}</span>
            )}
          </div>
          {/* Country */}
          <div className="form-group col-lg-6 col-md-12">
            <label>
              Country<span className="text-danger"> *</span>
            </label>
            <AsyncSelect
              cacheOptions
              defaultOptions={true} // auto-load initial options
              loadOptions={this.loadCountries}
              value={selectedCountry}
              onChange={(option) => {
                this.setState({
                  selectedCountry: option,
                  selectedDistrict: null,
                  selectedCity: null,
                  errors: { ...this.state.errors, country: "" },
                });
              }}
              placeholder="Select Country"
              className="Modal-input"
              ref={this.countryRef}
            />

            {errors.country && (
              <span style={{ color: "red" }}>{errors.country}</span>
            )}
          </div>

          {/* District */}
          <div className="form-group col-lg-6 col-md-12">
            <label>
              District<span className="text-danger"> *</span>
            </label>
            <AsyncSelect
              key={selectedCountry?.value || "no-country"}
              cacheOptions
              defaultOptions
              loadOptions={this.loadDistricts}
              value={selectedDistrict}
              onChange={(option) => {
                this.setState({
                  selectedDistrict: option,
                  selectedCity: null,
                  errors: { ...this.state.errors, district: "" },
                });
              }}
              placeholder="Select District"
              className="Modal-input"
              ref={this.districtRef}
            />

            {errors.district && (
              <span style={{ color: "red" }}>{errors.district}</span>
            )}
          </div>

          {/* City */}
          <div className="form-group col-lg-6 col-md-12">
            <label>
              City<span className="text-danger"> *</span>
            </label>
            <AsyncSelect
              key={selectedDistrict?.value} // re-render when district changes
              cacheOptions
              defaultOptions={true} // auto-load cities
              loadOptions={this.fetchCities}
              value={selectedCity}
              onChange={(option) => {
                this.setState({
                  selectedCity: option,
                  errors: { ...this.state.errors, city: "" },
                });
              }}
              placeholder="Select City"
              isDisabled={!selectedDistrict}
              className="Modal-input"
              ref={this.cityRef}
            />

            {errors.city && <span style={{ color: "red" }}>{errors.city}</span>}
          </div>

          {/* <!-- Input --> */}

          <div className="form-group col-lg-6 col-md-12">
            <label>
              Company Website<span className="text-danger"> *</span>
            </label>
            <input
              type="text"
              name="company_website"
              placeholder="www.microsoft.com"
              onChange={this.handleInputChange}
              ref={this.companyWebsiteRef}
              value={formData.company_website ?? ""}
            />
            {errors.company_website && (
              <span style={{ color: "red" }}>{errors.company_website}</span>
            )}
          </div>

          <div className="form-group col-lg-6 col-md-12">
            <label>
              NTN<span className="text-danger"> *</span>
            </label>
            <input
              type="text"
              name="NTN"
              placeholder="1234567"
              onChange={this.handleInputChange}
              ref={this.NTNRef}
              value={formData.NTN ?? ""}
            />
            {errors.NTN && <span style={{ color: "red" }}>{errors.NTN}</span>}
          </div>
          <div className="form-group col-lg-6 col-md-12">
            <label>
              Size of Company<span className="text-danger"> *</span>
            </label>
            <input
              type="number"
              name="size_of_company"
              placeholder="100"
              onChange={this.handleInputChange}
              ref={this.sizeOfCompanyRef}
              value={formData.size_of_company ?? ""}
            />
            {errors.size_of_company && (
              <span style={{ color: "red" }}>{errors.size_of_company}</span>
            )}
          </div>
          {/* <!-- Input --> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>
              Date of Establishment<span className="text-danger"> *</span>
            </label>
            <input
              type="date"
              name="established_date"
              placeholder="2004/05/23"
              onChange={this.handleInputChange}
              value={formData.established_date ?? ""}
              ref={this.establishedDateRef}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.established_date && (
              <span style={{ color: "red" }}>{errors.established_date}</span>
            )}
          </div>

          <div className="form-group col-lg-12 col-md-12">
            <label>
              Company Address<span className="text-danger"> *</span>
            </label>
            <textarea
              rows="4"
              cols="50"
              type="text"
              name="company_address"
              placeholder="329 Queensberry Street, North Melbourne VIC 3051, Australia."
              onChange={this.handleInputChange}
              ref={this.companyAddressRef}
              value={formData.company_address ?? ""}
            />
            {errors.company_address && (
              <span style={{ color: "red" }}>{errors.company_address}</span>
            )}
          </div>

          <div className="form-group col-lg-12 col-md-12">
            <button type="submit" className="theme-btn btn-style-one">
              Submit
            </button>
          </div>
        </div>
      </form>
    );
  }
}

export default RegisterCompanyform;
