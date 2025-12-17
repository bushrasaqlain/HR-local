"use client";
import { useState } from "react";
import Register2 from "./Register2";
import RegisterCompany from "./RegisterCompany";

const index = () => {
  const [showNext, setShowNext] = useState(false);
  const [userId, setUserId] = useState(null);
  return (
    <>
      <div className="login-section">
        {!showNext && 
          <>
          <div
          className="image-layer"
          style={{ backgroundImage: "url(/images/background/12.jpg)" }}
        ></div>
        <div className="outer-box">
          {/* <!-- Login Form --> */}
          <div className="login-form default-form">
            <Register2 setShowNext={setShowNext} setUserId={setUserId} />
          </div>
          </div> </>
        }
        {showNext && 
          <div style={{width: "65vw"}}>
            <h1 className="mb-5 mx-auto text-center fw-bold display-5"  style={{ color: "rgb(78, 77, 114)" }}>Create your Employer Profile</h1>
            <RegisterCompany isRegister={showNext} userId={userId}/>
          </div>
        }
      </div>
      {/* <!-- End Info Section --> */}
    </>
  );
};

export default index;
