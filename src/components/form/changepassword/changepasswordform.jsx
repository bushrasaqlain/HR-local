"use client";
import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  InputGroup,
  InputGroupText,
  Alert,
} from "reactstrap";
import api from "../../lib/api";

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [message, setMessage] = useState("");

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage("Please fill out all fields.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const res = await api.post("/changepassword", formData);
      setMessage(res.data.message);
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage(err?.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="change-password-wrapper">
      <style jsx global>{`
        .form-control:focus {
          border-color: #36565f !important;
          box-shadow: 0 0 0 0.2rem rgba(54, 86, 95, 0.25) !important;
        }
        .input-group:focus-within .input-group-text {
          border-color: #36565f !important;
        }
      `}</style>
      <Container fluid>
        <Row className="full-height">

          {/* LEFT SIDE IMAGE */}
          <Col md={6} className="left-side d-none d-md-flex">
            <div className="image-box">
              <img
                src="/images/reset1.jpg"
                alt="change password"
              />
            </div>
          </Col>

          {/* RIGHT SIDE FORM */}
          <Col md={6} className="d-flex align-items-center justify-content-center">
            <div className="form-container">
              <Card className="glass-card shadow-lg border-0">
                <CardBody className="p-4 p-md-5">

                  <h3 className="text-center fw-bold mb-2">
                    🔒 Change Password
                  </h3>
                  <p className="text-center text-muted mb-4">
                    Update your password to keep your account secure
                  </p>

                  {message && (
                    <Alert color="info" className="text-center py-2">
                      {message}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {/* SAME FORM (no changes) */}
                    <FormGroup>
                      <Label>Old Password</Label>
                      <InputGroup>
                        <Input
                          name="oldPassword"
                          type={showPassword.old ? "text" : "password"}
                          placeholder="Enter old password"
                          value={formData.oldPassword}
                          onChange={handleInputChange}
                        />
                        <InputGroupText onClick={() => togglePasswordVisibility("old")}>
                          👁
                        </InputGroupText>
                      </InputGroup>
                    </FormGroup>

                    <FormGroup>
                      <Label>New Password</Label>
                      <InputGroup>
                        <Input
                          name="newPassword"
                          type={showPassword.new ? "text" : "password"}
                          placeholder="Enter new password"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                        />
                        <InputGroupText onClick={() => togglePasswordVisibility("new")}>
                          👁
                        </InputGroupText>
                      </InputGroup>
                      <small className="text-muted"> Must be at least 8 characters </small>
                    </FormGroup>

                    <FormGroup>
                      <Label>Confirm Password</Label>
                      <InputGroup>
                        <Input
                          name="confirmPassword"
                          type={showPassword.confirm ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                        />
                        <InputGroupText onClick={() => togglePasswordVisibility("confirm")}>
                          👁
                        </InputGroupText>
                      </InputGroup>
                    </FormGroup>

                    <Button type="submit" className="w-100 mt-3 update-btn">
                      Update Password
                    </Button>
                  </Form>

                </CardBody>
              </Card>
            </div>
          </Col>

        </Row>
      </Container>
    </div>
  );
};

export default ChangePasswordForm;