"use client";

import React from "react";
import { Card, CardBody, CardTitle, Row, Col } from "reactstrap";
import FormContent from "./FormContent";
import Link from "next/link";

const Register2 = ({ setShowNext, setUserId }) => {
  return (
    
    <Row
  className="justify-content-center mt-5 p-5 mb-5"
  style={{
    backgroundImage: "url('/images/background/bg-1.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    minHeight: "100vh"
  }}
>

      <Col>
         <Card className="register-card">
        <CardBody>
          <CardTitle tag="h3" className="m-4 text-center">
            Create a Free Superio Account
          </CardTitle>

          <FormContent setShowNext={setShowNext} setUserId={setUserId} />

          <div className="mt-5 text-center">
            Already have an account?{" "}
            <Link href="/login">
              <span className="login-link">Log In</span>
            </Link>
          </div>
        </CardBody>
      </Card>
      </Col>
    </Row>
  );
};

export default Register2;
