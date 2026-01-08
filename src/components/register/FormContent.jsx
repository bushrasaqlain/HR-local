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
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      errors: {},
      successMessage: "",
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

    if (name === "username" && !/^[A-Za-z0-9\s]+$/.test(value)) {
      this.setState((prev) => ({
        errors: {
          ...prev.errors,
          username: "Username can only contain letters and numbers",
        },
      }));
    }
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

    if (!values.username.trim())
      validationErrors.username = "Username is required";
    if (!values.email.trim())
      validationErrors.email = "Email is required";
    if (!values.password.trim())
      validationErrors.password = "Password is required";
    if (values.password.length < 8)
      validationErrors.password = "Password must be at least 8 characters";
    if (values.password !== values.confirmPassword)
      validationErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(validationErrors).length > 0) {
      this.setState({ errors: validationErrors });
      return;
    }

    const emailExists = await this.checkEmailExists(values.email);
    if (emailExists) {
      this.setState({
        errors: { email: "Email already exists" },
      });
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) =>
        formData.append(key, value)
      );
      formData.append("accountType", accountType);
      formData.append("isActive", "InActive");

      const res = await axios.post(this.apiBaseUrl, formData);

      if (res.status === 201) {
        this.props.setUserId(res.data.insertId);
        this.setState({ successMessage: "Registration successful!" });
        this.props.setShowNext(true);
      }
    } catch (err) {
      console.error(err);
      this.setState({
        successMessage: "Registration failed. Try again.",
      });
    }
  };

  render() {
    const {
      accountType,
      values,
      errors,
      successMessage,
      showPassword,
      showConfirmPassword,
    } = this.state;

    return (
      <div>
        {successMessage && <Alert color="success">{successMessage}</Alert>}

        <Form onSubmit={this.handleSubmit}>
          <div className="d-flex mb-3">
            <Button
              color={accountType === "candidate" ? "secondary" : "transparent"}
              outline={accountType !== "candidate"}
              className="me-2 w-50"
              onClick={() => this.setState({ accountType: "candidate" })}
            >
              Candidate
            </Button>

            <Button
              color={accountType === "employer" ? "secondary" : "transparent"}
              outline={accountType !== "employer"}
              className="w-50"
              onClick={() => this.setState({ accountType: "employer" })}
            >
              Employer
            </Button>
          </div>

          <FormGroup>
            <Label>Username</Label>
            <Input
              name="username"
              value={values.username}
              onChange={this.handleChange}
              invalid={!!errors.username}
            />
            <FormFeedback>{errors.username}</FormFeedback>
          </FormGroup>

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
              <Button outline onClick={() => this.togglePassword("password")}>
                {showPassword ? "Hide" : "Show"}
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
                onClick={() => this.togglePassword("confirmPassword")}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </Button>
              <FormFeedback>{errors.confirmPassword}</FormFeedback>
            </InputGroup>
          </FormGroup>

          <Button type="submit" className="w-100 p-2 mt-2" color="dark">
            Register
          </Button>
        </Form>
      </div>
    );
  }
}

export default FormContent;
