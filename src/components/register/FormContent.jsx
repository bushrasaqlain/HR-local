"use client";

import React, { Component } from "react";
import {
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  FormFeedback,
  Alert,
  InputGroup,
} from "reactstrap";
import axios from "axios";

class FormContent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accountType: "candidate",
      values: {
        // username: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      errors: {},
      successMessage: "",
      errorMessage: "",
      showPassword: false,
      showConfirmPassword: false,
    };

    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "account";
  }

  togglePassword = (field) => {
    if (field === "password") {
      this.setState((prev) => ({ showPassword: !prev.showPassword }));
    }
    if (field === "confirmPassword") {
      this.setState((prev) => ({
        showConfirmPassword: !prev.showConfirmPassword,
      }));
    }
  };

  handleChange = (e) => {
    const { name, value } = e.target;

    this.setState((prev) => ({
      values: { ...prev.values, [name]: value },
      errors: { ...prev.errors, [name]: "" },
    }));

    // if (name === "username" && !/^[A-Za-z0-9\s]+$/.test(value)) {
    //   this.setState((prev) => ({
    //     errors: {
    //       ...prev.errors,
    //       username: "Username can only contain letters and numbers",
    //     },
    //   }));
    // }
  };

  checkEmailExists = async (email) => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}/email?email=${email}`);
      return res.data.exists;
    } catch {
      return false;
    }
  };

handleSubmit = async (e) => {
  e.preventDefault();

  const { values, accountType } = this.state;
  const validationErrors = {};

  if (!values.email.trim()) validationErrors.email = "Email is required";
  if (!values.password.trim()) validationErrors.password = "Password is required";
  if (values.password.length < 8) validationErrors.password = "Password must be at least 8 characters";
  if (values.password !== values.confirmPassword) validationErrors.confirmPassword = "Passwords do not match";

  if (Object.keys(validationErrors).length > 0) {
    this.setState({ errors: validationErrors });
    return;
  }

  try {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value));
    formData.append("accountType", accountType);
    formData.append("isActive", "Inactive");

    const res = await axios.post(this.apiBaseUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data && res.data.success) {
      this.props.setUserId?.(res.data.accountId);
      this.props.setAccountType?.(accountType);
      this.setState({ successMessage: "Registration successful! Please check your email to verify.", errorMessage: "" });
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } else {
      this.setState({ errorMessage: res.data?.error || "Registration failed.", successMessage: "" });
    }
  } catch (err) {
    const msg = err.response?.data?.error || "Registration failed. Try again.";
    // Check for duplicate email from backend
    if (err.response?.status === 409 || msg.toLowerCase().includes("already exists")) {
  this.setState({ 
    errors: { email: "An account with this email already exists." }, 
    errorMessage: "An account with this email already exists.",  // ← add this
    successMessage: "" 
  });
} else {
  this.setState({ errorMessage: msg, successMessage: "" });
}
  }
};

  render() {
    const {
      accountType,
      values,
      errors,
      successMessage,
      errorMessage,
      showPassword,
      showConfirmPassword,
    } = this.state;

    return (
      <div>
        {successMessage && <Alert color="success">{successMessage}</Alert>}
        {errorMessage && <Alert color="danger">{errorMessage}</Alert>}

        <Form onSubmit={this.handleSubmit}>
          <div className="d-flex mb-3">
            <Button
              className={`me-2 w-50 ${accountType === "candidate" ? "account-type-btn" : "account-type-btn outline"
                }`}
              onClick={() => this.setState({ accountType: "candidate" })}
            >
              Candidate
            </Button>

            <Button
              className={`w-50 ${accountType === "employer" ? "account-type-btn" : "account-type-btn outline"
                }`}
              onClick={() => this.setState({ accountType: "employer" })}
            >
              Employer
            </Button>
          </div>

          {/* <FormGroup>
            <Label>Username</Label>
            <Input
              name="username"
              value={values.username}
              onChange={this.handleChange}
              invalid={!!errors.username}
            />
            <FormFeedback>{errors.username}</FormFeedback>
          </FormGroup> */}

          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              value={values.email}
              onChange={this.handleChange}
              invalid={!!errors.email}
            />
            <FormFeedback>{errors.email}</FormFeedback>
          </FormGroup>

          <FormGroup>
            <Label>Password</Label>
            <InputGroup>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={values.password}
                onChange={this.handleChange}
                invalid={!!errors.password}
              />
              <Button
                outline
                type="button"
                onClick={() => this.togglePassword("password")}
              >
                <i className={`las ${showPassword ? "la-eye-slash" : "la-eye"}`}></i>
              </Button>
              <FormFeedback>{errors.password}</FormFeedback>
            </InputGroup>
          </FormGroup>

          <FormGroup>
            <Label>Confirm Password</Label>
            <InputGroup>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={this.handleChange}
                invalid={!!errors.confirmPassword}
              />
              <Button
                outline
                type="button"
                onClick={() => this.togglePassword("confirmPassword")}
              >
                <i className={`las ${showConfirmPassword ? "la-eye-slash" : "la-eye"}`}></i>
              </Button>
              <FormFeedback>{errors.confirmPassword}</FormFeedback>
            </InputGroup>
          </FormGroup>

          <Button type="submit" className="theme-btn w-100 mt-3">
            Register
          </Button>
        </Form>
      </div>
    );
  }
}

export default FormContent;
