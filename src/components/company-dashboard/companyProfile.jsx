import React, { Component, createRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Form, FormGroup, Label, Input, Button, Row, Col } from "reactstrap";
import Select from "react-select";

class CompanyProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        username: "",
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
        established_date: "",
        logo: "",
      },
      selectedCountry: null,
      selectedDistrict: null,
      selectedCity: null,
      selectedbusiness_type: null,
      countryOptions: [],
      districtOptions: [],
      cityOptions: [],
      businesstypeOptions: [],
      logoImg: "",
      isNewImageUploaded: false,
      successMessage: "",
      ntnError: "",
    };
    this.formRef = createRef();
    this.successMessageRef = createRef();
    this.userId = sessionStorage.getItem("userId");
  }

  componentDidMount() {
    this.fetchCompanyProfile();
    this.loadCountries();
    this.loadBusinessType();
  }

  fetchCompanyProfile = async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const response = await axios.get(
        `${apiBaseUrl}company-info/getcompanybyid/${this.userId}`
      );
      const data = response.data;
      const logoData = data.logo ? `data:image/png;base64,${data.logo}` : "";

      this.setState(
        {
          formData: {
            username: data.username,
            company_name: data.company_name || "",
            email: data.email || "",
            phone: data.phone || "",
            NTN: data.NTN || "",
            city: data.city_name || "",
            country: data.country_name || "",
            district: data.district_name || "",
            size_of_company: data.size_of_company || "",
            business_type: data.Business_entity_type_id || "",
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
          selectedbusiness_type: data.Business_entity_type_id
            ? { value: data.Business_entity_type_id, label: data.business_type_name }
            : null,
        },
        () => {
          if (this.state.selectedCountry) this.loadDistricts();
          if (this.state.selectedDistrict) this.loadCities();
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  loadCountries = async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await axios.get(`${apiBaseUrl}getallCountries`, {
        params: { page: 1, limit: 100 },
      });
      const options = res.data.countries.map((c) => ({ label: c.name, value: c.id }));
      this.setState({ countryOptions: options });
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  };

  loadBusinessType = async () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await axios.get(`${apiBaseUrl}getallbusinesstypes`, {
        params: { page: 1, limit: 100, status: "Active" },
      });
      const options = res.data.business_types.map((b) => ({ label: b.name, value: b.id }));
      this.setState({ businesstypeOptions: options });
    } catch (error) {
      console.error("Error loading business types:", error);
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
      const options = res.data.districts.map((d) => ({ label: d.name, value: d.id }));
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
      const res = await axios.get(`${apiBaseUrl}getCitiesByDistrict/${selectedDistrict.value}`, {
        params: { page: 1, limit: 100 },
      });
      const options = res.data.cities.map((c) => ({ label: c.name, value: c.id }));
      this.setState({ cityOptions: options });
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  handleBusinessTypeChange = (selectedbusiness_type) => {
    this.setState((prev) => ({
      selectedbusiness_type,
      formData: {
        ...prev.formData,
        business_type: selectedbusiness_type ? selectedbusiness_type.value : "",
      },
    }));
  };

  handleCountryChange = (selectedCountry) => {
    this.setState(
      (prev) => ({
        selectedCountry,
        selectedDistrict: null,
        selectedCity: null,
        formData: {
          ...prev.formData,
          country: selectedCountry ? selectedCountry.value : "",
        },
      }),
      () => {
        if (selectedCountry) this.loadDistricts();
      }
    );
  };

  handleDistrictChange = (selectedDistrict) => {
    this.setState(
      (prev) => ({
        selectedDistrict,
        selectedCity: null,
        formData: {
          ...prev.formData,
          district: selectedDistrict ? selectedDistrict.value : "",
        },
      }),
      () => {
        if (selectedDistrict) this.loadCities();
      }
    );
  };

  handleCityChange = (selectedCity) => {
    this.setState((prev) => ({
      selectedCity,
      formData: {
        ...prev.formData,
        city: selectedCity ? selectedCity.value : "",
      },
    }));
  };
  validateNTN = (ntn) => {
    // Remove any spaces
    const cleaned = ntn.replace(/\s/g, "");

    // Regex: 7 digits optionally followed by a dash and 1 digit
    const regex = /^\d{7}(-\d)?$/;

    return regex.test(cleaned);
  };
  handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "NTN") {
      this.setState((prevState) => ({
        formData: { ...prevState.formData, [name]: value },
        ntnError: this.validateNTN(value) ? "" : "Invalid NTN format. 8 digit",
      }));
      return;
    }

    if (name === "phone") {
      let cleanedValue = value.replace(/[^\d]/g, "");
      if (cleanedValue.length > 4) {
        cleanedValue = cleanedValue.slice(0, 4) + "-" + cleanedValue.slice(4, 11);
      }
      this.setState((prevState) => ({
        formData: { ...prevState.formData, phone: cleanedValue },
      }));
      return;
    }

    this.setState((prevState) => ({
      formData: { ...prevState.formData, [name]: value },
    }));
  };


  logoHandler = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.setState((prevState) => ({
          formData: { ...prevState.formData, logo: reader.result, logoName: file.name },
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
    const { formData } = this.state;

    const formDataToSend = new FormData();

    if (formData.logo) {
      const base64Data = formData.logo.split(",")[1];
      const logoBlob = this.base64toBlob(base64Data, "image/png");
      formDataToSend.append("logo", logoBlob, formData.logoName || "");
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && key !== "logo") {
        formDataToSend.append(key, value);
      }
    });

    formDataToSend.append("account_id", this.userId);
    formDataToSend.append("userId", this.userId);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const response = await axios.put(
        `${apiBaseUrl}company-info/updateCompanyinfo`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        this.setState({ successMessage: "Company profile updated successfully!" });
        toast.success("Company profile updated successfully!");
      } else {
        this.setState({ successMessage: "Error: Unable to update company profile." });
      }
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    const { formData, logoImg, successMessage, countryOptions, districtOptions, cityOptions, businesstypeOptions } =
      this.state;

    return (
      <div className="company-profile-page">
        {/* Cover Header */}
        <div className="profile-cover">
          <div className="profile-info d-flex align-items-center">
            <div className="profile-avatar">
              {logoImg ? (
                <img src={logoImg} alt="Company Logo" />
              ) : (
                <div className="avatar-placeholder">Logo</div>
              )}
              <label className="upload-btn">
                Change
                <Input
                  type="file"
                  id="upload"
                  hidden
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => this.logoHandler(e.target.files[0])}
                />
              </label>
            </div>

            <div className="ms-4">
              <h3 className="mb-1">{formData.company_name || "Company Name"}</h3>
              <p className="text-muted mb-0">{formData.email}</p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="container mt-4">
          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          <div className="card profile-card">
            <div className="card-header">
              <h5 className="mb-0">Company Details</h5>
            </div>

            <div className="card-body">
              <Form ref={this.formRef} onSubmit={this.handleSubmit}>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>User Name</Label>
                      <Input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={this.handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={this.handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Company Name</Label>
                      <Input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={this.handleInputChange}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Phone</Label>
                      <Input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={this.handleInputChange}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Company Size</Label>
                      <Input
                        type="number"
                        name="size_of_company"
                        value={formData.size_of_company}
                        onChange={this.handleInputChange}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Business Type</Label>
                      <Select
                        value={this.state.selectedbusiness_type}
                        options={businesstypeOptions}
                        onChange={this.handleBusinessTypeChange}
                        placeholder="Select Business Type"
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Website</Label>
                      <Input
                        type="text"
                        name="company_website"
                        value={formData.company_website}
                        onChange={this.handleInputChange}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>Established Date</Label>
                      <Input
                        type="date"
                        name="established_date"
                        value={formData.established_date}
                        onChange={this.handleInputChange}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>NTN</Label>
                      <Input
                        type="text"
                        name="NTN"
                        value={formData.NTN}
                        onChange={this.handleInputChange}
                        invalid={!!this.state.ntnError} // optional if using reactstrap Form feedback styling
                      />
                      {this.state.ntnError && (
                        <div className="text-danger mt-1">{this.state.ntnError}</div>
                      )}
                    </FormGroup>
                  </Col>


                  <Col md={6}>
                    <FormGroup>
                      <Label>Country</Label>
                      <Select
                        value={this.state.selectedCountry}
                        options={countryOptions}
                        onChange={this.handleCountryChange}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>District</Label>
                      <Select
                        value={this.state.selectedDistrict}
                        options={districtOptions}
                        onChange={this.handleDistrictChange}
                        isDisabled={!this.state.selectedCountry}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup>
                      <Label>City</Label>
                      <Select
                        value={this.state.selectedCity}
                        options={cityOptions}
                        onChange={this.handleCityChange}
                        isDisabled={!this.state.selectedDistrict}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={12}>
                    <FormGroup>
                      <Label>Company Address</Label>
                      <Input
                        type="textarea"
                        name="company_address"
                        value={formData.company_address}
                        onChange={this.handleInputChange}
                      />
                    </FormGroup>
                  </Col>

                  <Col md={12} className="text-end">
                    <Button color="primary" className="px-4">
                      Save Changes
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>
        </div>
      </div>
    );

  }
}

export default CompanyProfile;
