"use client";

import React from "react";
import { Card, CardBody, CardTitle, Row, Col } from "reactstrap";
import FormContent from "./FormContent";
import Link from "next/link";

const Register2 = ({ setShowNext, setUserId, setAccountType }) => {

  return (

    <Row
      className="justify-content-center align-items-center"
      style={{
        background: "linear-gradient(135deg, #537785, rgb(169, 209, 214))",
        minHeight: "100vh",
      }}
    >
      <Col lg="4" md="6" sm="10">

        {/* Avatar */}
        <div className="avatar-circle">
          <i className="las la-user"></i>
        </div>

        <div className="form-inner">
          <h3>Create Account</h3>

          <FormContent
            setShowNext={setShowNext}
            setUserId={setUserId}
            setAccountType={setAccountType}
          />

          <div className="bottom-text mt-4">
            Already have an account?{" "}
            <Link href="/login" className="login">
              Log In
            </Link>
          </div>
        </div>

      </Col>
    </Row>
  );
};

export default Register2;
