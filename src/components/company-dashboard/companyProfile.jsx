import React, { Component, createRef } from "react";
import axios from "axios";
import { connect } from "react-redux";
import Select from "react-select";
class CompanyProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        company_name: "",
        email: "",
        phone: "",
        NTN: "",
        city: "",
        country: "",
        district: "",
        size_of_company: "",
        business_type: "",
        company_address: "",
        company_website: "",
        established_date: "", logo: "",
      },
      selectedCountry: null,
      selectedDistrict: null,
      selectedCity: null,
      countryOptions: [],
      districtOptions: [],
      cityOptions: [],
      logoImg: "",
      isNewImageUploaded: false,
      successMessage: "",
      errors: {},
    };
    this.formRef = createRef();
    this.successMessageRef = createRef();
  }
  componentDidUpdate(prevProps) {
    if (
      this.props.userId &&
      this.props.userId !== prevProps.userId
    ) {
      this.fetchCompanyProfile();
      this.loadCountries();
    }
  }


  scrollToSuccessMessage = () => {
    if (this.successMessageRef.current) {
      window.scrollTo({
        top: this.successMessageRef.current.offsetTop,
        behavior: "smooth",
      });
    } else if (this.formRef.current) {
      window.scrollTo({
        top: this.formRef.current.offsetTop,
        behavior: "smooth",
      });
    }
  };

  fetchCompanyProfile = async () => {
    const { userId } = this.props;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    try {
      const response = await axios.get(
        `${apiBaseUrl}company-info/getcompanybyid/${userId}`
      );
      const data = response.data;

      const logoData = data.logo ? `data:image/png;base64,${data.logo}` : "";

      this.setState({
        formData: {
          company_name: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          NTN: data.NTN || "",
          city: data.city_name || "",
          country: data.country_name || "",
          district: data.district_name || "",
          size_of_company: data.size_of_company || "",
          business_type: data.business_type_name || "",
          company_address: data.company_address || "",
          company_website: data.company_website || "",
          established_date: data.established_date || "",
          logo: logoData,
        },
        logoImg: logoData,
        selectedCountry: data.country_id
          ? { value: data.country_id, label: data.country_name }
          : null,
        selectedDistrict: data.district_id
          ? { value: data.district_id, label: data.district_name }
          : null,
        selectedCity: data.city_id
          ? { value: data.city_id, label: data.city_name }
          : null,
      }, () => {
        if (this.state.selectedCountry) this.loadDistricts();
        if (this.state.selectedDistrict) this.loadCities();
      });

    } catch (error) {
      console.error(error);
    }
  };
  loadCountries = async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await axios.get(`${apiBaseUrl}getallCountries`, { params: { page: 1, limit: 100 } });
      const options = res.data.countries.map(c => ({ label: c.name, value: c.id }));
      this.setState({ countryOptions: options });
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  };

  loadDistricts = async () => {
    const { selectedCountry } = this.state;
    if (!selectedCountry) return;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await axios.get(`${apiBaseUrl}getalldistricts`, {
        params: { country_id: selectedCountry.value, page: 1, limit: 100 },
      });
      const options = res.data.districts.map(d => ({ label: d.name, value: d.id }));
      this.setState({ districtOptions: options });
    } catch (error) {
      console.error("Error loading districts:", error);
    }
  };

  loadCities = async () => {
    const { selectedDistrict } = this.state;
    if (!selectedDistrict) return;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await axios.get(`${apiBaseUrl}getCitiesByDistrict/${selectedDistrict.value}`, { params: { page: 1, limit: 100 } });
      const options = res.data.cities.map(c => ({ label: c.name, value: c.id }));
      this.setState({ cityOptions: options });
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };


  handleCountryChange = (selectedCountry) => {
    this.setState(prev => ({
      selectedCountry,
      selectedDistrict: null,
      selectedCity: null,
      formData: {
        ...prev.formData,
        country: selectedCountry ? selectedCountry.value : "",
      }
    }), () => {
      if (selectedCountry) this.loadDistricts();
    });
  };

  handleDistrictChange = (selectedDistrict) => {
    this.setState(prev => ({
      selectedDistrict,
      selectedCity: null,
      formData: {
        ...prev.formData,
        district: selectedDistrict ? selectedDistrict.value : "",
      }
    }), () => {
      if (selectedDistrict) this.loadCities();
    });
  };

  handleCityChange = (selectedCity) => {
    this.setState(prev => ({
      selectedCity,
      formData: {
        ...prev.formData,
        city: selectedCity ? selectedCity.value : "",
      }
    }));
  };


  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formData: { ...prevState.formData, [name]: value },
    }));
  };

  logoHandler = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.setState((prevState) => ({
          formData: {
            ...prevState.formData,
            logo: reader.result,
            logoName: file.name,
          },
          logoImg: reader.result,
          isNewImageUploaded: true,
        }));
      };
      reader.readAsDataURL(file);

      const logoInput = document.getElementById("upload");
      if (logoInput) logoInput.value = null;
    } else {
      this.setState({
        formData: { ...this.state.formData, logo: "", logoName: "" },
        logoImg: "",
        isNewImageUploaded: false,
      });
    }
  };

  base64toBlob = (base64Data, contentType = "image/png") => {
    const sliceSize = 512;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { userId } = this.props;
    const { formData, isNewImageUploaded } = this.state;

    const formDataToSend = new FormData();

    if (formData.logo) {
      const base64Data = formData.logo.split(",")[1];
      const logoBlob = this.base64toBlob(base64Data, "image/png");
      formDataToSend.append("logo", logoBlob, formData.logoName || "");
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && key !== "logo") {
        if (key === "company_address") {
          formDataToSend.append("company_address", value);
        } else {
          formDataToSend.append(key, value);
        }
      }
    });

    formDataToSend.append("account_id", userId);

    try {
      const response = await axios.put(
        `http://localhost:8080/companyinfochanges/${userId}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        this.setState({ successMessage: "Company profile updated successfully!" });
      } else {
        this.setState({ successMessage: "Error: Unable to update company profile." });
      }
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    const { formData, logoImg, successMessage, cityOptions, countryOptions, districtOptions } = this.state;
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
      boxSizing: "border-box",
      borderRadius: "8px",
    };

    return (
      <div>
        {successMessage && (
          <div ref={this.successMessageRef}>
            <div className={`alert alert-info`} role="alert">
              {successMessage}
            </div>
          </div>
        )}
        <div className="widget-title d-flex align-items-center mb-3">
          <h4 className="me-3">Company Profile</h4>
        </div>
        <form className="default-form" ref={this.formRef} onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="uploading-outer">
              <div>
                <strong>Current Logo: </strong>
                {logoImg && <img src={logoImg} alt="Selected Logo" style={{ maxWidth: "100%", maxHeight: "100px" }} />}
                <div className="uploadButton">
                  <input
                    className="form-control"
                    style={inputStyles}
                    type="file"
                    id="upload"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => this.logoHandler(e.target.files[0])}
                  />
                </div>
              </div>
            </div>

            <div className="form-group col-lg-4 col-md-12">
              <label>Company Name</label>
              <input type="text" name="company_name" value={formData.company_name} onChange={this.handleInputChange} />
            </div>

            <div className="form-group col-lg-4 col-md-12">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={this.handleInputChange} />
            </div>

            <div className="form-group col-lg-4 col-md-12">
              <label>Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={this.handleInputChange} />
            </div>
            <div className="form-group col-lg-4 col-md-12">
              <label>Size of Company</label>
              <input type="number" name="size_of_company" value={formData.size_of_company} onChange={this.handleInputChange} />
            </div>

            <div className="form-group col-lg-4 col-md-12">
              <label>Business Type</label>
              <input type="text" name="business_type" value={formData.business_type} onChange={this.handleInputChange} />
            </div>

            <div className="form-group col-lg-4 col-md-12">
              <label>Company Website</label>
              <input type="text" name="company_website" value={formData.company_website} onChange={this.handleInputChange} />
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Established Date</label>
              <input type="date" name="established_date" value={formData.established_date} onChange={this.handleInputChange} />
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>NTN</label>
              <input type="text" name="NTN" value={formData.NTN} onChange={this.handleInputChange} />
            </div>

            <div className="row">
              <div className="form-group col-lg-4 col-md-12">
                <label>Country</label>
                <Select
                  value={this.state.selectedCountry}
                  options={countryOptions}
                  onChange={this.handleCountryChange}
                  placeholder="Select country"
                />
              </div>

              <div className="form-group col-lg-4 col-md-12">
                <label>District</label>
                <Select
                  value={this.state.selectedDistrict}
                  options={districtOptions}
                  onChange={this.handleDistrictChange}
                  placeholder="Select district"
                  isDisabled={!this.state.selectedCountry}
                />
              </div>

              <div className="form-group col-lg-4 col-md-12">
                <label>City</label>
                <Select
                  value={this.state.selectedCity}
                  options={cityOptions}
                  onChange={this.handleCityChange}
                  placeholder="Select city"
                  isDisabled={!this.state.selectedDistrict}
                />
              </div>
            </div>



            <div className="form-group col-lg-12 col-md-12">
              <label>Company Address</label>
              <input type="text" name="company_address" value={formData.company_address} onChange={this.handleInputChange} />
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <button className="theme-btn btn-style-one" type="submit">
                Save
              </button>
            </div>
          </div>
        </form >
      </div >
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    userId: ownProps.userId || state.user.userId,
  };
};


export default connect(mapStateToProps)(CompanyProfile);
