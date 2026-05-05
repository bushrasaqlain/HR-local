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
import AvailableCandidates from "./Available Candidates.jsx";

const JobsLayout = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: "jobList", label: "Job List" },
    { key: "postJob", label: "Post Job" },
    { key: "packagesList", label: "Packages" },
    { key: "viewpackage", label: "Pricing" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "postJob":
        return <PostJob />;
      case "packagesList":
        return <PackagesList />;
      case "viewpackage":
        return <PricingForm2 />;
      case "jobList":
      default:
        return <JobListings />;
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e0e0e0",
          marginBottom: 24,
          background: "#fff",
          borderRadius: "8px 8px 0 0",
          padding: "0 16px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: "12px 20px",
              fontWeight: 600,
              fontSize: 14,
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid #36565f"
                  : "2px solid transparent",
              color: activeTab === tab.key ? "#36565f" : "#595959",
              cursor: "pointer",
              marginBottom: -2,
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
};
// 1. Define ApplicantsLayout here, inside the same file
const ApplicantsLayout = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: "allApplicants", label: "All Applicants" },
    { key: "shortlistedcandidates", label: "Shortlisted" },
    { key: "approved", label: "Approved" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "allApplicants":
        return <AllApplicants />;
      case "shortlistedcandidates":
        return <ShortlistedCandidates />;
      case "approved":
        return <ApprovedCandidates />;
      default:
        return <AllApplicants />;
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e0e0e0",
          marginBottom: 24,
          background: "#fff",
          borderRadius: "8px 8px 0 0",
          padding: "0 16px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: "12px 20px",
              fontWeight: 600,
              fontSize: 14,
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid #36565f"
                  : "2px solid transparent",
              color: activeTab === tab.key ? "#36565f" : "#595959",
              cursor: "pointer",
              marginBottom: -2,
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
};

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

      case "companyProfile":
        return <CompanyProfile />;

      case "allApplicants":
      case "shortlistedcandidates":
      case "approved":
        return (
          <ApplicantsLayout activeTab={activeTab} onTabChange={onTabChange} />
        );

      case "jobList":
      case "postJob":
      case "packagesList":
      case "viewpackage":
        return <JobsLayout activeTab={activeTab} onTabChange={onTabChange} />;

      case "chatBox":
        return <ChatBox />;
      case "availableCandidates":
        return <AvailableCandidates onTabChange={onTabChange} />;
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
