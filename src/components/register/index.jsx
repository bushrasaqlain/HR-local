"use client";
import { useState, useEffect } from "react";
import Register2 from "./Register2";
import RegisterCompany from "./RegisterCompany";

const Index = () => {
  const [mounted, setMounted] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // render nothing on server

  return (
    <div className="login-section">
      {!showNext && (
        <>
          <div
            className="image-layer"
            style={{ backgroundImage: "url(/images/background/bg-1.png)" }}
          ></div>
          <div className="outer-box">
            <div className="login-form default-form">
              <Register2 setShowNext={setShowNext} setUserId={setUserId} />
            </div>
          </div>
        </>
      )}
      {showNext && (
        <div style={{ width: "65vw" }}>
          <h1
            className="mb-5 mx-auto text-center fw-bold display-5"
            style={{ color: "rgb(78, 77, 114)" }}
          >
            Create your Employer Profile
          </h1>
          <RegisterCompany isRegister={showNext} userId={userId} />
        </div>
      )}
    </div>
  );
};

export default Index;
