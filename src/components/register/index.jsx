"use client";
import React, { Component } from "react";
import Register2 from "./Register2";
import HeaderNavContent from "../../layout/HeaderNavContent";

class Index extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mounted: false,
      showNext: false,
      userId: null,
      accountType: "",
    };
  }

  componentDidMount() {
    this.setState({ mounted: true });
  }

  setShowNext = (value) => {
    this.setState({ showNext: value });
  };

  setUserId = (id) => {
    this.setState({ userId: id });
  };

  setAccountType = (type) => {
    this.setState({ accountType: type });
  };

 render() {
  const { mounted, showNext, userId, accountType } = this.state;
  if (!mounted) return null;

  return (
    <>
      {/* STEP 1: INITIAL REGISTER FORM */}
      {!showNext && (
        <div className="outer-box">
          <div className="login-form default-form">
            <Register2
              setShowNext={this.setShowNext}
              setUserId={this.setUserId}
              setAccountType={this.setAccountType}
            />
          </div>
        </div>
      )}

      {/* STEP 2: CANDIDATE PROFILE */}
      {showNext && accountType === "candidate" && (
        <div style={{ width: "65vw", margin: "0 auto" }}>
          <h1 className="mb-5 text-center fw-bold display-5">
            Create your Candidate Profile
          </h1>
          <RegisterCandidate isRegister={true} userId={userId} />
        </div>
      )}

      {/* STEP 2: EMPLOYER PROFILE */}
      {showNext && accountType === "employer" && (
        <div style={{ width: "65vw", margin: "0 auto" }}>
          <h1 className="mb-5 text-center fw-bold display-5">
            Create your Employer Profile
          </h1>
          <RegisterCompany isRegister={true} userId={userId} />
        </div>
      )}
    </>
  );
}

}

export default Index;


// "use client";
// import React, { Component } from "react";
// import Register2 from "./Register2";
// import RegisterCompany from "./RegisterCompany";
// import RegisterCandidate from "./RegisterCandidate";

// class Index extends Component {
//   constructor(props) {
//     super(props);

//     this.state = {
//       mounted: false,
//       showNext: false,
//       userId: null,
//       accountType: null,
//     };
//   }

//   componentDidMount() {
//     // Ensures client-side render only
//     this.setState({ mounted: true });
//   }

//   setShowNext = (value) => {
//     this.setState({ showNext: value });
//   };

//   setUserId = (id) => {
//     this.setState({ userId: id });
//   };

//   setAccountType = (type) => {
//     this.setState({ accountType: type });
//   };

//   render() {
//     const { mounted, showNext, userId, accountType } = this.state;

//     if (!mounted) return null; // prevents SSR hydration issues

//     return (
//       <>
//         {/* STEP 1: INITIAL REGISTER FORM */}
//         {!showNext && (
//           <>
//             <div
//               className="image-layer"
//               style={{
//                 backgroundImage: "url(/images/background/bg-3.png)",
//               }}
//             ></div>

//             <div className="outer-box">
//               <div className="login-form default-form">
//                 <Register2
//                   setShowNext={this.setShowNext}
//                   setUserId={this.setUserId}
//                   setAccountType={this.setAccountType}
//                 />
//               </div>
//             </div>
//           </>
//         )}

//         {/* STEP 2: EMPLOYER PROFILE */}
//         {showNext && accountType === "employer" && (
//           <div style={{ width: "65vw", margin: "0 auto" }}>
//             <h1
//               className="mb-5 text-center fw-bold display-5"
//               style={{ color: "rgb(78, 77, 114)" }}
//             >
//               Create your Employer Profile
//             </h1>

//             <RegisterCompany isRegister={true} userId={userId} />
//           </div>
//         )}

//         {/* STEP 2: CANDIDATE PROFILE */}
//         {showNext && accountType === "candidate" && (
//           <div style={{ width: "65vw", margin: "0 auto" }}>
//             <h1
//               className="mb-5 text-center fw-bold display-5"
//               style={{ color: "rgb(78, 77, 114)" }}
//             >
//               Create your Candidate Profile
//             </h1>

//             <RegisterCandidate isRegister={true} userId={userId} />
//           </div>
//         )}
//       </>
//     );
//   }
// }

// export default Index;
