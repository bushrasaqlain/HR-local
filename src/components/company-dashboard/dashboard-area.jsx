  "use client";
  import { useEffect, useState } from "react";
  import { useRouter } from "next/router";

  import AllApplicants from "./applicants/allApplicants.jsx";
  import CompanyProfile from "./companyProfile.jsx";
  import ChangePasswordForm from "../form/changepassword/changepasswordform.jsx";
  import ChatBox from "./messages/chatBox.jsx";
  import JobListings from "./jobList.jsx";
  import PackagesList from "./packagesList.jsx";
  import PostJob from "./postJob.jsx";
  import Profile from "./dashboard/profile.jsx";
  import TopCardBlock from "./dashboard/TopCardBlock.jsx";
  import ShortlistedCandidates from "./shortlistedcandidates.jsx";
  import ApprovedCandidates from "./approved.jsx";
  import CompanyWallet from "./wallet.jsx";
  import PricingForm2 from "./viewpackage.jsx";

  const CompanyDashboardArea = ({
    activeTab,
    onTabChange,
    jobListFilterStatus,
    profileCompleted,      
    onProfileComplete,
  }) => {
    const router = useRouter();

    const [ready, setReady] = useState(false);
    // const [profileCompleted, setProfileCompleted] = useState(false);

    useEffect(() => {
      const token = sessionStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      // const completed =
      //   sessionStorage.getItem("profile_completed") === "true";

      // setProfileCompleted(completed);
      setReady(true);
    }, []);

    if (!ready) return <div>Loading dashboard…</div>;

    // 🔥 SAME STYLE AS CANDIDATE (hard gate)
    if (!profileCompleted) {
      return (
        <div className="container">
          <CompanyProfile onComplete={onProfileComplete} />
        </div>
      );
    }

    const renderContent = () => {
      switch (activeTab) {
        case "profile":
          return <Profile />;

        case "postJob":
          return <PostJob />;

        case "companyProfile":
          return <CompanyProfile />;

        case "allApplicants":
          return <AllApplicants />;

        case "jobList":
          return <JobListings filterStatus={jobListFilterStatus} />;

        case "packagesList":
          return <PackagesList />;

        case "viewpackage":
          return <PricingForm2 />;

        case "shortlistedcandidates":
          return <ShortlistedCandidates />;

        case "approved":
          return <ApprovedCandidates />;

        case "chatBox":
          return <ChatBox />;
        case "wallet":
          return <CompanyWallet />;

        case "changepassword":
          return <ChangePasswordForm />;

        default:
          return <div>Select a menu option</div>;
      }
    };

    return (
      <section className="user-dashboard py-2 my-4">
        <div className="container">
          <TopCardBlock onTabChange={onTabChange} activeTab={activeTab} />
          {renderContent()}
        </div>
      </section>
    );
  };

  export default CompanyDashboardArea;
