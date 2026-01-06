"use client";

import React, { useState, useRef } from "react";
import { Form, FormGroup, Label, Input, Button, FormFeedback, Alert, InputGroup } from "reactstrap";
import axios from "axios";

const FormContent = ({ setShowNext, setUserId }) => {
  const [accountType, setAccountType] = useState("candidate");
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + "account";

  const togglePassword = (field) => {
    if (field === "password") setShowPassword(!showPassword);
    if (field === "confirmPassword") setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "username" && !/^[A-Za-z0-9\s]+$/.test(value)) {
      setErrors((prev) => ({
        ...prev,
        username: "Username can only contain letters and numbers",
      }));
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const res = await axios.get(`${apiBaseUrl}/email?email=${email}`);
      return res.data.exists;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};

    if (!values.username.trim()) validationErrors.username = "Username is required";
    if (!values.email.trim()) validationErrors.email = "Email is required";
    if (!values.password.trim()) validationErrors.password = "Password is required";
    if (values.password.length < 8) validationErrors.password = "Password must be at least 8 characters";
    if (values.password !== values.confirmPassword) validationErrors.confirmPassword = "Passwords do not match";

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const emailExists = await checkEmailExists(values.email);
    if (emailExists) {
      setErrors({ ...validationErrors, email: "Email already exists" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("confirmPassword", values.confirmPassword);
      formData.append("accountType", accountType);
      formData.append("isActive", "InActive");

      const res = await axios.post(apiBaseUrl, formData);
      if (res.status === 201) {
        setUserId(res.data.insertId);
        setSuccessMessage("Registration successful!");
        setShowNext(true);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage("Registration failed. Try again.");
    }
  };

  return (
    <div>
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      <Form onSubmit={handleSubmit}>
        <div className="d-flex mb-3">
          <Button
            variant={accountType === "candidate" ? "primary" : "outline-secondary"}
            className="me-2 w-50"
            onClick={() => setAccountType("candidate")}
          >
            Candidate
          </Button>
          <Button
            variant={accountType === "employer" ? "primary" : "outline-secondary"}
            className="w-50"
            onClick={() => setAccountType("employer")}
          >
            Employer
          </Button>
        </div>

        <FormGroup className="mb-3">
          <Label>Username</Label>
          <Input
            type="text"
            placeholder="Enter username"
            name="username"
            value={values.username}
            onChange={handleChange}
            invalid={!!errors.username}
          />
          {errors.username && <FormFeedback>{errors.username}</FormFeedback>}
        </FormGroup>

        <FormGroup className="mb-3">
          <Label>Email Address</Label>
          <Input
            type="email"
            placeholder="Enter Email"
            name="email"
            value={values.email}
            onChange={handleChange}
            invalid={!!errors.email}
          />
          {errors.email && <FormFeedback>{errors.email}</FormFeedback>}
        </FormGroup>

        <FormGroup className="mb-3">
          <Label>Password</Label>
          <InputGroup>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              value={values.password}
              onChange={handleChange}
              invalid={!!errors.password} // use invalid instead of isInvalid
            />
            <Button
              color="secondary"
              outline
              onClick={() => togglePassword("password")}
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
            {errors.password && <FormFeedback>{errors.password}</FormFeedback>}
          </InputGroup>
        </FormGroup>

        <FormGroup className="mb-3">
          <Label>Confirm Password</Label>
          <InputGroup>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              invalid={!!errors.confirmPassword} // use invalid instead of isInvalid
            />
            <Button
              color="secondary"
              outline
              onClick={() => togglePassword("confirmPassword")}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </Button>
            {errors.confirmPassword && <FormFeedback>{errors.confirmPassword}</FormFeedback>}
          </InputGroup>
        </FormGroup>


        <Button type="submit" className="w-100" variant="success">Register</Button>
      </Form>
    </div>
  );
};

export default FormContent;
