"use client";
import React, { Component, createRef } from "react";
import { Card, CardBody, Form, FormGroup, Label, Input, Button, Row, Col, Modal, ModalBody, ModalHeader, ModalFooter } from "reactstrap";
import AsyncSelect from "react-select/async";
import axios from "axios";
import { toast } from "react-toastify";
import PricingForm from "./pricingform";
import api from "../lib/api";
import { withRouter } from "next/router";
import AsyncCreatableSelect from "react-select/async-creatable";

class PostBoxForm extends Component {
  constructor(props) {
    super(props);
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.userId = sessionStorage.getItem("userId");

    this.state = {
      values: {
        job_title: "",
        job_description: "",
        skill_ids: [],
        time_from: "",
        time_to: "",
        job_type_id: null,
        min_salary: "",
        max_salary: "",
        min_experience: "",
        max_experience: "",
        speciality_id: null,
        degree_id: null,
        application_deadline: "",
        no_of_positions: "",
        industry: "",
        currency_id: null,
      },
      selectedCountry: null,
      selectedDistrict: null,
      selectedCity: null,
      errors: {},
      showPricing: false,
      jobId: null,
      isFocused: false,
    };
    this.allSkills = [];
    // Create refs for all fields
    this.refsFields = {
      job_title: createRef(),
      job_description: createRef(),
      skill_ids: createRef(),
      time_from: createRef(),
      time_to: createRef(),
      job_type_id: createRef(),
      min_salary: createRef(),
      max_salary: createRef(),
      currency_id: createRef(),
      min_experience: createRef(),
      max_experience: createRef(),
      no_of_positions: createRef(),
      speciality_id: createRef(),
      degree_id: createRef(),
      country_id: createRef(),
      district_id: createRef(),
      city_id: createRef(),
      application_deadline: createRef(),
      industry: createRef(),
    };

    this.experienceOptions = [
      { value: "Fresh", label: "Fresh" },
      { value: "<1", label: "Less than 1 Year" },
      ...Array.from({ length: 20 }, (_, i) => ({ value: i + 1, label: `${i + 1} Years` })),
      { value: ">21", label: "More than 20 Years" },
    ];

  }
  componentDidMount() {
    this.loadSkills().then(() => {
      if (this.props.jobId) {
        this.loadJobDetails(this.props.jobId);
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.jobId !== this.props.jobId) {
      this.loadSkills().then(() => this.loadJobDetails(this.props.jobId));
    }
  }


  loadJobDetails = async (jobId) => {
    try {
      // Ensure skills are loaded
      if (!this.allSkills || this.allSkills.length === 0) {
        await this.loadSkills();
      }

      const res = await axios.get(`${this.apiBaseUrl}job/getSinglejob/${jobId}`);
      const job = res.data;

      const selectedSkills = job.skill_ids?.map(id => {
        return this.allSkills.find(skill => skill.value === id) || { label: `Skill ${id}`, value: id };
      }) || [];

      this.setState({
        values: {
          ...this.state.values,
          job_title: job.job_title || "",
          job_description: job.job_description || "",
          skill_ids: selectedSkills,
          time_from: job.time_from || "",
          time_to: job.time_to || "",
          job_type_id: job.job_type_id ? { label: job.job_type, value: job.job_type_id } : null,
          min_salary: job.min_salary || "",
          max_salary: job.max_salary || "",
          currency_id: job.currency_id ? { label: job.currency, value: job.currency_id } : null,
          min_experience: job.min_experience || "",
          max_experience: job.max_experience || "",
          speciality_id: job.speciality_id ? { label: job.speciality, value: job.speciality_id } : null,
          degree_id: job.degree_id ? { label: job.degree, value: job.degree_id } : null,
          application_deadline: job.application_deadline?.split("T")[0] || "",
          no_of_positions: job.no_of_positions || "",
          industry: job.industry || "",
        },
        selectedCountry: job.country_id ? { label: job.country, value: job.country_id } : null,
        selectedDistrict: job.district_id ? { label: job.district, value: job.district_id } : null,
        selectedCity: job.city_id ? { label: job.city, value: job.city_id } : null,
      });
    } catch (err) {
      console.error("Failed to load job details", err);
    }
  };


  // ------------------ Loaders ------------------ //
  loadCountries = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallCountries`, {
        params: { search: inputValue || "", page: 1, limit: 0 },
      });
      return res.data.countries.map((c) => ({ label: c.name, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  loadDistricts = async (inputValue) => {
    const { selectedCountry } = this.state;
    if (!selectedCountry?.value) return [];
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalldistricts`, {
        params: { country_id: selectedCountry.value },
      });
      return res.data.districts.map((d) => ({ label: d.name, value: d.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  fetchCities = async (inputValue) => {
    const { selectedDistrict } = this.state;
    if (!selectedDistrict?.value) return [];
    try {
      const res = await axios.get(`${this.apiBaseUrl}getCitiesByDistrict/${selectedDistrict.value}`
      );
      return res.data.cities.map((c) => ({ label: c.name, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  loadJobTypes = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalljobtypes`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.jobtypes.map((c) => ({ label: c.name, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  loadSkills = async (inputValue) => {
    try {
      if (!this.allSkills || this.allSkills.length === 0) {
        const res = await axios.get(`${this.apiBaseUrl}getallskills`, {
          params: { page: 1, limit: 1000 },
        });

        this.allSkills = res.data.skills.map(skill => ({
          label: skill.name,
          value: skill.id,
        }));
      }

      // 🔹 Filter based on input
      return this.allSkills.filter(skill =>
        skill.label.toLowerCase().includes((inputValue || "").toLowerCase())
      );
    } catch (err) {
      console.error(err);
      return [];
    }
  };


  filterSkills = (inputValue) => {
    if (!this.allSkills) return [];
    return this.allSkills.filter(skill =>
      skill.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  };


  loadSpeciality = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallspeciality`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.speciality.map((c) => ({ label: c.name, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  loadDegree = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getalldegreetype`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.degreetypes.map((c) => ({ label: c.name, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  loadCurrency = async (inputValue) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}getallcurrencies`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.currencies.map((c) => ({ label: c.code, value: c.id }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // ------------------ Handlers ------------------ //
  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      values: { ...prev.values, [name]: value },
    }), () => this.validateField(name, value));
  };

  handleSelectChange = (name, selectedOption) => {
    this.setState(
      (prev) => ({
        values: { ...prev.values, [name]: selectedOption },
      }),
      () => {
        const { errors } = this.state;
        if (errors[name]) {
          this.setState((prev) => {
            const newErrors = { ...prev.errors };
            delete newErrors[name];
            return { errors: newErrors };
          });
        }
      }
    );
  };

  handleFocus = () => this.setState({ isFocused: true });
  handleBlur = () => this.setState({ isFocused: false });

  validateField = (name, value) => {
    const { values } = this.state;
    let errors = { ...this.state.errors };

    if (["job_title", "job_description", "time_from", "time_to", "min_salary", "max_salary", "no_of_positions", "application_deadline", "industry"].includes(name)) {
      if (!value || value.trim() === "") {
        errors[name] = `${name.replace("_", " ")} is required.`;
      } else {
        delete errors[name];
      }
    }

    if (name === "min_salary" || name === "max_salary") {
      const min = parseFloat(values.min_salary);
      const max = parseFloat(values.max_salary);
      if (!isNaN(min) && !isNaN(max) && max <= min) {
        errors.salary = "Max salary must be greater than min salary.";
      } else {
        delete errors.salary;
      }
    }

    if (name === "min_experience" || name === "max_experience") {
      if (values.min_experience && values.max_experience &&
        Number(values.max_experience) <= Number(values.min_experience)) {
        errors.experience = "Max experience must be greater than min experience.";
      } else {
        delete errors.experience;
      }
    }

    if (name === "application_deadline") {
      const today = new Date();
      const deadline = new Date(value);
      if (deadline <= today) errors.deadline = "Application deadline must be greater than today.";
      else delete errors.deadline;
    }

    this.setState({ errors });
  };
  validatemessage = () => {
    const { values, selectedCountry, selectedDistrict, selectedCity } = this.state;
    let errors = {};

    if (!values.job_title) errors.job_title = "Job Title is required.";
    if (!values.job_description) errors.job_description = "Job Description is required.";
    if (!values.skill_ids || values.skill_ids.length === 0) errors.skill_ids = "Please select at least one skill.";
    if (!values.time_from) errors.time_from = "Start time is required.";
    if (!values.time_to) errors.time_to = "End time is required.";
    if (!values.job_type_id) errors.job_type_id = "Job Type is required.";
    if (!values.min_salary) errors.min_salary = "Minimum salary is required.";
    if (!values.max_salary) errors.max_salary = "Maximum salary is required.";
    if (!values.currency_id) errors.currency_id = "Currency is required.";
    if (!values.min_experience) errors.min_experience = "Minimum experience is required.";
    if (!values.max_experience) errors.max_experience = "Maximum experience is required.";
    if (!values.no_of_positions) errors.no_of_positions = "Please enter number of positions.";
    if (!values.speciality_id) errors.speciality_id = "Speciality is required.";
    if (!values.degree_id) errors.degree_id = "Qualification is required.";
    if (!selectedCountry) errors.country_id = "Country is required.";
    if (!selectedDistrict) errors.district_id = "District is required.";
    if (!selectedCity) errors.city_id = "City is required.";
    if (!values.application_deadline) errors.application_deadline = "Application deadline is required.";
    if (!values.industry) errors.industry = "Industry is required.";

    return errors;
  };


  handleSubmit = async (e) => {
    const { router } = this.props;
    e.preventDefault();
    const { values, selectedCountry, selectedDistrict, selectedCity, jobId } = this.state;
    const editjobid = this.props.jobId;
    // --- Validation ---
    const newErrors = this.validatemessage();

    this.setState({ errors: newErrors });
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the highlighted errors before submitting.");
      return;
    }

    const formattedDeadline = new Date(values.application_deadline)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const payload = {
      ...values,
      country_id: selectedCountry?.value,
      district_id: selectedDistrict?.value,
      city_id: selectedCity?.value,
      job_type_id: values.job_type_id?.value,
      currency_id: values.currency_id?.value,
      speciality_id: values.speciality_id?.value,
      degree_id: values.degree_id?.value,
      skill_ids: values.skill_ids.map((s) => s.value),
      application_deadline: formattedDeadline,
    };

    try {
      let response;

      if (editjobid) {
        await api.put(
          `${this.apiBaseUrl}job/updatejob/${this.userId}/${editjobid}`,
          payload
        );

        toast.success("Job updated successfully!");

        // ✅ CLOSE MODAL
        if (this.props.onSuccess) {
          this.props.onSuccess();
        }

        return; // ⛔ STOP further execution
      } else {
        response = await api.post(`${this.apiBaseUrl}job/postjob/${this.userId}`, payload);
        toast.success("Job post created successfully!");

        this.setState({ jobId: response.data.job_id, showPricing: true });
      }
      // Reset form
      this.setState({
        values: {
          job_title: "",
          job_description: "",
          skill_ids: [],
          time_from: "",
          time_to: "",
          job_type_id: null,
          min_salary: "",
          max_salary: "",
          min_experience: "",
          max_experience: "",
          speciality_id: null,
          degree_id: null,
          application_deadline: "",
          no_of_positions: "",
          industry: "",
          currency_id: null,
        },
        selectedCountry: null,
        selectedDistrict: null,
        selectedCity: null,
        errors: {},
      });
    } catch (err) {
      console.error(err);
    }
  };

  render() {
    const { values, errors, showPricing, jobId, selectedCountry, selectedDistrict, selectedCity, isFocused } = this.state;
    const inputStyles = {
      height: '60px',
      padding: '15px 20px',
      fontSize: '15px',
      color: '#696969',
      backgroundColor: isFocused ? 'white' : '#f0f5f7',
      border: '1px solid #f0f5f7',
      borderRadius: '8px',
      boxSizing: 'border-box'
    };



    return (
      <Form onSubmit={this.handleSubmit}>
        <Card>
          <CardBody>
            <div className='text-danger py-4'>*  -  All fields are mandatory</div>
            <Row>
              {/* Job Title */}
              <Col md="12">
                <FormGroup>
                  <Label>Job Title <span className="text-danger">*</span></Label>
                  <Input
                    type="text"
                    name="job_title"
                    innerRef={this.refsFields.job_title}
                    value={values.job_title}
                    onChange={this.handleInputChange}
                  />
                  {errors?.job_title && <div className="text-danger">{errors.job_title}</div>}
                </FormGroup>
              </Col>

              {/* Job Description */}
              <Col md="12">
                <FormGroup>
                  <Label>Job Description <span className="text-danger">*</span></Label>
                  <Input
                    type="textarea"
                    name="job_description"
                    innerRef={this.refsFields.job_description}
                    value={values.job_description}
                    placeholder="Describe your job in detail"
                    onChange={this.handleInputChange}
                  />
                  {errors?.job_description && <div className="text-danger">{errors.job_description}</div>}
                </FormGroup>
              </Col>

              {/* Skills */}
              <Col md="6">
                <FormGroup>
                  <Label>Skills <span className="text-danger">*</span></Label>
                  <AsyncCreatableSelect
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={this.loadSkills}   // ✅ now returns options
                    value={values.skill_ids || []}
                    onChange={(selected) => {
                      this.setState((prev) => ({
                        values: { ...prev.values, skill_ids: selected || [] },
                        errors: { ...prev.errors, skill_ids: undefined },
                      }));
                    }}
                    onCreateOption={(inputValue) => {
                      const newSkill = { label: inputValue, value: inputValue };
                      this.setState((prev) => ({
                        values: {
                          ...prev.values,
                          skill_ids: [...prev.values.skill_ids, newSkill],
                        },
                      }));
                    }}
                  />



                  {errors?.skill_ids && <div className="text-danger">{errors.skill_ids}</div>}
                </FormGroup>
              </Col>

              {/* Job Timings */}
              <Col md="6">
                <FormGroup>
                  <Label>Job Timings <span className="text-danger">*</span></Label>
                  <Row>
                    <Col>
                      <Input
                        type="time"
                        name="time_from"
                        innerRef={this.refsFields.time_from}
                        value={values.time_from}
                        onChange={this.handleInputChange}
                        style={inputStyles}
                      />
                      {errors?.time_from && <div className="text-danger">{errors.time_from}</div>}
                    </Col>
                    <Col>
                      <Input
                        type="time"
                        name="time_to"
                        innerRef={this.refsFields.time_to}
                        value={values.time_to}
                        onChange={this.handleInputChange}
                        style={inputStyles}
                      />
                      {errors?.time_to && <div className="text-danger">{errors.time_to}</div>}
                    </Col>
                  </Row>
                </FormGroup>
              </Col>

              {/* Job Type */}
              <Col md="6">
                <FormGroup>
                  <Label>Job Type <span className="text-danger">*</span></Label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={this.loadJobTypes}
                    value={values.job_type_id}
                    ref={this.refsFields.job_type_id}
                    onChange={(option) => this.handleSelectChange("job_type_id", option)}
                  />
                  {errors?.job_type_id && <div className="text-danger">{errors.job_type_id}</div>}
                </FormGroup>
              </Col>

              {/* Salary */}
              <Col md="6">
                <FormGroup>
                  <Label>Salary Range <span className="text-danger">*</span></Label>
                  <Row>
                    <Col>
                      <Input
                        type="number"
                        name="min_salary"
                        innerRef={this.refsFields.min_salary}
                        value={values.min_salary}
                        placeholder="Min"
                        onChange={this.handleInputChange}
                      />
                      {errors?.min_salary && <div className="text-danger">{errors.min_salary}</div>}
                    </Col>
                    <Col>
                      <Input
                        type="number"
                        name="max_salary"
                        innerRef={this.refsFields.max_salary}
                        value={values.max_salary}
                        placeholder="Max"
                        onChange={this.handleInputChange}
                      />
                      {errors?.max_salary && <div className="text-danger">{errors.max_salary}</div>}
                      {errors?.salary && <div className="text-danger">{errors.salary}</div>}
                    </Col>
                    <Col>
                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={this.loadCurrency}
                        value={values.currency_id}
                        ref={this.refsFields.currency_id}
                        onChange={(option) => this.handleSelectChange("currency_id", option)}
                      />
                      {errors?.currency_id && <div className="text-danger">{errors.currency_id}</div>}
                    </Col>
                  </Row>
                </FormGroup>
              </Col>

              {/* Experience */}
              <Col md="6">
                <FormGroup>
                  <Label>Experience <span className="text-danger">*</span></Label>
                  <Row>
                    <Col>
                      <Input
                        type="select"
                        name="min_experience"
                        innerRef={this.refsFields.min_experience}
                        value={values.min_experience}
                        onChange={this.handleInputChange}
                      >
                        <option value="">Min</option>
                        {this.experienceOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </Input>
                      {errors?.min_experience && <div className="text-danger">{errors.min_experience}</div>}
                    </Col>
                    <Col>
                      <Input
                        type="select"
                        name="max_experience"
                        innerRef={this.refsFields.max_experience}
                        value={values.max_experience}
                        onChange={this.handleInputChange}
                      >
                        <option value="">Max</option>
                        {this.experienceOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </Input>
                      {errors?.max_experience && <div className="text-danger">{errors.max_experience}</div>}
                      {errors?.experience && <div className="text-danger">{errors.experience}</div>}
                    </Col>
                  </Row>
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label>No of Positions <span className="text-danger">*</span></Label>
                  <Input
                    type="number"
                    name="no_of_positions"
                    innerRef={this.refsFields.no_of_positions}
                    value={values.no_of_positions}
                    onChange={this.handleInputChange}
                  />
                  {errors?.no_of_positions && <div className="text-danger">{errors.no_of_positions}</div>}
                </FormGroup>
              </Col>
              {/* speciality_id */}
              <Col md="6">
                <FormGroup>
                  <Label>Speciality <span className="text-danger">*</span></Label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={this.loadSpeciality}
                    value={values.speciality_id}
                    ref={this.refsFields.speciality_id}
                    onChange={(option) => this.handleSelectChange("speciality_id", option)}
                  />
                  {errors?.speciality_id && <div className="text-danger">{errors.speciality_id}</div>}
                </FormGroup>
              </Col>

              {/* Degree */}
              <Col md="6">
                <FormGroup>
                  <Label>Degree <span className="text-danger">*</span></Label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={this.loadDegree}
                    value={values.degree_id}
                    ref={this.refsFields.degree_id}
                    onChange={(option) => this.handleSelectChange("degree_id", option)}
                  />
                  {errors?.degree_id && <div className="text-danger">{errors.degree_id}</div>}
                </FormGroup>
              </Col>

              {/* Country */}
              <Col md="6">
                <FormGroup>
                  <Label>Country <span className="text-danger">*</span></Label>
                  <AsyncSelect
                    ref={this.refsFields.country_id}
                    cacheOptions
                    defaultOptions
                    loadOptions={this.loadCountries}
                    value={this.state.selectedCountry || null}
                    onChange={(option) => this.setState({ selectedCountry: option, selectedDistrict: null, selectedCity: null })}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: "50px",
                        height: "60px",
                        backgroundColor: "rgb(240, 245, 247)",
                        border: "none",
                      }),
                      indicatorsContainer: (provided) => ({ ...provided, height: "38px" }),
                    }}
                  />
                  {errors?.country_id && <div className="text-danger">{errors.country_id}</div>}
                </FormGroup>
              </Col>

              {/* District */}
              <Col md="6">
                <FormGroup>
                  <Label>District <span className="text-danger">*</span></Label>
                  <AsyncSelect
                    key={this.state.selectedCountry?.value || 'district'}
                    ref={this.refsFields.district_id}
                    cacheOptions
                    defaultOptions
                    loadOptions={this.loadDistricts}
                    value={this.state.selectedDistrict || null}
                    onChange={(option) => this.setState({ selectedDistrict: option, selectedCity: null })}
                    isDisabled={!this.state.selectedCountry}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: "50px",
                        height: "60px",
                        backgroundColor: "rgb(240, 245, 247)",
                        border: "none",
                      }),
                      indicatorsContainer: (provided) => ({ ...provided, height: "38px" }),
                    }}
                  />
                  {errors?.district_id && <div className="text-danger">{errors.district_id}</div>}
                </FormGroup>
              </Col>

              {/* City */}
              <Col md="6">
                <FormGroup>
                  <Label>City <span className="text-danger">*</span></Label>
                  <AsyncSelect
                    key={this.state.selectedDistrict?.value || 'city'}
                    ref={this.refsFields.city_id}
                    cacheOptions
                    defaultOptions
                    loadOptions={this.fetchCities}
                    value={this.state.selectedCity || null}
                    onChange={(option) => this.setState({ selectedCity: option })}
                    isDisabled={!this.state.selectedDistrict}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: "50px",
                        height: "60px",
                        backgroundColor: "rgb(240, 245, 247)",
                        border: "none",
                      }),
                      indicatorsContainer: (provided) => ({ ...provided, height: "38px" }),
                    }}
                  />
                  {errors?.city_id && <div className="text-danger">{errors.city_id}</div>}
                </FormGroup>
              </Col>




              {/* Application Deadline */}
              <Col md="6">
                <FormGroup>
                  <Label>Application Deadline <span className="text-danger">*</span></Label>
                  <Input
                    type="date"
                    name="application_deadline"
                    innerRef={this.refsFields.application_deadline}
                    value={values.application_deadline}
                    onChange={this.handleInputChange}
                  />
                  {errors?.application_deadline && <div className="text-danger">{errors.application_deadline}</div>}
                  {errors?.deadline && <div className="text-danger">{errors.deadline}</div>}
                </FormGroup>
              </Col>

              {/* Industry */}
              <Col md="6">
                <FormGroup>
                  <Label for="industry">Industry / Facility Type</Label>
                  <Input
                    type="select"
                    name="industry"
                    id="industry"
                    value={this.state.values.industry || ""}
                    onChange={this.handleInputChange}   // ✅ correct handler
                    innerRef={this.refsFields.industry}
                    style={inputStyles}
                  >
                    <option value="">-- Select Industry --</option>
                    <option value="hospital_small">Hospital (Small, &lt;50 beds)</option>
                    <option value="hospital_medium">Hospital (Medium, 50–200 beds)</option>
                    <option value="hospital_large">Hospital (Large, 200+ beds)</option>
                    <option value="clinic">Clinic</option>
                    <option value="diagnostic_center">Diagnostic Center</option>
                    <option value="medical_laboratory">Medical Laboratory</option>
                    <option value="rehabilitation_center">Rehabilitation Center</option>
                    <option value="medical_equipment_supplier">Medical Equipment Supplier / Distributor</option>
                  </Input>
                  {this.state.errors?.industry && (
                    <div className="text-danger">{this.state.errors.industry}</div>
                  )}
                </FormGroup>
              </Col>

            </Row>
            <div className="d-flex justify-content-end">
              <Button color="primary" type="submit">
                Next
              </Button>
            </div>
            {showPricing && (
              <Modal
                isOpen={showPricing}
                toggle={() => this.setState({ showPricing: false })}
                size="lg"
                centered
              >
                <ModalHeader toggle={() => this.setState({ showPricing: false })}>
                  Pricing
                </ModalHeader>

                <ModalBody>
                  <PricingForm
                    jobId={jobId}
                    onPaymentSuccess={() => this.setState({ showPricing: false })}
                  />
                </ModalBody>
              </Modal>
            )}


          </CardBody>
        </Card>



      </Form>

    );
  }
}

export default withRouter(PostBoxForm);
