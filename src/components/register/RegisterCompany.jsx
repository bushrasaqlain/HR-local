"use client"
import Select from "react-select";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setLogoUsername } from "../../redux/features/user/userSlice.js";
import api from "../lib/api.jsx";
import { toast } from "react-toastify";
import AsyncSelect from "react-select/async";
import { useRouter } from "next/navigation";

// import LogoUpload from "./LogoUpload";
const RegisterCompanyform = ({ isRegister, userId }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company_name: "",
    phone: "",
    company_address: "",
    company_website: "",
    NTN: "",
    size_of_company: "",
    established_date: "",
  });
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBusinessEntityType, setSelectedBusinessEntityType] = useState(null);
  const [originalData, setOriginalData] = useState(null);


  const dispatch = useDispatch();

  const [errors, SetErrors] = useState({});

  const [logoImg, setLogoImg] = useState("");
  const [isNewImageUploaded, setIsNewImageUploaded] = useState(false);
  // const [imgName, setImgName] = useState("");
  // const [image, setImage] = useState("");

  // const [logoImg, setLogoImg] = useState("");

  const logoHandler = (file) => {
    SetErrors((prev) => ({ ...prev, logo: "" }));
    if (file) {
      setIsNewImageUploaded(true);
      setFormData((prev) => ({
        ...prev,
        logoFile: file,   // raw file
        logoName: file.name,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImg(reader.result);
        setFormData((prev) => ({ ...prev, logo: reader.result })); // ✅ store preview in formData.logo
      };
      reader.readAsDataURL(file);
    } else {
      setIsNewImageUploaded(false);
      setFormData((prev) => ({ ...prev, logoFile: null, logoName: "", logo: "" })); // ✅ clear
      setLogoImg("");
    }
  };

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // ------------------ Loaders for AsyncSelect ------------------ //
  const loadCountries = async (inputValue) => {
    try {
      const res = await axios.get(`${apiBaseUrl}getallCountries`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.countries.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error("Error loading countries:", error);
      return [];
    }
  };

  const loadDistricts = async (inputValue) => {
    if (!selectedCountry?.value) return [];
    try {
      const res = await axios.get(`${apiBaseUrl}getalldistricts`, {
        params: {
          country_id: selectedCountry.value,
          search: inputValue || "",
          page: 1,
          limit: 15,
        },
      });
      return res.data.districts.map((d) => ({
        label: d.name,
        value: d.id,
      }));
    } catch (error) {
      console.error("Error loading districts:", error);
      return [];
    }
  };

  useEffect(() => {
    loadDistricts();
  }, [selectedCountry]);

  useEffect(() => {
    fetchCities();
  }, [selectedDistrict]);

  // ------------------ Fetch Cities ------------------ //
  const fetchCities = async (inputValue) => {
    if (!selectedDistrict?.value) return [];
    try {
      const res = await axios.get(
        `${apiBaseUrl}getCitiesByDistrict/${selectedDistrict.value}`,
        { params: { search: inputValue || "" } }
      );
      return res.data.cities.map((city) => ({
        label: city.name,
        value: city.id,
      }));
    } catch (error) {
      console.error("Error fetching cities by district:", error);
      return [];
    }
  };
  const loadBusinessType = async (inputValue) => {
    try {
      const res = await axios.get(`${apiBaseUrl}getallbusinesstypes`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.business_types.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error("Error loading business types:", error);
      return [];
    }
  };

  useEffect(() => {
    loadCountries();
  }, [selectedCountry]);


  useEffect(() => {
    fetchCities();
  }, [selectedDistrict]);

  // if(isNewImageUploaded) {
  //   setLogoUsername({})
  // }

  const companyNameRef = React.createRef();
  const businessEntityTypeRef = React.createRef();
  const phoneRef = React.createRef();
  const logoRef = React.createRef();
  const industryRef = React.createRef();
  const countryRef = React.createRef();
  const districtRef = React.createRef();
  const cityRef = React.createRef();
  const companyAddressRef = React.createRef();
  const companyWebsiteRef = React.createRef();
  const NTNRef = React.createRef();
  const sizeOfCompanyRef = React.createRef();
  const establishedDateRef = React.createRef();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    let error = "";

    // 🔎 Field-specific validations
    if (name === "company_name") {
      if (!value.trim()) {
        error = "Company name is required.";
      } else if (!isValidName(value)) {
        error = "Company name must be under 30 characters and letters only.";
      }
    } else if (name === "phone") {
      if (!value.trim()) {
        error = "Phone number is required.";
      } else if (!isValidPhoneNumber(value)) {
        error = "Invalid phone number.";
      }
    } else if (name === "NTN") {
      if (!value.trim()) {
        error = "NTN is required.";
      } else if (!isValidNTN(value)) {
        error = "Invalid NTN.";
      }
    } else if (name === "company_address") {
      if (!value.trim()) {
        error = "Company address is required.";
      } else if (!isValidAddress(value)) {
        error = "Invalid company address.";
      }
    } else if (name === "size_of_company") {
      if (!value.trim()) {
        error = "Size of company is required.";
      } else if (!/^\d+$/.test(value)) {
        error = "Size of company must be a number.";
      }
    } else if (name === "company_website") {
      if (!value.trim()) {
        error = "Company website URL is required.";
      } else {
        const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;
        if (!urlPattern.test(value)) {
          error = "Please enter a valid website URL.";
        }
      }
    } else if (name === "established_date") {
      if (!value.trim()) {
        error = "Date of Establishment is required.";
      } else {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(value)) {
          error = "Please enter a valid date (YYYY-MM-DD).";
        }
      }
    }

    // 🟢 Update form data
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // 🟢 Update errors (real-time)
    SetErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };


  const isValidName = (companyName) => {
    return /^[A-Za-z\s]{1,30}$/.test(companyName);
  }

  const isValidPhoneNumber = (phoneNumber) => {
    // Implement your phone number validation logic here
    return /^\d{11}$/.test(phoneNumber);
  };

  const isValidNTN = (ntn) => {
    // Implement your NTN validation logic here
    return /^\d{7}$/.test(ntn);
  };

  const isValidAddress = (address) => {
    return address.trim().length >= 10 && address.trim().length <= 255;
  };

  useEffect(() => {
    const fetchUserData = async () => {

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
          setLogoImg(imageDataUrl);

          const normalizedData = {
            ...userData,
            logo: imageDataUrl,   // ✅ keep reference in formData
            country: userData.country_id,
            district: userData.district_id,
            city: userData.city_id,
            Business_entity_type: userData.Business_entity_type_id,
          };

          setFormData(normalizedData);
          setOriginalData(normalizedData);
          setSelectedBusinessEntityType({ label: userData.business_type_name, value: userData.Business_entity_type_id });
          setSelectedCountry({ label: userData.country_name, value: userData.country_id });
          setSelectedDistrict({ label: userData.district_name, value: userData.district_id });
          setSelectedCity({ label: userData.city_name, value: userData.city_id });
        } else {
          console.warn("User data object is empty for userId:", userId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    if (!isRegister) {
      fetchUserData();

    }
  }, [])
  const handleSubmit = async (event) => {
    event.preventDefault();

    // 🔎 Check for changes
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
      return; // stop submission
    }


    
    const validationErrors = {};
    // Basic validations
    if (!formData.logo) {
      validationErrors.logo = "Logo is required.";
    }

    if (!formData.company_name?.trim()) {
      validationErrors.company_name = "Company name is required.";
    } else if (!isValidName(formData.company_name)) {
      validationErrors.company_name =
        "Company name must be under 30 characters and letters only.";
    }

    if (!formData.phone?.trim()) {
      validationErrors.phone = "Phone number is required.";
    } else if (!isValidPhoneNumber(formData.phone)) {
      validationErrors.phone = "Invalid phone number.";
    }

    if (!selectedCountry?.value) {
      validationErrors.country = "Country is required.";
    }
    if (!selectedBusinessEntityType?.value) {
      validationErrors.Business_entity_type = "Select select your business type.";
    }

    if (!selectedDistrict?.value) {
      validationErrors.district = "District is required.";
    }

    if (!selectedCity?.value) {
      validationErrors.city = "City is required.";
    }

    if (!formData.NTN) {
      validationErrors.NTN = "NTN is required.";
    } else if (!isValidNTN(formData.NTN)) {
      validationErrors.NTN = "Invalid NTN.";
    }


    if (!formData.company_address?.trim()) {
      validationErrors.company_address = "Company address is required.";
    } else if (!isValidAddress(formData.company_address)) {
      validationErrors.company_address = "Invalid company address.";
    }

    if (!formData.size_of_company) {
      validationErrors.size_of_company = "Size of company is required.";
    } else if (!/^\d+$/.test(formData.size_of_company)) {
      validationErrors.size_of_company = "Size of company must be a number.";
    }

    if (!formData.company_website?.trim()) {
      validationErrors.company_website = "Company website URL is required.";
    } else {
      const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/;
      if (!urlPattern.test(formData.company_website)) {
        validationErrors.company_website = "Please enter a valid website URL.";
      }
    }

    if (!formData.established_date?.trim()) {
      validationErrors.established_date = "Date of Establishment is required.";
    } else {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(formData.established_date)) {
        validationErrors.established_date =
          "Please enter a valid date (YYYY-MM-DD).";
      }
    }
    // *****************
    SetErrors(validationErrors); //updating the state


    if (Object.keys(validationErrors).length === 0) {
      try {
        const formDataToSend = new FormData();

        if (isNewImageUploaded && formData.logoFile) {
          // If user uploaded a new one → send raw file
          formDataToSend.append("logo", formData.logoFile);
        } else {
          // Otherwise → send the existing logo reference (string/base64)
          formDataToSend.append("logo", formData.logo || "");
        }

        formDataToSend.append("company_name", formData.company_name);
        formDataToSend.append("Business_entity_type", selectedBusinessEntityType.value);
        formDataToSend.append("phone", formData.phone);
        formDataToSend.append("country", selectedCountry.value);
        formDataToSend.append("district", selectedDistrict.value);
        formDataToSend.append("city", selectedCity.value);
        formDataToSend.append("company_address", formData.company_address);
        formDataToSend.append("company_website", formData.company_website);
        formDataToSend.append("NTN", formData.NTN);
        formDataToSend.append("size_of_company", formData.size_of_company);
        formDataToSend.append("established_date", formData.established_date);

        let response = null;
        if (isRegister) {
          if (userId) {
            formDataToSend.append("userId", userId);
          }
          response = await axios.put(`http://localhost:8080/company-info/employer`,
            formDataToSend,
            { headers: { "Content-Type": "multipart/form-data" } }

          );

        } else {
          // Perform the form submission
          response = await api.put(
            `http://localhost:8080/company-info/employer`,
            formDataToSend,
            // alert("form submitted")
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        }

        // Check if the submission was successful
        if (response.status === 200) {
          // Set success message
          if (isRegister) {

            toast.success("Profile created successfully.");
            toast.info("Please wait for admin approval to post jobs.")
            setTimeout(() => {
              router.push("/login");
            }, 1500);
          } else {
            toast.success("Profile Updated Successfully!");
          }
          // dispatch(setLogoUsername())
        }
      } catch (error) {
        console.error(error);
        toast.success("Profile Updation failed. Please try again.");
      }
    } else {
      // Focus on the first field with an error
      if (validationErrors.company_name) {
        companyNameRef.current.focus();
      } else if (validationErrors.Business_entity_type) {
        businessEntityTypeRef.current.focus();
      } else if (validationErrors.phone) {
        phoneRef.current.focus();
      } else if (validationErrors.logo) {
        logoRef.current.focus();
      } else if (validationErrors.country) {
        countryRef.current.focus();
      } else if (validationErrors.district) {
        districtRef.current.focus();
      } else if (validationErrors.city) {
        cityRef.current.focus();
      } else if (validationErrors.company_address) {
        companyAddressRef.current.focus();
      } else if (validationErrors.company_website) {
        companyWebsiteRef.current.focus();
      } else if (validationErrors.NTN) {
        NTNRef.current.focus();
      }
      else if (validationErrors.size_of_company) {
        sizeOfCompanyRef.current.focus();
      } else if (validationErrors.established_date) {
        establishedDateRef.current.focus();
      }
    }
  };

 

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
    <form action="#" className="default-form" onSubmit={handleSubmit}>
      <div className="row">
        <label><b>Logo:</b><span className="text-danger"> *</span></label>

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
              onChange={(e) => logoHandler(e.target.files[0])}
              ref={logoRef}
            />
            {/* <label className="uploadButton-button ripple-effect" htmlFor="upload">
            Browse Logo
          </label> */}
          </div>

          {/* <div className="text">
          Max file size is 1MB, Minimum dimension: 330x300 And Suitable
          files are .jpg & .png
        </div> */}

          {""}

          {/* {formData.logoName && (
          <div className="logo-name">
            Logo Name: {formData.logoName}
          </div>
        )} */}
          <div style={{ marginLeft: '130px' }}> {/* Adjust margin-top as needed */}
            <strong className="ml-4">Current Logo: </strong>{" "}
            {logoImg ? (
              <img
                src={logoImg}
                alt="Selected Logo"
                style={{ maxWidth: "100%", maxHeight: "100px", borderRadius: "50px" }}
              />
            ) : (
              <img
                src="/images/index-11/header/Noimage.png"
                alt="No Logo"
                style={{ maxWidth: "100%", maxHeight: "100px", borderRadius: "50px" }}
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
          <label>Company Name<span className="text-danger"> *</span></label>
          <input
            type="text"
            name="company_name"
            placeholder="Microsoft Inc"
            onChange={handleInputChange}
            value={formData.company_name ?? ""}
            ref={companyNameRef}
          />
          {errors.company_name && (
            <span style={{ color: "red" }}>{errors.company_name}</span>
          )}
        </div>
        <div className="form-group col-lg-6 col-md-12">

          <label>Business Entity Type<span className="text-danger"> *</span></label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadBusinessType}
            value={selectedBusinessEntityType ?? ""}
            onChange={(option) => {
              setSelectedBusinessEntityType(option);
              SetErrors((prev) => ({ ...prev, Business_entity_type: "" }));
            }}
            placeholder="Select Business Entity type"
            ref={businessEntityTypeRef}
            className="Modal-input"
          />
          {errors.Business_entity_type && <span style={{ color: "red" }}>{errors.Business_entity_type}</span>}
        </div>

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Office Phone<span className="text-danger"> *</span></label>
          <input
            type="text"
            name="phone"
            placeholder="0 123 456 7890"
            onChange={handleInputChange}
            ref={phoneRef}
            value={formData.phone ?? ""}
          />
          {errors.phone && <span style={{ color: "red" }}>{errors.phone}</span>}
        </div>
        <div className="form-group col-lg-6 col-md-12">

          <label>Country<span className="text-danger"> *</span></label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadCountries}
            value={selectedCountry ?? ""}
            onChange={(option) => {
              setSelectedCountry(option);
              setSelectedDistrict(null); // reset district
              SetErrors((prev) => ({ ...prev, country: "" }));
            }}
            placeholder="Select Country"
            className="Modal-input"
            ref={countryRef}
          />
          {errors.country && <span style={{ color: "red" }}>{errors.country}</span>}
        </div>
        <div className="form-group col-lg-6 col-md-12">

          <label>District<span className="text-danger"> *</span></label>
          <AsyncSelect
            key={selectedCountry?.value} // re-render when country changes
            cacheOptions
            defaultOptions
            loadOptions={loadDistricts}
            value={selectedDistrict ?? ""}
            onChange={(option) => { setSelectedDistrict(option); SetErrors((prev) => ({ ...prev, district: "" })); }}
            placeholder="Select District"
            isDisabled={!selectedCountry}
            className="Modal-input"
            ref={districtRef}
          />
          {errors.district && <span style={{ color: "red" }}>{errors.district}</span>}
        </div>
        <div className="form-group col-lg-6 col-md-12">

          <label>City<span className="text-danger"> *</span></label>
          <AsyncSelect
            key={selectedDistrict?.value} // re-render when district changes
            cacheOptions
            defaultOptions
            loadOptions={fetchCities}
            value={selectedCity ?? ""}
            onChange={(option) => { setSelectedCity(option); SetErrors((prev) => ({ ...prev, city: "" })) }}
            placeholder="Select City"
            isDisabled={!selectedDistrict}
            className="Modal-input"
            ref={cityRef}
          />
          {errors.city && <span style={{ color: "red" }}>{errors.city}</span>}
        </div>
        {/* <!-- Input --> */}

        <div className="form-group col-lg-6 col-md-12">
          <label>Company Website<span className="text-danger"> *</span></label>
          <input
            type="text"
            name="company_website"
            placeholder="www.microsoft.com"
            onChange={handleInputChange}
            ref={companyWebsiteRef}
            value={formData.company_website ?? ""}
          />
          {errors.company_website && (
            <span style={{ color: "red" }}>{errors.company_website}</span>
          )}
        </div>

        <div className="form-group col-lg-6 col-md-12">
          <label>NTN<span className="text-danger"> *</span></label>
          <input
            type="text"
            name="NTN"
            placeholder="1234567"
            onChange={handleInputChange}
            ref={NTNRef}
            value={formData.NTN ?? ""}
          />
          {errors.NTN && <span style={{ color: "red" }}>{errors.NTN}</span>}
        </div>
        <div className="form-group col-lg-6 col-md-12">
          <label>Size of Company<span className="text-danger"> *</span></label>
          <input
            type="number"
            name="size_of_company"
            placeholder="100"
            onChange={handleInputChange}
            ref={sizeOfCompanyRef}
            value={formData.size_of_company ?? ""}
          />
          {errors.size_of_company && (
            <span style={{ color: "red" }}>{errors.size_of_company}</span>
          )}
        </div>
        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Date of Establishment<span className="text-danger"> *</span></label>
          <input
            type="date"
            name="established_date"
            placeholder="2004/05/23"
            onChange={handleInputChange}
            value={formData.established_date ?? ""}
            ref={establishedDateRef}
            max={new Date().toISOString().split("T")[0]}
          />
          {errors.established_date && (
            <span style={{ color: "red" }}>{errors.established_date}</span>
          )}
        </div>

        <div className="form-group col-lg-12 col-md-12">
          <label>Company Address<span className="text-danger"> *</span></label>
          <textarea
            rows="4"
            cols="50"
            type="text"
            name="company_address"
            placeholder="329 Queensberry Street, North Melbourne VIC 3051, Australia."
            onChange={handleInputChange}
            ref={companyAddressRef}
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
};

export default RegisterCompanyform;