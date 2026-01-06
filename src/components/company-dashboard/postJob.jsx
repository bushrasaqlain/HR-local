"use client"
import React, { useState, useRef, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useQuery } from 'react-query';
import axios from 'axios';
import Select from "react-select";
// import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AsyncSelect from "react-select/async";
import api from '../lib/api';
import { toast } from 'react-toastify';
import PricingForm from './PricingForm';

const PostBoxForm = () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
 const userId = sessionStorage.getItem("userId");
  const [values, setFormData] = useState({
    job_title: "",
    job_description: "",
    skill_ids: [],
    time_from: "",
    time_to: "",
    job_type_id: "",
    min_salary: "",
    max_salary: "",
    min_experience: "",
    max_experience: "",
    profession_id: "",
    degree_id: "",
    application_deadline: "",
    no_of_positions: "",
    industry: "",
    currency_id: ""
  });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPricing, setShowPricing] = useState(false);
  const [jobId, setJobId] = useState(null);

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
  const loadJobTypes = async (inputValue) => {
    try {
      const res = await axios.get(`${apiBaseUrl}getalljobtypes`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.jobtypes.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error("Error loading business types:", error);
      return [];
    }
  };

  const loadSkills = async (inputValue) => {
    try {
      const res = await axios.get(`${apiBaseUrl}getallskills`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.skills.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error("Error loading business types:", error);
      return [];
    }
  };

  const loadProfessions = async (inputValue) => {
    try {
      const res = await axios.get(`${apiBaseUrl}getallprofessions`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.professions.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error("Error loading business types:", error);
      return [];
    }
  };

  const loadCurrency = async (inputValue) => {
    try {
      const res = await axios.get(`${apiBaseUrl}getallcurrencies`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.currencies.map((c) => ({
        label: c.code,
        value: c.id,
      }));
    } catch (error) {
      console.error("Error loading business types:", error);
      return [];
    }
  };

  const loadDegree = async (inputValue) => {
    try {
      const res = await axios.get(`${apiBaseUrl}getalldegreetype`, {
        params: { search: inputValue || "", page: 1, limit: 15 },
      });
      return res.data.degreetypes.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    } catch (error) {
      console.error("Error loading business types:", error);
      return [];
    }
  };

  const handlesubmit = async (event) => {
    event.preventDefault();

    // --- validate ---
    let newErrors = {};
    if (!values.job_title) newErrors.job_title = "Job Title is required.";
    if (!values.job_description) newErrors.job_description = "Job Description is required.";
    if (!values.skill_ids || values.skill_ids.length === 0) newErrors.skill_ids = "Please select at least one skill.";
    if (!values.time_from) newErrors.time_from = "Start time is required.";
    if (!values.time_to) newErrors.time_to = "End time is required.";
    if (!values.job_type_id) newErrors.job_type_id = "Job Type is required.";
    if (!values.min_salary) newErrors.min_salary = "Minimum salary is required.";
    if (!values.max_salary) newErrors.max_salary = "Maximum salary is required.";
    if (!values.currency_id) newErrors.currency_id = "Currency is required.";
    if (!values.min_experience) newErrors.min_experience = "Minimum experience is required.";
    if (!values.max_experience) newErrors.max_experience = "Maximum experience is required.";
    if (!values.no_of_positions) newErrors.no_of_positions = "Please enter number of positions.";
    if (!values.profession_id) newErrors.profession_id = "Speciality is required.";
    if (!values.degree_id) newErrors.degree_id = "Qualification is required.";
    if (!selectedCountry) newErrors.country_id = "Country is required.";
    if (!selectedDistrict) newErrors.district_id = "District is required.";
    if (!selectedCity) newErrors.city_id = "City is required.";
    if (!values.application_deadline) newErrors.application_deadline = "Application deadline is required.";
    if (!values.industry) newErrors.industry = "Industry is required.";

    setErrors(newErrors);

    // If errors, stop here
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log("Validation errors:", newErrors);

      // Focus on the first invalid field
      const firstErrorKey = Object.keys(newErrors)[0];
      if (refs[firstErrorKey]?.current) {
        refs[firstErrorKey].current.focus();
      }

      toast.error("Please fix the highlighted errors before submitting.");
      return;
    }



    const formattedDeadline = new Date(values.application_deadline)
      .toISOString()
      .slice(0, 19)     // "2025-09-26T12:56:00"
      .replace("T", " ");

    const payload = {
      ...values,
      country_id: selectedCountry?.value,
      district_id: selectedDistrict?.value,
      city_id: selectedCity?.value,
      job_type_id: values.job_type_id?.value,
      currency_id: values.currency_id?.value,
      profession_id: values.profession_id?.value,
      degree_id: values.degree_id?.value,
      skill_ids: values.skill_ids.map((skill) => skill.value), // send IDs
      application_deadline: formattedDeadline
    };

    try {
      const response = await api.post(`${apiBaseUrl}job/postjob/${userId}`, payload);
      console.log("response for job post", response)
      if (response.status === 201) {
        toast.success('Job post created successfully!');
        setJobId(response.data.job_id);
        setFormData({
          job_title: "",
          job_description: "",
          skill_ids: [],
          time_from: "",
          time_to: "",
          job_type_id: "",
          min_salary: "",
          max_salary: "",
          min_experience: "",
          max_experience: "",
          profession_id: "",
          degree_id: "",
          application_deadline: "",
          no_of_positions: "",
          industry: "",
          currency_id: ""
        });

        setShowPricing(true);
      } else {
        // Set error message on API request failure
        toast.error('Error: Unable to post job.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);

        // Extract and set the error message from the response
        // setErrorMessage(`Error: ${error.response.data.error}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from the server');
        // setErrorMessage('Error: No response received from the server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up the request:', error.message);
        // setErrorMessage(`Error: ${error.message}`);
      }

      // Reset form submission status
      // setIsSubmitting(false);
    }
  };

  const [isFocused, setIsFocused] = useState(false);

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };
  const inputStyles = {
    height: '3.5rem',
    backgroundColor: isFocused ? 'white' : '#f0f5f7',
    position: 'relative',
    width: '100%',
    display: 'block',
    height: '60px',
    lineHeight: '30px',
    padding: '15px 20px',
    fontSize: '15px',
    color: '#696969',
    backgroundColor: '#f0f5f7',
    border: '1px solid #f0f5f7',
    WebkitBoxSizing: 'border-box',
    boxSizing: 'border-box',
    borderRadius: '8px',
  };

  const experienceOptions = [
    { value: "Fresh", label: "Fresh" },
    { value: "<1", label: "Less than 1 Year" },
    { value: 1, label: "1 Year" },
    { value: 2, label: "2 Years" },
    { value: 3, label: "3 Years" },
    { value: 4, label: "4 Years" },
    { value: 5, label: "5 Years" },
    { value: 6, label: "6 Years" },
    { value: 7, label: "7 Years" },
    { value: 8, label: "8 Years" },
    { value: 9, label: "9 Years" },
    { value: 10, label: "10 Years" },
    { value: 11, label: "11 Years" },
    { value: 12, label: "12 Years" },
    { value: 13, label: "13 Years" },
    { value: 14, label: "14 Years" },
    { value: 15, label: "15 Years" },
    { value: 16, label: "16 Years" },
    { value: 17, label: "17 Years" },
    { value: 18, label: "18 Years" },
    { value: 19, label: "19 Years" },
    { value: 20, label: "20 Years" },
    { value: ">21", label: "More than 20 Years" },
  ];

  const validateField = (name, value) => {
    let newErrors = { ...errors };

    // Required fields
    if (["job_title", "job_description", "time_from", "time_to", "min_salary", "max_salary", "no_of_positions", "application_deadline", "industry"].includes(name)) {
      if (!value || value.trim() === "") {
        newErrors[name] = `${name.replace("_", " ")} is required.`;
      } else {
        delete newErrors[name];
      }
    }

    // Salary range validation
    // Salary range validation
    if (name === "min_salary" || name === "max_salary") {
      const min = values.min_salary !== "" ? parseFloat(values.min_salary) : null;
      const max = values.max_salary !== "" ? parseFloat(values.max_salary) : null;

      if (min !== null && max !== null) {
        if (isNaN(min) || isNaN(max)) {
          newErrors.salary = "Salary must be a valid number.";
        } else if (max <= min) {
          newErrors.salary = "Max salary must be greater than min salary.";
        } else {
          delete newErrors.salary;
        }
      } else {
        delete newErrors.salary; // don’t run range check until both are filled
      }
    }



    // Experience range validation
    if (name === "min_experience" || name === "max_experience") {
      if (values.min_experience && values.max_experience &&
        Number(values.max_experience) <= Number(values.min_experience)) {
        newErrors.experience = "Max experience must be greater than min experience.";
      } else {
        delete newErrors.experience;
      }
    }

    // Deadline validation
    if (name === "application_deadline") {
      const today = new Date();
      const deadline = new Date(value);
      if (deadline <= today) {
        newErrors.deadline = "Application deadline must be greater than today's date.";
      } else {
        delete newErrors.deadline;
      }
    }

    setErrors(newErrors);
  };



  const handleInputchange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Run field validation on change
    validateField(name, value);
  };



  useEffect(() => {
    console.log("form data", values);
  }, [values]);

  // Keep values in sync with selectedCountry, selectedDistrict, selectedCity
  // useEffect(() => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     country_id: selectedCountry,
  //     district_id: selectedDistrict,
  //     city_id: selectedCity,
  //   }));
  // }, [selectedCountry, selectedDistrict, selectedCity]);

  const refs = {
    job_title: useRef(null),
    job_description: useRef(null),
    skill_ids: useRef(null),
    time_from: useRef(null),
    time_to: useRef(null),
    job_type_id: useRef(null),
    min_salary: useRef(null),
    max_salary: useRef(null),
    currency_id: useRef(null),
    min_experience: useRef(null),
    max_experience: useRef(null),
    no_of_positions: useRef(null),
    profession_id: useRef(null),
    degree_id: useRef(null),
    country_id: useRef(null),
    district_id: useRef(null),
    city_id: useRef(null),
    application_deadline: useRef(null),
    industry: useRef(null),
  };


  return (
    <div>
      {!showPricing &&
        <form className="default-form" onSubmit={handlesubmit}>
          <div className='text-danger py-4'> *  -  All fields are mandatory</div>
          <div className="row">
            {/* <!-- Input --> */}
            <div className="form-group col-lg-12 col-md-12">
              <label>Job Title <span className="text-danger">*</span></label>
              <input type="text" name="job_title" ref={refs.job_title} placeholder="Title" value={values.job_title} onChange={handleInputchange} />
              {errors?.job_title && (
                <div className="text-danger">{errors.job_title}</div>
              )}
            </div>

            {/* <!-- About Company --> */}
            <div className="form-group col-lg-12 col-md-12">
              <label>Job Description <span className="text-danger">*</span></label>
              <textarea type="text" ref={refs.job_description} value={values.job_description} name="job_description" placeholder=
                // "Spent several years working on sheep on Wall Street. Had moderate success investing in Yugo's on Wall Street. Managed a small team buying and selling Pogo sticks for farmers. Spent several years licensing licorice in West Palm Beach, FL. Developed several new methods for working it banjos in the aftermarket. Spent a weekend importing banjos in West Palm Beach, FL.In this position, the Software Engineer collaborates with Evention's Development team to continuously enhance our current software solutions as well as create new solutions to eliminate the back-office operations and management challenges present"
                "Describe your job in detail"
                onChange={handleInputchange}></textarea>
              {errors?.job_description && (
                <div className="error-message text-danger">{errors?.job_description}</div>
              )}
            </div>
            <div className="form-group col-lg-6 col-md-12">
              <label>Skills <span className="text-danger">*</span></label>
              <AsyncSelect
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={loadSkills}
                value={values.skill_ids || []}
                ref={refs.skill_ids}
                onChange={(selectedOptions) => {
                  // handleInputchange({ target: { name: "skills", value: selectedOption } })}
                  setFormData((prev) => ({ ...prev, skill_ids: selectedOptions || [] }))
                  if (errors.skill_ids) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.skill_ids;
                      return newErrors;
                    });
                  }
                }
                }

                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "50px",
                    height: "60px",
                    backgroundColor: "rgb(240, 245, 247)",
                    border: "none",
                  }),
                  indicatorsContainer: (provided) => ({
                    ...provided,
                    height: "38px",
                  }),
                }}
              />

              {errors?.skill_ids && (
                <div className="text-danger">{errors.skill_ids}</div>
              )}
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Job Timings <span className="text-danger">*</span></label>
              <div style={{ display: 'flex', direction: 'row', gap: '10px', width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="time"
                    ref={refs.time_from}
                    className="form-control"
                    value={values.time_from}
                    name="time_from"
                    onChange={handleInputchange}
                    style={inputStyles}
                  />
                  {errors?.time_from && (
                    <div className="text-danger">{errors?.time_from}</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    ref={refs.time_to}
                    type="time"
                    className="form-control"
                    value={values.time_to}
                    name="time_to"
                    onChange={handleInputchange}
                    style={inputStyles}
                  />
                  {errors?.time_to && (
                    <div className="text-danger">{errors?.time_to}</div>
                  )}

                  {/* {errors.m && (
                  <div className='error-message text-danger'>{errors.max_salary}</div>
                )} */}
                </div>
              </div>
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Job Type <span className="text-danger">*</span></label>
              <AsyncSelect
                ref={refs.job_type_id}
                cacheOptions
                defaultOptions
                loadOptions={loadJobTypes}
                value={values.job_type_id || null}
                onChange={(selectedOption) => {
                  setFormData((prev) => ({ ...prev, job_type_id: selectedOption }))
                  if (errors.job_type_id) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.job_type_id;
                      return newErrors;
                    });
                  }
                }
                }

                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "50px",
                    height: "60px",
                    backgroundColor: "rgb(240, 245, 247)",
                    border: "none",
                  }),
                  indicatorsContainer: (provided) => ({
                    ...provided,
                    height: "38px",
                  }),
                }}
              />
              {errors?.job_type_id && (
                <div className="text-danger">{errors?.job_type_id}</div>
              )}
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Salary Range<span className="text-danger">*</span></label>
              <div style={{ display: 'flex', direction: 'row', gap: '10px', width: "100%" }}>
                <div style={{ flex: 1 }}>
                  <input
                    type='number'
                    ref={refs.min_salary}
                    className='form-control'
                    value={values.min_salary}
                    placeholder="min"
                    name="min_salary"
                    onChange={handleInputchange}
                  />
                  {errors?.min_salary && (
                    <div className="text-danger">{errors?.min_salary}</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="number"
                    ref={refs.max_salary}
                    className='form-control'
                    value={values.max_salary}
                    name="max_salary"
                    onChange={handleInputchange}
                  />
                  {errors?.max_salary && (
                    <div className="text-danger">{errors?.max_salary}</div>
                  )}
                  {errors?.salary && <div className="text-danger">{errors?.salary}</div>}
                </div>

                <span>
                  <AsyncSelect
                    ref={refs.currency_id}
                    cacheOptions
                    defaultOptions
                    loadOptions={loadCurrency}
                    value={values.currency_id || null}
                    onChange={(selectedOption) => {
                      setFormData((prev) => ({ ...prev, currency_id: selectedOption }))
                      if (errors.currency_id) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.currency_id;
                          return newErrors;
                        });
                      }
                    }
                    }

                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: "50px",
                        height: "60px",
                        backgroundColor: "rgb(240, 245, 247)",
                        border: "none",
                      }),
                      indicatorsContainer: (provided) => ({
                        ...provided,
                        height: "38px",
                      }),
                    }}
                  /></span>
                {errors?.currency_id && (
                  <div className="text-danger">{errors?.currency_id}</div>
                )}
                {/* </div> */}
              </div>
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Experience <span className="text-danger">*</span></label>
              <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  {/* Dropdown */}
                  <select
                    className="chosen-single form-select"
                    name="experienceType"
                    ref={refs.min_experience}
                    value={values.min_experience || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, min_experience: e.target.value }))
                      if (errors.min_experience) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.min_experience;
                          return newErrors;
                        });
                      }
                    }}

                  >
                    <option value="">min</option>
                    {experienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors?.min_experience && (
                    <div className="text-danger">{errors?.min_experience}</div>
                  )}
                </div>
                <div style={{ flex: 1 }} className="no-scrollbar overflow-auto">
                  <select
                    className="chosen-single form-select"
                    name="experienceType"
                    ref={refs.max_experience}
                    value={values.max_experience || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, max_experience: e.target.value }))
                      if (errors.max_experience) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.max_experience;
                          return newErrors;
                        });
                      }
                    }}
                  >
                    <option value="">max</option>
                    {experienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors?.max_experience && (
                    <div className="text-danger">{errors?.max_experience}</div>
                  )}
                </div>
                {errors?.experience && <div className="text-danger">{errors?.experience}</div>}
              </div>

            </div>



            <div className="form-group col-lg-6 col-md-12">
              <label>No of Positions <span className="text-danger">*</span></label>
              <input type="number"
                ref={refs.no_of_positions}
                className='form-control'
                value={values.no_of_positions}
                name="no_of_positions"
                onChange={handleInputchange}
              />
              {errors?.no_of_positions && (
                <div className="text-danger">{errors?.no_of_positions}</div>
              )}
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Speciality <span className="text-danger">*</span></label>
              <AsyncSelect
                ref={refs.profession_id}
                cacheOptions
                defaultOptions
                loadOptions={loadProfessions}
                value={values.profession_id || null}
                onChange={(selectedOption) => {
                  setFormData((prev) => ({ ...prev, profession_id: selectedOption }))
                  if (errors.profession_id) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.profession_id;
                      return newErrors;
                    });
                  }
                }
                }

                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "50px",
                    height: "60px",
                    backgroundColor: "rgb(240, 245, 247)",
                    border: "none",
                  }),
                  indicatorsContainer: (provided) => ({
                    ...provided,
                    height: "38px",
                  }),
                }}
              />
              {errors?.profession_id && (
                <div className="text-danger">{errors?.profession_id}</div>
              )}
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>Qualification Required <span className="text-danger">*</span></label>
              <AsyncSelect
                ref={refs.degree_id}
                cacheOptions
                defaultOptions
                loadOptions={loadDegree}
                value={values.degree_id || null}
                onChange={(selectedOption) => {
                  setFormData((prev) => ({ ...prev, degree_id: selectedOption }))
                  if (errors.degree_id) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.degree_id;
                      return newErrors;
                    });
                  }
                }
                }

                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "50px",
                    height: "60px",
                    backgroundColor: "rgb(240, 245, 247)",
                    border: "none",
                  }),
                  indicatorsContainer: (provided) => ({
                    ...provided,
                    height: "38px",
                  }),
                }}
              />
              {errors?.degree_id && (
                <div className="text-danger">{errors?.degree_id}</div>
              )}
            </div>
            <div className="form-group col-lg-6 col-md-12">
              <label>Country <span className="text-danger">*</span></label>
              <AsyncSelect
                ref={refs.country_id}
                cacheOptions
                defaultOptions
                loadOptions={loadCountries}
                value={selectedCountry || null}
                onChange={(option) => {
                  setSelectedCountry(option);
                  setSelectedDistrict(null);
                  setSelectedCity(null);
                  if (errors.country_id) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.country_id;
                      return newErrors;
                    });
                  }
                }}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "50px",
                    height: "60px",
                    backgroundColor: "rgb(240, 245, 247)",
                    border: "none",
                  }),
                  indicatorsContainer: (provided) => ({
                    ...provided,
                    height: "38px",
                  }),
                }}
              />
              {errors?.country_id && (
                <div className="text-danger">{errors?.country_id}</div>
              )}
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label>District <span className="text-danger">*</span></label>
              <AsyncSelect
                key={selectedCountry?.value}
                ref={refs.district_id}
                cacheOptions
                defaultOptions
                loadOptions={loadDistricts}
                value={selectedDistrict || null}
                onChange={(option) => {
                  setSelectedDistrict(option);
                  setSelectedCity(null);
                  if (errors.district_id) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.district_id;
                      return newErrors;
                    });
                  }
                }}
                isDisabled={!selectedCountry}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "50px",
                    height: "60px",
                    backgroundColor: "rgb(240, 245, 247)",
                    border: "none",
                  }),
                  indicatorsContainer: (provided) => ({
                    ...provided,
                    height: "38px",
                  }),
                }}
              />
              {errors?.district_id && (
                <div className="text-danger">{errors?.district_id}</div>
              )}
            </div>



            <div className="form-group col-lg-6 col-md-12">
              <label>City <span className="text-danger">*</span></label>
              <AsyncSelect
                key={selectedDistrict?.value}
                ref={refs.city_id}
                cacheOptions
                defaultOptions
                loadOptions={fetchCities}
                value={selectedCity || null}
                onChange={(option) => {
                  setSelectedCity(option)
                  if (errors.city_id) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.city_id;
                      return newErrors;
                    });
                  }
                }}
                isDisabled={!selectedDistrict}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "50px",
                    height: "60px",
                    backgroundColor: "rgb(240, 245, 247)",
                    border: "none",
                  }),
                  indicatorsContainer: (provided) => ({
                    ...provided,
                    height: "38px",
                  }),
                }}
              />
              {errors?.city_id && (
                <div className="text-danger">{errors?.city_id}</div>
              )}
            </div>

            {/* Application deadline */}
            <div className="form-group col-lg-6 col-md-12">
              <label>Application Deadline Date <span className="text-danger">*</span></label>

              <input
                type="datetime-local"
                name="application_deadline"
                placeholder="MM/DD/YYYY"
                value={values.application_deadline}
                onChange={handleInputchange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="form-control"
                style={inputStyles}
                ref={refs.application_deadline}
                min={(new Date()).toISOString().slice(0, 16)} // Set min to the current date and time
              // max={expireAt instanceof Date && !isNaN(expireAt) ? expireAt.toISOString().slice(0, 16) : ''}
              />
              {errors?.application_deadline && (
                <div className="text-danger">{errors?.application_deadline}</div>
              )}
              {errors?.deadline && <div className="text-danger">{errors?.deadline}</div>}
            </div>

            <div className="form-group col-lg-6 col-md-12">
              <label htmlFor="industry" className="form-label">Industry / Facility Type</label>
              <select
                id="industry"
                name="industry"
                className="form-select"
                value={values.industry || ""}
                onChange={handleInputchange}
                style={inputStyles}
                ref={refs.industry}
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
              </select>
              {errors?.industry && (
                <div className="text-danger">{errors?.industry}</div>
              )}
            </div>


            {/* <!-- Input --> */}
            <div className="form-group col-lg-12 col-md-12 text-right">
              <input
                type="hidden"
                name="account_id"
              // value={values.company_id} // Set the value to the actual company ID
              />

              <button className="theme-btn btn-style-one" type="submit">Save</button>
            </div>
          </div>
        </form>
      }

      {showPricing &&
        <PricingForm jobId={jobId} setShowPricing={setShowPricing} />
      }
    </div>
  );
};

export default PostBoxForm;
