import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
// import { useQuery } from 'react-query';
import axios from 'axios';
import Select from "react-select";
// import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PostJob = ({ userId}) => {
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  useEffect(() => {
    const { query } = router;
    const jobId = query.jobId;
    
    console.log('Job ID:', jobId);
    // Use the jobId as needed in this component
  }, [router]);
////////jo bid 

useEffect(() => {
  const { query } = router;
  const jobIdFromUrl = query.jobId;
  console.log('Job ID from URL:', jobIdFromUrl);

  // Fetch data based on jobIdFromUrl
  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      const response = await axios.get(`http://localhost:8080/job/${jobIdFromUrl}`);
      console.log('API Response:', response);

      const jobData = response.data.results[0];
      console.log('Job Data:', jobData);
      let departmentsArray = [];

      if (jobData.specialisms) {
        // Check if jobData.specialisms is not undefined or null
        departmentsArray = jobData.specialisms.split(",").map((value) => ({
          value,
          label: value.trim(), // trim to remove leading/trailing spaces
        }));
      }
      // Convert the UTC date to local date with proper time zone
      // const localApplicationDeadline = new Date(jobData.application_deadline);
      // localApplicationDeadline.setMinutes(localApplicationDeadline.getMinutes() - localApplicationDeadline.getTimezoneOffset());
      // const formattedApplicationDeadline = localApplicationDeadline.toISOString().split('T')[0];
      const applicationDeadlineUTC = new Date(jobData.application_deadline);
      const offsetInMinutes = applicationDeadlineUTC.getTimezoneOffset();
      const localApplicationDeadline = new Date(applicationDeadlineUTC.getTime() - offsetInMinutes * 60000);
      const formattedApplicationDeadline = localApplicationDeadline.toISOString().slice(0, 16);
      
      console.log('Application Deadline:', values.application_deadline);  // This logs the previous state
      console.log('Formatted Deadline:', formattedApplicationDeadline);
      setFormData({
        ...values,
      
        job_title: jobData.job_title,
        job_description: jobData.job_description,
        email: jobData.email,
        username: jobData.username,
        career: jobData.career,
        experience: jobData.experience,
        gender: jobData.gender,
        city: jobData.city,
        // application_deadline: new Date(jobData.application_deadline).toISOString().split('T')[0], // convert and format the date
        application_deadline: formattedApplicationDeadline,
        job_description: jobData.job_description,
        specialisms: departmentsArray.map(department => department.value),
        salary: jobData.salary,
        industry: jobData.industry,
        job_type: jobData.job_type,
        qualification: jobData.qualification,
        address: jobData.address,
        jobId: jobIdFromUrl,
      });
      setSelectedDepartments(departmentsArray);

    } catch (error) {
      console.error('Error fetching job data:', error);
    }
  };

  // Check if jobIdFromUrl is available and fetch data
  if (jobIdFromUrl) {
    fetchData();
  }
}, [router]);

