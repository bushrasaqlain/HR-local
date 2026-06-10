"use client";

import CompanyData from "./company";
import Candidate from "./candidate";
import BoostRequests from "./boosts_requests.jsx";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ChangePasswordForm from "../form/changepassword/changepasswordform.jsx";
import Job from "./job.jsx";
import ContactMessages from "./ContactMessages.jsx";
import HistoryPage from "../common/HistoryPage.jsx";
import AdminRevenuePage from "./adminrevenue.jsx";

const LIST_TABS  = [
  { key: "company",   label: "Company List"   },
  { key: "candidate", label: "Candidates List" },
  { key: "job",       label: "Job List"        },
];

const OTHER_TABS = [
  { key: "boosts",          label: "Boost Requests"   },
  { key: "contactMessages", label: "Contact Messages" },
];

const SubTabLayout = ({ tabs, activeTab, onTabChange, children }) => (
  <div>
    <div style={{
      display: "flex",
      borderBottom: "2px solid #e0e0e0",
      marginBottom: 24,
      background: "#fff",
      borderRadius: "8px 8px 0 0",
      padding: "0 16px",
    }}>
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
            borderBottom: activeTab === tab.key ? "2px solid #36565f" : "2px solid transparent",
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
    {children}
  </div>
);

const RegAdminDashboardArea = ({ activeTab, onTabChange }) => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ userId: null, token: null });
  const [historyTarget, setHistoryTarget] = useState(null);

  // default sub-tab per group
  const [listTab,  setListTab]  = useState("company");
  const [otherTab, setOtherTab] = useState("boosts");

  useEffect(() => { setHistoryTarget(null); }, [activeTab]);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    const token  = sessionStorage.getItem("token");
    setUserInfo({ userId, token });
    if (!token) router.replace("/login");
  }, [router]);

  if (!userInfo.userId) return <div>Loading dashboard…</div>;

  // Render the correct child for the active sub-tab
  const renderListContent = () => {
    if (historyTarget) {
      return (
        <HistoryPage
          inlineId={historyTarget.id}
          inlineType={historyTarget.type}
          onBack={() => setHistoryTarget(null)}
        />
      );
    }
    switch (listTab) {
      case "company":
        return <CompanyData onViewHistory={(id) => setHistoryTarget({ id, type: "employer" })} />;
      case "candidate":
        return <Candidate onViewHistory={(id) => setHistoryTarget({ id, type: "candidate" })} />;
      case "job":
        return <Job onViewHistory={(id) => setHistoryTarget({ id, type: "job" })} />;
      default:
        return <CompanyData onViewHistory={(id) => setHistoryTarget({ id, type: "employer" })} />;
    }
  };

// in renderOtherContent()
const renderOtherContent = () => {
    switch (otherTab) {
      case "boosts":
        return historyTarget ? (
          <HistoryPage
            inlineId={historyTarget.id}
            inlineType={historyTarget.type}
            onBack={() => setHistoryTarget(null)}
          />
        ) : (
          <BoostRequests onViewHistory={(id) => setHistoryTarget({ id, type: "candidate" })} />
        );
      case "contactMessages": return <ContactMessages />;
      default:                return <BoostRequests onViewHistory={(id) => setHistoryTarget({ id, type: "candidate" })} />;
    }
};

  const renderContent = () => {
    switch (activeTab) {
      case "lists":
        return (
          <SubTabLayout tabs={LIST_TABS} activeTab={listTab} onTabChange={setListTab}>
            {renderListContent()}
          </SubTabLayout>
        );
      case "other":
        return (
          <SubTabLayout tabs={OTHER_TABS} activeTab={otherTab} onTabChange={setOtherTab}>
            {renderOtherContent()}
          </SubTabLayout>
        );
      case "revenue":
        return <AdminRevenuePage />;
      case "changepassword":
        return <ChangePasswordForm />;
      default:
        return (
          <SubTabLayout tabs={LIST_TABS} activeTab={listTab} onTabChange={setListTab}>
            {renderListContent()}
          </SubTabLayout>
        );
    }
  };

  return (
    <section className="profile__area py-2 my-4">
      <div className="container">
        <div className="profile__tab-content p-3">
          <div>{renderContent()}</div>
        </div>
      </div>
    </section>
  );
};

export default RegAdminDashboardArea;