"use client";

import React from "react";
import { Card, CardBody, CardTitle, Row, Col } from "reactstrap";
import FormContent from "./FormContent";
import Link from "next/link";

const Register2 = ({ setShowNext, setUserId }) => {
  return (
    <Row className="justify-content-center mt-5">
      <Col>
        <Card className="shadow-sm">
          <CardBody>
            <CardTitle tag="h3" className="mb-4 text-center">
              Create a Free Superio Account
            </CardTitle>

            {/* Registration Form */}
            <FormContent setShowNext={setShowNext} setUserId={setUserId} />

            {/* Bottom Box */}
            <div className="mt-3 text-center">
              <p>
                Already have an account?{" "}
                <Link href="/login" passHref>
                  <span style={{ color: "#0d6efd", cursor: "pointer" }}>Log In</span>
                </Link>
              </p>
            </div>

          
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default Register2;
