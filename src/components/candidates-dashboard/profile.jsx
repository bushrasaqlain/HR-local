"use client"
import Select from "react-select";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setLogoUsername } from "../../../features/user/userSlice";
import api from "../../../lib/api";
import { toast } from "react-toastify";
// import LogoUpload from "./LogoUpload";
const FormInfoBox = () => {
  const [formData, setFormData] = useState({
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
  });
  const dispatch = useDispatch();

  const [errors, SetErrors] = useState({});

  const [logoImg, setLogoImg] = useState("");
  const [isNewImageUploaded, setIsNewImageUploaded] = useState(false);
  // const [imgName, setImgName] = useState("");
  // const [image, setImage] = useState("");

  // const [logoImg, setLogoImg] = useState("");
  useEffect(() => {
    // Watch for changes in logoImg and update formData.logo
    if (isNewImageUploaded) {
      setFormData((prevData) => ({ ...prevData, logo: logoImg }));
    }
  }, [logoImg, isNewImageUploaded]);
  const logoHandler = (file) => {
    if (file) {
      setIsNewImageUploaded(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prevData) => ({
          ...prevData,
          logo: reader.result,
          logoName: file.name,
        }));
      };
      reader.readAsDataURL(file);

      // Clear the file input value
      const logoInput = document.getElementById("upload");
      if (logoInput) {
        logoInput.value = null;
      }
    } else {
      setIsNewImageUploaded(false);
      setFormData((prevData) => ({
        ...prevData,
        logo: "",
        logoName: "", // Update logoName when no new image is uploaded
      }));
    }
  };

  // if(isNewImageUploaded) {
  //   setLogoUsername({})
  // }

  const fullNameRef = React.createRef();
  const emailRef = React.createRef();
  const phoneRef = React.createRef();
  const logoRef = React.createRef();
  const currentSalaryRef = React.createRef();
  const expectedSalaryRef = React.createRef();
  const experienceRef = React.createRef();
  const ageRef = React.createRef();
  const educationRef = React.createRef();
  const categoriesRef = React.createRef();
  const skillsRef = React.createRef();
  const cityRef = React.createRef();
  const addressRef = React.createRef();
  const LinksRef = React.createRef();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear the error when the user starts typing in the field
    SetErrors((prevErrors) => ({
      ...prevErrors,
      [name]: " ",
    }));
  };

  const handleCategoryChange = (selectedCategories) => {
    const selectedValues = selectedCategories.map((option) => option.value);
    setFormData((prevData) => ({
      ...prevData,
      categories: selectedValues,
    }));
  };
  const handleSkillChange = (selectedSkills) => {
    const selectedValues = selectedSkills.map((option) => option.value);
    setFormData((prevData) => ({
      ...prevData,
      skills: selectedValues,
    }));
  };


    useEffect(() => {
    const fetchUserData = async () => {

      try {
        const response = await api.get(
          `http://localhost:8080/candidateProfile/candidate/`
        );

        const userData = response.data;

        if (userData && Object.keys(userData).length > 0) {
          // // If image exists
          // if (userData.image) {
          //   setLogoImg(userData.image);
          // }

          // Use the image as-is since it's already a base64 string
          const imageDataUrl = `data:image/png;base64,${userData.logo}`;

          // Set form data using backend response
          setFormData({
            fullName: userData.full_name || "",
            phone: userData.Phone || "",
            email: userData.email || "",
            currentSalary: userData.Current_Salary || "",
            expectedSalary: userData.Expected_Salary || "",
            experience: userData.Experience || "",
            age: userData.Age || "",
            education: userData.Education || "",
            categories: Array.isArray(userData.categories) ? userData.categories : [],
            skills: Array.isArray(userData.skills) ? userData.skills : [],
            city: userData.city || "",
            address: userData.complete_address || "",
            description: userData.Description || "",
            logo: imageDataUrl,
            logoName: userData.logo_name || "",
            links: userData.Links ? JSON.parse(userData.Links): [],
            account_id: userData.id,
          });

          setLogoImg(imageDataUrl);
          // setImgName(userData.logo_name || "");
        } else {
          console.warn("User data object is empty for userId:", userId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
        fetchUserData();
    }, [])




    //Handling logoimg state
    // const userImage = async (userId) => {
    //   try {
    //     const response = await axios.get(
    //       `http://localhost:8080/candidateProfile/logo/${userId}`
    //     );
    //     if (
    //       Array.isArray(response.data.jobDetails) &&
    //       response.data.jobDetails.length > 0
    //     ) {
    //       const userinfo = response.data.jobDetails[0];
    //       // setLogoImg(userinfo.logo);
    //       setLogoImg(userinfo.logo);
    //       formData.append("logo", logoImg);
    //     }

    //     console.log("image fetched successfully");
    //   } catch (error) {
    //     console.error("Error fetching image:", error);
    //   }
    // };

    //Fetching logo
    // const userLogo = async (userId) => {
    //   try {
    //     const response = await axios.get(
    //       `http://localhost:8080/candidateProfile/logo/${userId}`
    //     );
    //     if (
    //       Array.isArray(response.data.jobDetails) &&
    //       response.data.jobDetails.length > 0
    //     ) {
    //       const userinfo = response.data.jobDetails[0];
    //       setImage(userinfo.logo);
    //     }
    //   } catch (error) {
    //     console.error("Error fetching image:", error);
    //   }
    // };
    // userLogo(userId);

    // userImage();



  const handleSubmit = async (event) => {
    event.preventDefault();
    // console.log(formData);

    const validationErrors = {};
    // Basic validations
    if (!formData.fullName.trim()) {
      validationErrors.fullName = "fullName is required ";
    }

    // *****************
    //  if (!formData. jobTitle.trim()) {
    //   validationErrors. jobTitle = " jobTitle is required "
    // }
    // *****************
    if (!formData.phone.trim()) {
      validationErrors.phone = "Phone number is required";
    } else if (!/^\d+$/.test(formData.phone)) {
      validationErrors.phone =
        "Phone number must contain only numeric characters";
    } else if (formData.phone.length < 10) {
      validationErrors.phone = "Phone number must be 10 digits long";
    }
    // ******************
    //  if (!formData.email.trim()) {
    //   validationErrors.email = "Email is required "
    // }else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)){
    //   validationErrors.email = "Email is not valid"
    // }
    // *****************
    if (!formData.currentSalary.trim()) {
      validationErrors.currentSalary = " currentSalary is required ";
    }
    // *****************
    if (!formData.expectedSalary.trim()) {
      validationErrors.expectedSalary = " expectedSalary is required ";
    }

    // *****************
    if (!formData.experience.trim()) {
      validationErrors.experience = "  experience is required ";
    }
    // *****************
    if (!formData.age.trim()) {
      validationErrors.age = " age is required ";
    }
    // *****************
    if (!formData.education.trim()) {
      validationErrors.education = "  education is required ";
    }
    // *****************
    //  if (!formData.languages.trim()) {
    //   validationErrors.languages = " languages is required "
    // }
    // *****************
    if (!formData.categories || formData.categories.length === 0) {
      validationErrors.categories = "categories are required";
    }
    //************** */
    if (!formData.skills || formData.skills.length === 0) {
      validationErrors.skills = "skills are required";
    }
    // *****************
    if (!formData.city.trim()) {
      validationErrors.city = " city is required ";
    }
    // *****************
    if (!formData.address.trim()) {
      validationErrors.address = "address is required ";
    }
    
    formData?.links?.map((link) => {
      if(link === "" && !/^https?:f\/\/[^\s]+$/.test(link)) {
        validationErrors.links = "Please enter a valid URL starting with http:// or https://"
      }
    })
    // if (formData.links !== "" && !/^https?:\/\/[^\s]+$/.test(formData.links)) {
    //   validationErrors.links = "Please enter a valid URL starting with http:// or https://";
    // }
    // *****************
    SetErrors(validationErrors); //updating the state

    if (Object.keys(validationErrors).length === 0) {
      try {
        // Continue with form submission if not empty
        const base64toBlob = (base64Data, contentType = 'image/png') => {
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

          const blob = new Blob(byteArrays, { type: contentType });
          return blob;
        };

        const formDataToSend = new FormData();

        // Add image if updated
        if (isNewImageUploaded && formData.logo) {
          const base64Data = formData.logo.split(",")[1];
          const logoBlob = base64toBlob(base64Data, 'image/png');
          formDataToSend.delete("logo");
          formDataToSend.append("logo", logoBlob, formData.logoName);
        }

        // Add all fields from formData
        for (const key in formData) {
          if (key === "categories" || key === "skills" || key === "links") {
            formDataToSend.append(key, JSON.stringify(formData[key]));
          } else {
            formDataToSend.append(key, formData[key] ?? "");
          }
        }
        // // Add logo separately
        // if (logoImg) {
        //   formDataToSend.append("logo", logoImg);
        //   formDataToSend.append("logoName", logoImg.name || "sna");
        // }

        // DEBUG: Log FormData contents properly
        console.log("FormData being sent:");
        for (let pair of formDataToSend.entries()) {
          console.log(`${pair[0]}:`, pair[1]);
        }

        



        // Perform the form submission
        const response = await api.put(
          `http://localhost:8080/candidateProfile/candidate/`,
          formDataToSend,
          // alert("form submitted")
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        // console.log("FormData to Send:", formDataToSend);

        // Check if the submission was successful
        if (response.status === 200) {
          // Set success message
          toast.success("Profile Updated Successfully!");
          // dispatch(setLogoUsername())
        }
      } catch (error) {
        console.error(error);
        toast.success("Profile Updation failed. Please try again.");
      }
    } else {
      // Focus on the first field with an error
      if (validationErrors.fullName) {
        fullNameRef.current.focus();
      } else if (validationErrors.phone) {
        phoneRef.current.focus();
      } else if (validationErrors.email) {
        emailRef.current.focus();
      } else if (validationErrors.logo) {
        logoRef.current.focus();
      } else if (validationErrors.currentSalary) {
        currentSalaryRef.current.focus();
      } else if (validationErrors.expectedSalary) {
        expectedSalaryRef.current.focus();
      } else if (validationErrors.experience) {
        experienceRef.current.focus();
      } else if (validationErrors.age) {
        ageRef.current.focus();
      } else if (validationErrors.education) {
        educationRef.current.focus();
      } else if (validationErrors.categories) {
        categoriesRef.current.focus();
      } else if (validationErrors.skills) {
        skillsRef.current.focus();
      }
      else if (validationErrors.city) {
        cityRef.current.focus();
      } else if (validationErrors.address) {
        addressRef.current.focus();
      }
      else if (validationErrors.links) {
        // Focus on Link if it has an error
        LinksRef.current.focus();
      }
    }
  };

  const catOptions = [
    { value: "Banking", label: "Banking" },
    { value: "Digital & Creative", label: "Digital & Creative" },
    { value: "Retail", label: "Retail" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Managemnet", label: "Managemnet" },
    { value: "Accounting & Finance", label: "Accounting & Finance" },
    { value: "Digital", label: "Digital" },
    { value: "Creative Art", label: "Creative Art" },
  ];
  const skillsOptions = [
    { value: "Banking", label: "Banking" },
    { value: "Digital & Creative", label: "Digital & Creative" },
    { value: "Retail", label: "Retail" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Managemnet", label: "Managemnet" },
    { value: "Accounting & Finance", label: "Accounting & Finance" },
    { value: "Digital", label: "Digital" },
    { value: "Creative Art", label: "Creative Art" },
  ];


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
            />
            <span>{formData.logoName ? formData.logoName : ""}</span>



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
            {logoImg && !logoImg.includes('base64,null') ? (
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
              />)
            }
          </div>
        </div>

        {/*         
        <div className="uploading-outer">
          <img
            alt="avatar"
            // className="thumb rounded-circle"
            className="thumb"
            src={`data:image/png;base64,${image}`}
            width={150}
            height={50}
          />
          <div className="form-group col-lg-6 col-md-12">
            <label>Upload Logo</label>
            <input
              type="file"
              name="logo"
              accept="image/*"
              id="upload"
              // required
              onChange={(e) => logoHandler(e.target.files[0])}
            />
          </div>
        </div> */}

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            placeholder="Jerome"
            onChange={handleInputChange}
            value={formData.fullName}
            ref={fullNameRef}
            required
          />
          {errors.fullName && (
            <span style={{ color: "red" }}>{errors.fullName}</span>
          )}
        </div>

        {/* <!-- Input --> */}
        {/* <div className="form-group col-lg-6 col-md-12">
          <label>Job Title</label>
          <input type="text" name="jobTitle" placeholder="UI Designer"  
         onChange={handleInputChange}
         value={formData.jobTitle}
          />
          {errors.jobTitle && <span style={{ color: "red" }}>{errors.jobTitle}</span>}

        </div> */}

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Phone</label>
          <input
            type="text"
            name="phone"
            placeholder="0 123 456 7890"
            onChange={handleInputChange}
            ref={phoneRef}
            value={formData.phone}
          />
          {errors.phone && <span style={{ color: "red" }}>{errors.phone}</span>}
        </div>

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Email address</label>
          <input
            type="email"
            name="email"
            placeholder="creativelayers"
            onChange={handleInputChange}
            ref={emailRef}
            value={formData.email}
          />
          {errors.email && <span style={{ color: "red" }}>{errors.email}</span>}
        </div>

        {/* <!-- Input --> */}
        {/* <div className="form-group col-lg-6 col-md-12">
          <label>Website</label>
          <input
            type="text"
            name="name"
            placeholder="www.jerome.com"
             
          />
        </div> */}

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Current Salary($)</label>
          <select
            className="chosen-single form-select"
            name="currentSalary"
            onChange={handleInputChange}
            value={formData.currentSalary}
            ref={currentSalaryRef}
          >
            <option>40-70 K</option>
            <option>50-80 K</option>
            <option>60-90 K</option>
            <option>70-100 K</option>
            <option>100-150 K</option>
          </select>
          {errors.currentSalary && (
            <span style={{ color: "red" }}>{errors.currentSalary}</span>
          )}
        </div>

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Expected Salary($)</label>
          <select
            className="chosen-single form-select"
            name="expectedSalary"
            onChange={handleInputChange}
            ref={expectedSalaryRef}
            value={formData.expectedSalary}
          >
            <option>120-350 K</option>
            <option>40-70 K</option>
            <option>50-80 K</option>
            <option>60-90 K</option>
            <option>70-100 K</option>
            <option>100-150 K</option>
          </select>
          {errors.expectedSalary && (
            <span style={{ color: "red" }}>{errors.expectedSalary}</span>
          )}
        </div>

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Experience</label>
          <input
            type="text"
            name="experience"
            onChange={handleInputChange}
            ref={experienceRef}
            value={formData.experience || "0-1 years"} // fallback if empty
          />
          {errors.experience && (
            <span style={{ color: "red" }}>{errors.experience}</span>
          )}
        </div>

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Age</label>
          <select
            className="chosen-single form-select"
            name="age"
            onChange={handleInputChange}
            ref={ageRef}
            value={formData.age}
          >
            <option>23 - 27 Years</option>
            <option>24 - 28 Years</option>
            <option>25 - 29 Years</option>
            <option>26 - 30 Years</option>
          </select>
          {errors.age && <span style={{ color: "red" }}>{errors.age}</span>}
        </div>

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Education</label>
          <input
            type="text"
            name="education"
            placeholder="Certificate"
            onChange={handleInputChange}
            ref={educationRef}
            value={formData.education}
          />
          {errors.education && (
            <span style={{ color: "red" }}>{errors.education}</span>
          )}
        </div>

        {/* <!-- Input --> */}
        {/* <div className="form-group col-lg-6 col-md-12">
          <label>Languages</label>
          <input
            type="text"
            name="languages"
            placeholder="English, Turkish"
            onChange={handleInputChange}
           value={formData.languages} 
          />
           {errors.languages && <span style={{ color: "red" }}>{errors.languages}</span>}

        </div> */}

        {/* <!-- Search Select --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>Categories </label>
          <Select
            // defaultValue={[catOptions[1]]}
            value={formData.categories.map((cat) =>
              catOptions.find((option) => option.value === cat)
            )}
            isMulti
            name="categories"
            options={catOptions}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleCategoryChange}
            ref={categoriesRef}
          />
          {errors.categories && (
            <span style={{ color: "red" }}>{errors.categories}</span>
          )}
        </div>
        <div className="form-group col-lg-6 col-md-12">
          <label>Skills </label>
          <Select
            // defaultValue={[catOptions[1]]}
            value={formData.skills.map((skill) =>
              skillsOptions.find((option) => option.value === skill)
            )}

            isMulti
            name="skills"
            options={skillsOptions}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleSkillChange}
            ref={skillsRef}
          />
          {errors.skills && (
            <span style={{ color: "red" }}>{errors.skills}</span>
          )}
        </div>

        {/* <!-- Input --> */}
        {/* <div className="form-group col-lg-6 col-md-12">
          <label>Allow In Search & Listing</label>
          <select className="chosen-single form-select"  >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div> */}

        

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <label>City</label>
          <select
            className="chosen-single form-select"
            name="city"
            onChange={handleInputChange}
            ref={cityRef}
            value={formData.city}
          >
            <option>Melbourne</option>
            <option>Pakistan</option>
            <option>Chaina</option>
            <option>Japan</option>
            <option>India</option>
          </select>
          {errors.city && <span style={{ color: "red" }}>{errors.city}</span>}
        </div>

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-6">
          <label>Complete Address</label>
          <input
            type="text"
            name="address"
            placeholder="329 Queensberry Street, North Melbourne VIC 3051, Australia."
            onChange={handleInputChange}
            ref={addressRef}
            value={formData.address}
          />
          {errors.address && (
            <span style={{ color: "red" }}>{errors.address}</span>
          )}
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
                ref={LinksRef}
                onChange={(e) => {
                  const newLinks = [...formData.links];
                  newLinks[index] = e.target.value;
                  setFormData((prev) => ({ ...prev, links: newLinks }));
                  const value = e.target.value;
                  if(value.startsWith("https://") || value.startsWith("http://")){
                    SetErrors((prevErr) => {
                      const {links, ...rest} = prevErr;
                      return rest;
                    })
                  } else {
                    SetErrors((prevErr) => ({ ...prevErr, links: "Link must start with http:// or https://" }))
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
          {errors.links && <span className="text-danger" >{errors.links}</span>}
          
        </div>


        {/* <!-- About Company --> */}
        <div className="form-group col-lg-12 col-md-12">
          <label>Description</label>
          <textarea
            name="description"
            onChange={handleInputChange}
            value={formData.description}
            placeholder="Spent several years working on sheep on Wall Street. Had moderate success investing in Yugo's on Wall Street. Managed a small team buying and selling Pogo sticks for farmers. Spent several years licensing licorice in West Palm Beach, FL. Developed several new methods for working it banjos in the aftermarket. Spent a weekend importing banjos in West Palm Beach, FL.In this position, the Software Engineer collaborates with Evention's Development team to continuously enhance our current software solutions as well as create new solutions to eliminate the back-office operations and management challenges present"
          ></textarea>

          {errors.description && (
            <span style={{ color: "red" }}>{errors.description}</span>
          )}
        </div>

        {/* <!-- Input --> */}
        <div className="form-group col-lg-6 col-md-12">
          <button type="submit" className="theme-btn btn-style-one">
            Submit
          </button>
        </div>
      </div>
    </form>
  );
};

export default FormInfoBox;