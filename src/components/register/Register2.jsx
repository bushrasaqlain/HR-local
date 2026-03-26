"use client";

import React from "react";
import { Card, CardBody, CardTitle, Row, Col } from "reactstrap";
import FormContent from "./FormContent";
import Link from "next/link";

const Register2 = ({ setShowNext, setUserId, setAccountType }) => {

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

      <Col  className="justify-content-center d-flex overflow-hidden rounded-5" 
  lg="8" 
  md="10" 
  sm="12">
         <Card className="register-card w-75 rounded-5">
        <CardBody>
          <CardTitle tag="h3" className="m-5 text-center">
            Create a Free Superio Account
          </CardTitle>

        <FormContent
  setShowNext={setShowNext}
  setUserId={setUserId}
  setAccountType={setAccountType}
/>

          <div className="mt-5 text-center">
            Already have an account?{" "}
            <Link href="/?page=login">
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
