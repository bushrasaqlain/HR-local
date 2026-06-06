"use client";

import Link from "next/link";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "next/router";

import {
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  InputGroup,
  InputGroupText,
  Alert,
} from "reactstrap";

import api from "../lib/api.jsx";
import { setUser } from "../../redux/features/user/userSlice.js";

class FormContent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      successMessage: "",
      showPassword: false,
      loginError: "",
      values: {
        email: "",
        password: "",
      },
      errors: {
        email: "",
        password: "",
      },
    };
  }

  togglePasswordVisibility = () => {
    this.setState((prevState) => ({
      showPassword: !prevState.showPassword,
    }));
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;

    this.setState((prevState) => ({
      errors: { ...prevState.errors, [name]: "" },
      loginError: "",
    }));

    // Check for spaces
    if (/\s/.test(value)) {
      this.setState((prevState) => ({
        errors: {
          ...prevState.errors,
          [name]:
            name === "email"
              ? "Email cannot contain white spaces"
              : "Password cannot contain white spaces",
        },
      }));
      return;
    }

    // Real-time validation for password field
    if (name === "password" && value) {
      if (value.length < 8) {
        this.setState((prevState) => ({
          errors: {
            ...prevState.errors,
            password: "Password must be at least 8 characters"
          }
        }));
      } else if (value.length > 50) {
        this.setState((prevState) => ({
          errors: {
            ...prevState.errors,
            password: "Password must be less than 50 characters"
          }
        }));
      } else {
        this.setState((prevState) => ({
          errors: {
            ...prevState.errors,
            password: ""
          }
        }));
      }
    }

    this.setState((prevState) => ({
      values: { ...prevState.values, [name]: value },
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { values } = this.state;
    const { dispatch, router } = this.props;

    const newErrors = {};

    // Email validation
    if (!values.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation for login
    if (!values.password) {
      newErrors.password = "Password is required";
    } else if (values.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (values.password.length > 50) {
      newErrors.password = "Password must be less than 50 characters";
    } else if (/\s/.test(values.password)) {
      newErrors.password = "Password cannot contain spaces";
    }

    this.setState({ errors: newErrors });
    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await api.post("/login", values);

      if (!res.data.success) {
        this.setState({ loginError: res.data.error || "Admin has not activated you yet. Please wait!" });
        return;
      }

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("userId", res.data.userId);
      sessionStorage.setItem("accountType", res.data.accountType);
      sessionStorage.setItem("displayName", res.data.displayName);
      sessionStorage.setItem("userEmail", values.email);
      sessionStorage.setItem("profile_completed", res.data.profile_completed);
      sessionStorage.setItem("has_package", res.data.has_package ? "true" : "false");
      dispatch(setUser(res.data));

      this.setState({ successMessage: "Login successfully!" });
      setTimeout(() => this.setState({ successMessage: "" }), 3000);

      const { accountType, profile_completed } = res.data;
      console.log("LOGIN RESPONSE:", {
        accountType,
        profile_completed,
        has_package: res.data.has_package,
      });

      if (accountType === "candidate") {
        if (profile_completed) {
          router.push("/dashboard-header");
        } else {
          router.push("/candidate-profile");
        }
      } else if (accountType === "employer") {
        const { profile_completed, approval_status } = res.data;

        sessionStorage.setItem("profile_completed", profile_completed);
        sessionStorage.setItem("approval_status", approval_status);

        if (!profile_completed) {
          router.push("/company-profile");
        } else if (approval_status !== "approved") {
          this.setState({
            loginError: "Your profile is under review. Please wait for admin approval."
          });
        } else {
          router.push("/dashboard-header");
        }
      } else {
        router.push("/dashboard-header");
      }

    } catch (err) {
      console.error(err);
      this.setState({ loginError: "Invalid email or password, please try again." });
    }
  };

  render() {
    const { values, errors, showPassword, loginError } = this.state;

    return (
      <div className="form-inner">
        <div className="avatar-circle">
          <i className="las la-user"></i>
        </div>
        <h3 className="text-center mb-4">Login to Superio</h3>

        <Form onSubmit={this.handleSubmit}>
          {this.state.successMessage && (
            <Alert color="success" className="d-flex justify-content-between align-items-center">
              <span>{this.state.successMessage}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => this.setState({ successMessage: "" })}
              />
            </Alert>
          )}

          {loginError && (
            <Alert color="danger" className="d-flex justify-content-between align-items-center">
              <span>{loginError}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => this.setState({ loginError: "" })}
              />
            </Alert>
          )}

          {/* Email */}
          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={values.email}
              onChange={this.handleInputChange}
            />
            {errors.email && (
              <small className="text-danger">{errors.email}</small>
            )}
          </FormGroup>

          {/* Password */}
          <FormGroup>
            <Label>Password</Label>
            <InputGroup>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={values.password}
                onChange={this.handleInputChange}
              />
              <InputGroupText
                role="button"
                onClick={this.togglePasswordVisibility}
              >
                <i
                  className={`las ${showPassword ? "la-eye" : "la-eye-slash"}`}
                />
              </InputGroupText>
            </InputGroup>
            {errors.password && (
              <small className="text-danger">{errors.password}</small>
            )}
          </FormGroup>

          {/* Forgot Password */}
          <FormGroup className="text-end">
            <Link href="/forgot-password" className="pwd">
              Forgot password?
            </Link>
          </FormGroup>

          {/* Submit */}
          <FormGroup>
            <Button
              className="w-100 theme-btn"
              type="submit"
            >
              Log In
            </Button>
          </FormGroup>
        </Form>

        {/* Bottom */}
        <div className="bottom-box text-center mt-4">
          <div className="divider my-3">
            <span>or</span>
          </div>
          <div className="bottom-text mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="signup">
              Signup
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default connect()(withRouter(FormContent));