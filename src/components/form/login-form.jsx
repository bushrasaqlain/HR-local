"use client";

import Link from "next/link";
import LoginWithSocial from "./LoginWithSocial";
import React, { useState, useEffect } from "react"; // Import useEffect
import axios from "axios";

import { toast } from "react-toastify";
import api from "../lib/api.jsx";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../redux/features/user/userSlice.js";
import { useRouter } from "next/router";

const FormContent = () => {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Step 1: State for Remember Me
  const router = useRouter();

  // Step 2: Handle Remember Me Checkbox
  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setLoginError("");

    if (name === "email") {
      if (/\s/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          name: "Email cannot contain white spaces",
        }));
      } else {
        setValues((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === "password") {
      if (/\s/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          password: "Password cannot contain white spaces",
        }));
      } else {
        setValues((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      console.error(`Invalid input field: ${name}`);
    }
  };

  // Step 3: LocalStorage for Remember Me
  const handlesubmit = async (event) => {
    event.preventDefault();
    try {
      const newErrors = {};

      if (!values.email || values.email.trim() === "") {
        newErrors.email = "Email is required";
      }
      if (!values.password || values.password.trim() === "") {
        newErrors.password = "Password is required";
      } else if (values.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        return;
      }

      const res = await api.post("/login", values);
      // const { companyId, userType, userId } = res.data; // Ensure userId is retrieved from response

      // if user is inActive
      if (!res.data.success) {
        setLoginError("Admin has not Active you yet, Please wait!");
        return;
      }
      sessionStorage.setItem("token", res.data.token);
      toast.success("Login successfully!");

      const userData = await api.get("/api/me");
      const data = userData.data;
      // dispatch add the data in the redux store.
      dispatch(setUser(data));

      // localStorage.setItem('companyId', companyId);

      // Store userId in localStorage
      // localStorage.setItem('userId', userId);
      if (data.accountType === "db_admin") {
        router.push("/dashboard-header");
      } else if (data.accountType === "reg_admin") {
        router.push(`/registration-admin-dashboard/employer/`);
      } else if (
        data.accountType === "candidate" ||
        data.accountType === "employer"
      ) {
        router.push(`/${data.accountType}s-dashboard/dashboard/`);
      }

      // Step 4: Store Remember Me state in localStorage
      // if (rememberMe) {
      //   localStorage.setItem('rememberMe', 'true');
      // } else {
      //   localStorage.removeItem('rememberMe');
      // }
    } catch (err) {
      console.log(err);
      setLoginError("Invalid email or password, please try again.");
    }
  };

  // Step 5: Restore Remember Me State
  // useEffect(() => {
  //   const rememberMeStored = localStorage.getItem('rememberMe') === 'true';
  //   if (rememberMeStored !== null) {
  //     setRememberMe(rememberMeStored);
  //   }
  // }, []);

  return (
    <div className="form-inner">
      <h3>Login to Superio</h3>

      <form method="post" onSubmit={handlesubmit}>
        {loginError && (
          <div className="alert alert-danger" role="alert">
            {loginError}
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            type="text"
            name="email"
            placeholder="Email"
            onChange={handleInputChange}
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
          <div className="field-outer d-flex justify-end">
            <a href="#" className="pwd">
              Forgot password?
            </a>
          </div>
        </div>

        <div className="form-group">
          <button
            className="theme-btn btn-style-one"
            type="submit"
            name="log-in"
          >
            Log In
          </button>
        </div>
      </form>

      <div className="bottom-box">
        <div className="text">
          Don't have an account?{" "}
          <Link href="/register">
            <span className="call-modal signup">Signup</span>
          </Link>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        {/* <LoginWithSocial /> */}
      </div>
    </div>
  );
};

export default FormContent;
