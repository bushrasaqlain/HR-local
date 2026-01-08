"use client";

import Link from "next/link";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "next/router";
import { toast } from "react-toastify";

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

    this.setState((prevState) => ({
      values: { ...prevState.values, [name]: value },
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { values } = this.state;
    const { dispatch, router } = this.props;

    const newErrors = {};
    if (!values.email) newErrors.email = "Email is required";
    if (!values.password) {
      newErrors.password = "Password is required";
    } else if (values.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    this.setState({ errors: newErrors });
    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await api.post("/login", values);

      if (!res.data.success) {
        this.setState({ loginError: "Admin has not activated you yet. Please wait!" });
        return;
      }
      sessionStorage.setItem("token", res.data.token);
      const userRes = await api.get("/api/me");
      dispatch(setUser(userRes.data));
      sessionStorage.setItem("userId", userRes.data.userId);
      sessionStorage.setItem("accountType", userRes.data.accountType);
      sessionStorage.setItem("username", userRes.data.username);
      toast.success("Login successfully!");
      router.push("/dashboard-header");
    } catch (err) {
      this.setState({ loginError: "Invalid email or password, please try again." });
    }
  };

  render() {
    const { values, errors, showPassword, loginError } = this.state;

    return (
      <div className="form-inner">
        <h3 className="text-center mb-4">Login to Superio</h3>

        <Form onSubmit={this.handleSubmit}>
          {loginError && <Alert color="danger">{loginError}</Alert>}

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
            {errors.email && <small className="text-danger">{errors.email}</small>}
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
              <InputGroupText role="button" onClick={this.togglePasswordVisibility}>
                <i className={`las ${showPassword ? "la-eye" : "la-eye-slash"}`} />
              </InputGroupText>
            </InputGroup>
            {errors.password && <small className="text-danger">{errors.password}</small>}
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
              color="primary"
              className="w-100 theme-btn btn-style-one"
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
          <div className="text mb-3">
            Don&apos;t have an account?{" "}
            <Link href="/register">
              <span className="signup">Signup</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default connect()(withRouter(FormContent));
