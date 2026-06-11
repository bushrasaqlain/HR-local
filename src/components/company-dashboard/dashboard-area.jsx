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
import Messages from "./dashboard/Messages.jsx";
import Considered from "./considered.jsx";
import Offered from "./offered.jsx";
import Interview from "./interview.jsx";
import Saved from "./saved.jsx";
const DASHBOARD_STYLES = `
  html, body {
    overflow-x: hidden;
    max-width: 100vw;
  }


  .user-dashboard {
    padding-bottom: 10px !important;
    padding-bottom: 10px !important;
  }

  .user-dashboard > .container {
    padding-bottom: 0px !important;
    overflow-x: hidden;
    max-width: 100%;
  }

  @media (max-width: 768px) {
    .user-dashboard {
      padding-bottom: 0px !important;
    }
    .user-dashboard > .container {
      padding-bottom: 0px !important;
      /* Also add side padding so content never touches screen edge */
      padding-left: 12px !important;
      padding-right: 12px !important;
    }
  }

  @media (max-width: 480px) {
    .user-dashboard {
      padding-bottom: 0px !important;
    }
    .user-dashboard > .container {
      padding-bottom: 10px !important;
      padding-bottom: 10px !important;
    }
  }
`;

// Inject styles once into <head>
if (typeof document !== "undefined" && !document.getElementById("dashboard-global-styles")) {
  const tag = document.createElement("style");
  tag.id = "dashboard-global-styles";
  tag.textContent = DASHBOARD_STYLES;
  document.head.appendChild(tag);

  // Hard-clamp document-level overflow (fixes blank right space)
  document.documentElement.style.overflowX = "hidden";
  document.documentElement.style.maxWidth = "100vw";
  document.body.style.overflowX = "hidden";
  document.body.style.maxWidth = "100vw";
}
const JobsLayout = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: "jobList", label: "Job List" },
    { key: "postJob", label: "Post Job" },
    // { key: "packagesList", label: "Packages" },
    { key: "viewpackage", label: "Pricing" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "postJob":
        return <PostJob />;
      // case "packagesList":
      //   return <PackagesList />;
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
    { key: "saved",         label: "Saved" },
    { key: "interview",     label: "Shortlisted" },
    { key: "considered",    label: "Considered" },
    { key: "offered",       label: "Approved" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "allApplicants": return <AllApplicants />;
      case "saved":         return <Saved />;
      case "interview":     return <Interview />;
      case "considered":    return <Considered />;
      case "offered":       return <Offered />;
      default:              return <AllApplicants />;
    }
  };

return (
  <div className="bg-white rounded-3 shadow" style={{ marginBottom: 24 }}>
    {/* Tab bar */}
    <div style={{
      borderBottom: "2px solid #e0e0e0",
      borderRadius: "8px 8px 0 0",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
    }}>
      <div style={{
        display: "flex",
        minWidth: "max-content",
        padding: "0 16px",
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: "12px 16px",
              fontWeight: 600,
              fontSize: 14,
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.key
                ? "5px solid #36565f"   // slightly thicker so it's obvious
                : "3px solid transparent",
              color: activeTab === tab.key ? "#36565f" : "#595959",
              cursor: "pointer",
              marginBottom: -2,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>

    {/* Tab content — no separate bg-white wrapper needed */}
    <div className="p-3">
      {renderTab()}
    </div>
  </div>
);
};

const CompanyDashboardArea = ({
  activeTab,
  onTabChange,
  jobListFilterStatus,
  profileCompleted,
  onProfileComplete,
  selectedMessageContact,
}) => {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  // const [profileCompleted, setProfileCompleted] = useState(false);
  const [walletNotifId, setWalletNotifId] = useState(null);

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
  useEffect(() => {
    const handler = (e) => {
      setWalletNotifId(e?.detail?.selectedId || null);
      onTabChange("wallet");           // switches main nav to wallet
      // tell the wallet to open notifications tab after it mounts
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("walletOpenNotifications", {
            detail: { selectedId: e?.detail?.selectedId || null }
          })
        );
      }, 100);
    };
    window.addEventListener("openNotifications", handler);
    return () => window.removeEventListener("openNotifications", handler);
  }, []);
  useEffect(() => {
    const handler = (e) => {
      setWalletNotifId(e?.detail?.selectedId || null);
      onTabChange("wallet");           // switches main nav to wallet
      // tell the wallet to open notifications tab after it mounts
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("walletOpenNotifications", {
            detail: { selectedId: e?.detail?.selectedId || null }
          })
        );
      }, 100);
    };
    window.addEventListener("openNotifications", handler);
    return () => window.removeEventListener("openNotifications", handler);
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
      case "saved":
      case "interview":
      case "considered":
        // case "shortlistedcandidates":
        case "offered":
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
      
      case "messages":
        return <Messages selectedContactProp={selectedMessageContact} />;
      case "wallet":
        return <CompanyWallet initialNotifId={walletNotifId} />;

      case "changepassword":
        return <ChangePasswordForm />;

      default:
        return <div>Select a menu option</div>;
    }
  };

// To this:
if (activeTab === "messages") {
    return <Messages selectedContactProp={selectedMessageContact} />;
}

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