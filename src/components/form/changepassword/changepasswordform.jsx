"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    if (oldPassword === newPassword) {
      setMessage("New password must be different from old password.");
      setTimeout(() => setMessage(""), 1500);
      return;
    }

    try {
      const res = await api.post("/changepassword", formData);
      setMessage(res.data.message);
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err?.response?.data?.error || "Something went wrong");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
       backgroundImage: "url(/images/background/bg-1.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={6} md={8}>
            <Card className="shadow-sm border-0 rounded-4">
              <CardBody className="p-4 p-md-5">
                <h4 className="text-center fw-bold mb-2">Change Password</h4>
                <p className="text-center text-muted mb-4">
                  Keep your account secure by updating your password
                </p>

                {message && <Alert color="info" className="text-center py-2">{message}</Alert>}

                <Form onSubmit={handleSubmit}>
                  {/* Old Password */}
                  <FormGroup>
                    <Label for="oldPassword" className="fw-semibold">Old Password</Label>
                    <InputGroup>
                      <Input
                        id="oldPassword"
                        name="oldPassword"
                        type={showPassword.old ? "text" : "password"}
                        placeholder="Enter old password"
                        value={formData.oldPassword}
                        onChange={handleInputChange}
                      />
                      <InputGroupText
                        style={{ cursor: "pointer" }}
                        onClick={() => togglePasswordVisibility("old")}
                      >
                        <i className={`las ${showPassword.old ? "la-eye" : "la-eye-slash"}`} />
                      </InputGroupText>
                    </InputGroup>
                  </FormGroup>

                  {/* New Password */}
                  <FormGroup>
                    <Label for="newPassword" className="fw-semibold">New Password</Label>
                    <InputGroup>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword.new ? "text" : "password"}
                        placeholder="Enter new password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                      />
                      <InputGroupText
                        style={{ cursor: "pointer" }}
                        onClick={() => togglePasswordVisibility("new")}
                      >
                        <i className={`las ${showPassword.new ? "la-eye" : "la-eye-slash"}`} />
                      </InputGroupText>
                    </InputGroup>
                    <small className="text-muted">Must be at least 8 characters</small>
                  </FormGroup>

                  {/* Confirm Password */}
                  <FormGroup>
                    <Label for="confirmPassword" className="fw-semibold">Confirm Password</Label>
                    <InputGroup>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword.confirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                      />
                      <InputGroupText
                        style={{ cursor: "pointer" }}
                        onClick={() => togglePasswordVisibility("confirm")}
                      >
                        <i className={`las ${showPassword.confirm ? "la-eye" : "la-eye-slash"}`} />
                      </InputGroupText>
                    </InputGroup>
                  </FormGroup>

                  {/* Submit */}
                  <Button type="submit" color="primary" size="lg" className="w-100 rounded-3">
                    Update Password
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ChangePasswordForm;
