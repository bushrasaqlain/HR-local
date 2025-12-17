"use client"

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const FormContent = ({ setShowNext, setUserId }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "account";

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword((prev) => !prev);
    } else if (field === "confirmPassword") {
      setShowConfirmPassword((prev) => !prev);
    }
  };

  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "candidate",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const router = useRouter();

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.get(
        `${apiBaseUrl}/email?email=${email}`
      );
      return response.data.exists; // Assuming the response has an 'exists' field
    } catch (error) {
      console.error("Error checking email existence:", error);
      return false; // Return false in case of an error or no response
    }
  };

  // const checkNameExists = async (name) => {
  //   try {
  //     const response = await axios.get(
  //       `${apiBaseUrl}/name?name=${name}`,
  //     );
  //     return response.data.exists; // Assuming the response has an 'exists' field
  //   } catch (error) {
  //     console.error("Error checking email existence:", error);
  //     return false; // Return false in case of an error or no response
  //   }
  // };

  const handleAccountType = (type) => {
    setValues((prev) => ({ ...prev, accountType: type }))
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    // Update the state with the new value
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear the corresponding error when the user starts typing in the field
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "username" && !/^[A-Za-z\s]+$/.test(value)) {
      // If username contains anything other than letters, set an error
      setErrors((prev) => ({
        ...prev,
        username: "Username can only contain letters (no numbers or special characters)",
      }));
    } else {
      // If valid, clear the error
      setErrors((prev) => ({ ...prev, username: "" }));
    }


  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("username", values.username);

    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("confirmPassword", values.confirmPassword);
    formData.append("accountType", values.accountType);
    formData.append("isActive", "InActive");

    let emailExists = false;
    try {
      emailExists = await checkEmailExists(values.email);
    } catch (err) {
      // ignore the error and continue if API returned 404 or failed
      emailExists = false;
    }

    if (emailExists) {
      setErrors((prev) => ({
        ...prev,
        email: "Email already exists in the database. Please use a different email."
      }));
      return; // Stop form submission
    }

    // let NameExists = false;
    // try {
    //     NameExists = await checkNameExists(values.username);
    // } catch (err) {
    //   NameExists = false; // ignore the error and continue if API returned 404 or failed
    // }
    //     if (NameExists) {
    //       // If the username exists, set an error message and prevent form submission
    //       setErrors((prev) => ({
    //         ...prev,
    //         username: "Username already exists. Please use a different username.",
    //       }));
    //       return; // Stop form submission
    //     }

    const newErrors = {};

    if (!values.username || values.username.trim() === "") {
      newErrors.username = "Username is required";
    }
    // if (!values.full_name || values.full_name.trim() === "") {
    //   newErrors.full_name = "Full Name is required";
    // }

    // if (!values.logo || !values.logo.name) {
    //   newErrors.logo = "Company Logo is required";
    // }

    if (!values.email || values.email.trim() === "") {
      newErrors.email = "Email is required";
    }

    if (!values.password || values.password.trim() === "") {
      newErrors.password = "Password is required";
    } else if (values.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!values.confirmPassword || values.confirmPassword.trim() === "") {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!values.accountType) {
      newErrors.accountType = "Account type is required";
    }

    // Update the state with errors
    setErrors(newErrors);

    // If there are any errors, stop form submission
    if (Object.keys(newErrors).length > 0) {
      return;
    }



    try {
      const res = await axios.post(`${apiBaseUrl}`, formData);
      if (res.status === 201) {
     
        setUserId(res.data.insertId);
        // setSuccessMessage("Registration process is completed successfully!");

        // Scroll to the success message after registration
        scrollToSuccessMessage();

        // Reset form fields after successful registration
        setValues({
          username: "",
          // full_name: "",
          email: "",
          password: "",
          confirmPassword: "",
          accountType: "candidate",
        });
        setShowNext(true);
        setErrors({});
        //logoHandler(null);
      } else {
        setSuccessMessage("Error: unable to register the user, try again.");
      }
    } catch (err) {
      console.err(err);
    }
  };

  const formRef = useRef(null);
  const successMessageRef = useRef(null);

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
      setShowNext(true);
    }
  }, [successMessage]);

  const inputStyles = {
    height: '3.5rem',
    position: 'relative',
    width: '100%',
    display: 'block',
    lineHeight: '30px',
    padding: '15px 20px',
    fontSize: '15px',
    color: '#696969',
    backgroundColor: '#f0f5f7',
    border: '1px solid #f0f5f7',
    WebkitBoxSizing: 'border',

    boxSizing: 'border-box',
    borderRadius: '8px',
  };


  return (
    <div>
      {successMessage && (
        <div ref={successMessageRef}>
          <div className="alert alert-info" role="alert">
            {successMessage}
          </div>
        </div>
      )}
        <form method="post" action="add-parcel.html" onSubmit={handleSubmit} encType="multipart/form-data" ref={formRef}>

        <div className="form-group d-flex">
          <button
            type="button"
            className={`theme-btn btn-style-four ${values.accountType === "candidate" ? "btn-style-afterclick" : ""}`}
            onClick={() => handleAccountType("candidate")}
          >
            <i className="la la-user"></i> Candidate
          </button>

          <button
            type="button"
            className={`theme-btn btn-style-four ${values.accountType === "employer" ? "btn-style-afterclick" : ""}`}
            onClick={() => handleAccountType("employer")}
          >
            <i className="la la-briefcase"></i> Employer
          </button>
        </div>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter Username"
            onChange={handleInputChange}
            value={values.username} // Add this line to ensure the input value is controlled
          />

          {/* Display error message if present */}
          {errors.username && (
            <div className="error-message text-danger">{errors.username}</div>
          )}
        </div>
        {/* <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            placeholder="Enter Full Name"
            onChange={handleInputChange}
            value={values.full_name} // Add this line to ensure the input value is controlled
          />
          {errors.full_name && (
            <div className="error-message text-danger">{errors.full_name}</div>
          )}
        </div>
        <div className="form-group">
          <label>Image </label>
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
          {errors.logo && (
            <div className="error-message text-danger">{errors.logo}</div>
          )}
        </div> */}

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            onChange={handleInputChange}
            value={values.email} // Add this line to ensure the input value is controlled
          />
          {errors.email && (
            <div className="error-message text-danger">{errors.email}</div>
          )}
        </div>
        <div className="form-group">
          <label>Password</label>
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleInputChange}
              value={values.password} // Add this line to ensure the input value is controlled
            />
            <button
              className="btn btn-light eye-icon align-items-stretch "
              onClick={() => togglePasswordVisibility("password")}
              type="button"
            >
              <i
                className={`las ${showPassword ? "la-eye" : "la-eye-slash"}`}
              ></i>
            </button>
          </div>
          {errors.password && (
            <div className="error-message text-danger">{errors.password}</div>
          )}
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <div className="input-group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              onChange={handleInputChange}
              value={values.confirmPassword} // Add this line to ensure the input value is controlled
            />
            <button
              className="btn btn-light eye-icon align-items-stretch "
              onClick={() => togglePasswordVisibility("confirmPassword")}
              type="button"
            >
              <i
                className={`las ${showConfirmPassword ? "la-eye" : "la-eye-slash"}`}
              ></i>
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="error-message text-danger">
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <div className="form-group">
          <button className="theme-btn btn-style-one" type="submit">
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormContent;