//////////////////////////////////
  const formRef = useRef(null);
  const successMessageRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState("");

  const scrollToSuccessMessage = () => {
    if (successMessageRef.current) {
      window.scrollTo({
        top: successMessageRef.current.offsetTop,
        behavior: 'smooth',
      });
    } else if (formRef.current) {
      window.scrollTo({
        top: formRef.current.offsetTop,
        behavior: 'smooth',
      });
    }
  };


  useEffect(() => {
    if (successMessage) {
      scrollToSuccessMessage();

      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  const [values, setFormData] = useState({
    job_title: "",
    job_description: "",
    email: "",
    username: "",
    specialisms: "",
    job_type: "",
    salary: "",
    career: "",
    experience: "",
    gender: "",
    industry: "",
    qualification: "",
    application_deadline: "",
    city: "",
    address: "",
    account_id: userId ,

  });
  const [errors, setErrors] = useState({
    job_title: "",
    job_description: "",
    email: "",
    username: "",
    specialisms: "",
    job_type: "",
    salary: "",
    career: "",
    experience: "",
    gender: "",
    industry: "",
    qualification: "",
    application_deadline: "",
    city: "",
    address: "",
    account_id: userId,
  });
  // const handleDateChange = (date) => {
  //   setFormData((prevData) => ({ ...prevData, application_deadline: date }));
  //   setIsDatePickerOpen(false);
  // };
  // const handleInputchange = (event) => {
  //   const { name, value } = event.target;
  
  //   if (name === "application_deadline") {
  //     const formattedDateTime = value.replace(" ", "T");
  //     setFormData((prevData) => ({ ...prevData, [name]: formattedDateTime }));
  //   } else {
  //     setFormData((prevData) => ({ ...prevData, [name]: value }));
  //   }
  // };
  // const handleInputchange = (event) => {
  //   const { name, value } = event.target;
  
  //   if (name === "application_deadline") {
  //     // Ensure that the date is in the correct format for datetime-local input
  //     // Convert the provided date string to a Date object
  //     const selectedDate = new Date(value);
  
  //     // Subtract the timezone offset to adjust the date to the correct local time
  //     const offsetInMinutes = selectedDate.getTimezoneOffset();
  //     const adjustedDate = new Date(selectedDate.getTime() - offsetInMinutes * 60000);
  
  //     // Format the adjusted date to a string with the desired format (including time)
  //     const formattedDate = adjustedDate.toISOString().slice(0, 16);
  
  //     // Set the formatted date in the state
  //     setFormData((prevData) => ({ ...prevData, [name]: formattedDate }));
  //   } else {
  //     setFormData((prevData) => ({ ...prevData, [name]: value }));
  //   }
  // };
  
  
  
  
  
  const handleSelectChange = (selectedOptions) => {
    // Extracting only the values from the selected options
    const selectedValues = selectedOptions.map(option => option.value);

    setFormData((prevData) => ({ ...prevData, specialisms: selectedValues }));
  };
  const handlesubmit = async (event) => {
    event.preventDefault();

   
  // Convert selected options to an array of strings
  const selectedSpecialisms = selectedDepartments.map(option => option.value);

  // Update the formData with the selected specialisms
  setFormData(prevData => ({
    ...prevData,
    specialisms: selectedSpecialisms
  }));

  setIsSubmitting(true);
    const newErrors = {};
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!values.job_title || values.job_title.trim() === "") {
      newErrors.job_title = "Job title is required";
    }
    if (!values.job_description || values.job_description.trim() === "") {
      newErrors.job_description = "Job description is required";
    }
    if (!values.email || values.email.trim() === "") {
      newErrors.email = "Email is required";
    }

    if (!values.username || values.username.trim() === "") {
      newErrors.username = "username is required";
    }
    if (!values.specialisms || values.specialisms.length === 0) {
      newErrors.specialisms = "Specialisms is required";
    }

    if (!values.job_type || values.job_type.trim() === "") {
      newErrors.job_type = "job type is required";
    }
    if (!values.salary || values.salary.trim() === "") {
      newErrors.salary = "salary is required";
    }
    if (!values.career || values.career.trim() === "") {
      newErrors.career = "career is required";
    }
    if (!values.experience || values.experience.trim() === "") {
      newErrors.experience = "experience is required";
    }
    if (!values.gender || values.gender.trim() === "") {
      newErrors.gender = "gender is required";
    }
    if (!values.industry || values.industry.trim() === "") {
      newErrors.industry = "industry is required";
    }
    if (!values.qualification || values.qualification.trim() === "") {
      newErrors.qualification = "qualification is required";
    }
    if (!values.application_deadline || values.application_deadline.trim() === "") {
      newErrors.application_deadline = "application_deadline is required";
    }
    if (!values.city || values.city.trim() === "") {
      newErrors.city = "city is required";
    }
    if (!values.address || values.address.trim() === "") {
      newErrors.address = "address is required";
    }
    // Update the state with errors
    setErrors(newErrors);

    // If there are any errors, stop form submission

    // If there are any errors, stop form submission
    if (Object.keys(newErrors).length > 0) {
      // Focus on the first error or handle it as needed
      return;
    }
    const formDataToSend = new FormData();
    formDataToSend.append('account_id', values.account_id);
 // Append department names to formDataToSend
// Ensure specialisms is an array of department names
const specialismValues = Array.isArray(values.specialisms) ? values.specialisms.map(option => option.value) : [values.specialisms];

// Append department names to formDataToSend
specialismValues.forEach((specialism, index) => {
  formDataToSend.append(`specialisms[${index}]`, specialism);
});



    try {
      const response = await axios.post('http://localhost:8080/job-description', values);

      if (response.status === 200) {
        setSuccessMessage('Job posted successfully!');
      } else {
        // Set error message on API request failure
        setErrorMessage('Error: Unable to post job.');
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
        setErrorMessage(`Error: ${error.response.data.error}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from the server');
        setErrorMessage('Error: No response received from the server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up the request:', error.message);
        setErrorMessage(`Error: ${error.message}`);
      }  
    
      // Reset form submission status
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false); // Reset form submission status
    }

  };
  const specialisms = [
    { value: "Banking", label: "Banking" },
    { value: "Digital & Creative", label: "Digital & Creative" },
    { value: "Retail", label: "Retail" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Managemnet", label: "Managemnet" },
    { value: "Accounting & Finance", label: "Accounting & Finance" },
    { value: "Digital", label: "Digital" },
    { value: "Creative Art", label: "Creative Art" },
  ];
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
  
  const [activeAt, setActiveAt] = useState(null);
  const [expireAt, setExpireAt] = useState(null);
  
  const fetchActiveExpireDates = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/Application_deadline/${userId}`);
      console.log("API Response:", response);
  
      const packageInfo = response.data.packageInfo[0];
  
      // Check if Active_at and Expire_At properties exist
      if (!('Active_at' in packageInfo) || !('Expire_At' in packageInfo)) {
        console.error('Active_at or Expire_At is missing in packageInfo.');
        return;
      }
  
      const activeAtDate = new Date(packageInfo.Active_at);
      const expireAtDate = new Date(packageInfo.Expire_At);
  
      setActiveAt(activeAtDate);
      setExpireAt(expireAtDate);
  
      console.log('Active_at:', activeAtDate);
      console.log('Expire_At:', expireAtDate);
  
    } catch (error) {
      console.error('Error fetching active and expire dates:', error.message);
      // Handle the error accordingly
    }
  };
  
  
  

  
  
  const handleInputchange = (event) => {
    const { name, value } = event.target;
  
    if (name === 'application_deadline') {
      const selectedDate = new Date(value);
      console.log('Selected Date:', selectedDate);
  
      // Check the time zone offset
      console.log('Timezone Offset:', selectedDate.getTimezoneOffset());
  
      const adjustedSelectedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000);
      console.log('Adjusted Selected Date:', adjustedSelectedDate);
  
      console.log('Active At:', activeAt);
      console.log('Expire At:', expireAt);
  
      // Check if the selected date is valid
      if (!isDateValid(selectedDate, activeAt, expireAt)) {
        // Handle the case where the selected date is invalid
        // For example, you can set an error message or disable form submission
        return;
      }
  
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };
  
  const isDateValid = (date, activeAt, expireAt) => {
    const selectedDate = new Date(date);
    const adjustedSelectedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000);
  
    if (activeAt === null || expireAt === null || isNaN(adjustedSelectedDate.getTime())) {
      console.log('Active or Expire date is null or invalid.');
      setErrors((prevErrors) => ({
        ...prevErrors,
        application_deadline: 'Active or Expire date is null or invalid.',
      }));
      return false;
    }
  
    if (!(adjustedSelectedDate >= activeAt && adjustedSelectedDate <= expireAt)) {
      console.log('Selected date is outside the active range.');
      setErrors((prevErrors) => ({
        ...prevErrors,
        application_deadline: 'Selected date is outside the active range.',
      }));
      return false;
    }
  
    setErrors((prevErrors) => ({
      ...prevErrors,
      application_deadline: '',
    }));
  
    console.log('Selected date is within the active range.');
    return true;
  };

  useEffect(() => {
    if (userId) {
      fetchActiveExpireDates();
    }
  }, [userId]);
  return (
    <div>
        {successMessage && (
    <div ref={successMessageRef}>
      <div className="alert alert-info" role="alert">
        {successMessage}
      </div>
    </div>
  )}
  {errorMessage && (
    <div ref={successMessageRef}>
      <div className="alert alert-danger" role="alert">
        {errorMessage}
      </div>
    </div>
  )}
      <form className="default-form" onSubmit={handlesubmit}>

        <div className="row">

          {/* <!-- Input --> */}
          <div className="form-group col-lg-12 col-md-12">
            <label>Job Title <span className="text-danger">*</span></label>
            <input type="text" name="job_title" placeholder="Title" value={values.job_title} onChange={handleInputchange} />
            {errors.job_title && (
              <div className="error-message text-danger">{errors.job_title}</div>
            )}
          </div>

          {/* <!-- About Company --> */}
          <div className="form-group col-lg-12 col-md-12">
            <label>Job Description <span className="text-danger">*</span></label>
            <textarea type="text" value={values.job_description} name="job_description" placeholder="Spent several years working on sheep on Wall Street. Had moderate success investing in Yugo's on Wall Street. Managed a small team buying and selling Pogo sticks for farmers. Spent several years licensing licorice in West Palm Beach, FL. Developed several new methods for working it banjos in the aftermarket. Spent a weekend importing banjos in West Palm Beach, FL.In this position, the Software Engineer collaborates with Evention's Development team to continuously enhance our current software solutions as well as create new solutions to eliminate the back-office operations and management challenges present" onChange={handleInputchange}></textarea>
            {errors.job_description && (
              <div className="error-message text-danger">{errors.job_description}</div>
            )}
          </div>

          {/* <!-- Input --> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Email Address (optional)</label>
            <input type="text" name="email" value={values.email} placeholder="" onChange={handleInputchange} />
            {errors.email && (
              <div className="error-message text-danger">{errors.email}</div>
            )}
          </div>

          {/* <!-- Input --> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Username <span className="text-danger">*</span></label>
            <input type="text" name="username" value={values.username} placeholder="" onChange={handleInputchange} />
            {errors.username && (
              <div className="error-message text-danger">{errors.username}</div>
            )}
          </div>

          {/* <!-- Search Select --> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Specialisms <span className="text-danger">*</span></label>
            {/* <Select
              isMulti
              name="specialisms"
              options={specialisms}
              className="basic-multi-select"
              classNamePrefix="select"
              onChange={handleSelectChange}
            
            /> */}
                  <Select
          value={selectedDepartments}
          isMulti
          name="specialisms"
          options={specialisms}
          className="basic-multi-select"
          classNamePrefix="select"
          onChange={(selectedOptions) => {
            setSelectedDepartments(selectedOptions);
            handleSelectChange(selectedOptions);
          }}
        />

            {errors.specialisms && (
              <div className="error-message text-danger">{errors.specialisms}</div>
            )}
          </div>

          <div className="form-group col-lg-6 col-md-12">
            <label>Job Type <span className="text-danger">*</span></label>
            <select className="chosen-single form-select" value={values.job_type} name="job_type" onChange={handleInputchange} >
              <option>Select</option>
              <option>Private</option>
              <option>Urgent</option>
              <option>freelancer</option>
              <option>full time</option>
              <option>part time</option>
              <option>temporary</option>
            </select>
            {errors.job_type && (
              <div className="error-message text-danger">{errors.job_type}</div>
            )}
          </div>

          {/* <!-- Input --> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Offered Salary <span className="text-danger">*</span></label>
            <select className="chosen-single form-select" value={values.salary} name="salary" onChange={handleInputchange} >
              <option>Select</option>
              <option>$1500</option>
              <option>$2000</option>
              <option>$2500</option>
              <option>$3500</option>
              <option>$4500</option>
              <option>$5000</option>
            </select>
            {errors.salary && (
              <div className="error-message text-danger">{errors.salary}</div>
            )}
          </div>

          <div className="form-group col-lg-6 col-md-12">
            <label>Career Level <span className="text-danger">*</span></label>
            <select className="chosen-single form-select" name="career" value={values.career} onChange={handleInputchange} >
              <option>Select</option>
              <option>Banking</option>
              <option>Digital & Creative</option>
              <option>Retail</option>
              <option>Human Resources</option>
              <option>Management</option>
            </select>
            {errors.career && (
              <div className="error-message text-danger">{errors.career}</div>
            )}
          </div>

          <div className="form-group col-lg-6 col-md-12">
            <label>Experience <span className="text-danger">*</span></label>
            <select className="chosen-single form-select" name="experience" value={values.experience} onChange={handleInputchange} >
              <option>Select</option>
              <option>Banking</option>
              <option>Digital & Creative</option>
              <option>Retail</option>
              <option>Human Resources</option>
              <option>Management</option>
            </select>
            {errors.experience && (
              <div className="error-message text-danger">{errors.experience}</div>
            )}
          </div>

          <div className="form-group col-lg-6 col-md-12">
            <label>Gender <span className="text-danger">*</span></label>
            <select className="chosen-single form-select" name="gender" value={values.gender} onChange={handleInputchange} >
              <option>Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            {errors.gender && (
              <div className="error-message text-danger">{errors.gender}</div>
            )}
          </div>

          <div className="form-group col-lg-6 col-md-12">
            <label>Category <span className="text-danger">*</span></label>
            <select className="chosen-single form-select" name="industry" value={values.industry} onChange={handleInputchange}>
              <option>Select</option>
              <option>Pathologist</option>
              <option>Histotechnologist</option>
              <option>Cytotechnologist</option>
              <option>Medical Laboratory Technician</option>
              <option>Pathology Assistant</option>
              <option>Clinical Pathologist</option>
              <option>Health</option>
            </select>
            {errors.industry && (
              <div className="error-message text-danger">{errors.industry}</div>
            )}
          </div>

          <div className="form-group col-lg-6 col-md-12">
            <label>Qualification <span className="text-danger">*</span></label>
            <select className="chosen-single form-select" value={values.qualification} name="qualification" onChange={handleInputchange} >
              <option>Select</option>
              <option>Banking</option>
              <option>Digital & Creative</option>
              <option>Retail</option>
              <option>Human Resources</option>
              <option>Management</option>
            </select>
            {errors.qualification && (
              <div className="error-message text-danger">{errors.qualification}</div>
            )}
          </div>

          {/* <!-- Input --> */}
          {/* <div className="form-group col-lg-6 col-md-12">
          <label>Application Deadline Date</label>
          <input type="datetime-local" name="application_deadline" placeholder="06.04.2020" onChange={handleInputchange}  />
        </div> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>Application Deadline Date <span className="text-danger">*</span></label>
            {/* <input
              type="datetime-local"
              name="application_deadline"
              placeholder="MM/DD/YYYY"
              value={values.application_deadline}
              onChange={handleInputchange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="form-control"
              style={inputStyles}
            /> */}
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
  min={(new Date()).toISOString().slice(0, 16)} // Set min to the current date and time
  max={expireAt instanceof Date && !isNaN(expireAt) ? expireAt.toISOString().slice(0, 16) : ''}
/>


            {errors.application_deadline && (
              <div className="error-message text-danger">{errors.application_deadline}</div>
            )}
          </div>

          {/* <div className="form-group col-lg-6 col-md-12">
              <label>Application Deadline Date</label>
              <div className="w-100">
                <DatePicker
                  selected={values.application_deadline}
                  onChange={handleDateChange}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="MM/DD/YYYY"
              // Apply inline style for width
                />
              </div>
            </div> */}


          {/* <!-- Input --> */}
          <div className="form-group col-lg-6 col-md-12">
            <label>City <span className="text-danger">*</span></label>
            <select className="chosen-single form-select" value={values.city} name="city" onChange={handleInputchange} >
              <option>Melbourne</option>
              <option>Pakistan</option>
              <option>Chaina</option>
              <option>Japan</option>
              <option>India</option>
            </select>
            {errors.city && (
              <div className="error-message text-danger">{errors.city}</div>
            )}
          </div>

          {/* <!-- Input --> */}
          <div className="form-group col-lg-12 col-md-12">
            <label>Complete Address <span className="text-danger">*</span></label>
            <input
              type="text"
              name="address"
              value={values.address}
              placeholder="329 Queensberry Street, North Melbourne VIC 3051, Australia."
              onChange={handleInputchange}
            />
            {errors.address && (
              <div className="error-message text-danger">{errors.address}</div>
            )}
          </div>

          {/* <!-- Input --> */}
          {/* <div className="form-group col-lg-6 col-md-12">
          <label>Find On Map</label>
          <input
            type="text"
            name="name"
            placeholder="329 Queensberry Street, North Melbourne VIC 3051, Australia."
          />
        </div> */}

          {/* <!-- Input --> */}
          {/* <div className="form-group col-lg-3 col-md-12">
          <label>Latitude</label>
          <input type="text" name="name" placeholder="Melbourne" />
        </div> */}

          {/* <!-- Input --> */}
          {/* <div className="form-group col-lg-3 col-md-12">
          <label>Longitude</label>
          <input type="text" name="name" placeholder="Melbourne" />
        </div> */}

          {/* <!-- Input --> */}
          {/* <div className="form-group col-lg-12 col-md-12">
          <button className="theme-btn btn-style-three">Search Location</button>
        </div> */}

          {/* <div className="form-group col-lg-12 col-md-12">
          <div className="map-outer">
            <div style={{ height: "420px", width: "100%" }}>
              <Map />
            </div>
          </div>
        </div> */}

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
    </div>
  );
};

export default PostJob;
