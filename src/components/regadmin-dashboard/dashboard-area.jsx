"use client";

import CompanyData from "./company";
import Candidate from "./candidate";
import BoostRequests from "./boosts_requests.jsx";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ChangePasswordForm from "../form/changepassword/changepasswordform.jsx"
import Job from "./job.jsx";
import ContactMessages from "./ContactMessages.jsx";
import HistoryPage from "../common/HistoryPage.jsx";
// import HistoryPage from "../history1/[type]/[id]"; // ← import it

const RegAdminDashboardArea = ({ activeTab }) => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ userId: null, token: null });
  const [historyTarget, setHistoryTarget] = useState(null); 
    useEffect(() => {
    setHistoryTarget(null);
  }, [activeTab]);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    const token = sessionStorage.getItem("token");
    setUserInfo({ userId, token });
    if (!token) router.replace("/login");
  }, [router]);

  if (!userInfo.userId) return <div>Loading dashboard…</div>;

  const renderContent = () => {
    // ← ADD THIS BLOCK BEFORE THE SWITCH
    if (historyTarget) {
      return (
        <HistoryPage
          inlineId={historyTarget.id}
          inlineType={historyTarget.type}
          onBack={() => setHistoryTarget(null)}
        />
      );
    }

    switch (activeTab) {
      case "company":
        return (
          <CompanyData
            onViewHistory={(id) => setHistoryTarget({ id, type: "employer" })} // ← ADD PROP
          />
        );
      case "candidate":
       return (
    <Candidate
      onViewHistory={(id) => setHistoryTarget({ id, type: "candidate" })}
    />
  );
      case "changepassword":
        return <ChangePasswordForm />;
      case "job":
  return (
    <Job
      onViewHistory={(id) => setHistoryTarget({ id, type: "job" })}
    />
  );
      case "boosts":
        return <BoostRequests />;
      case "contactMessages":
        return <ContactMessages />;
      default:
        return (
          <CompanyData
            onViewHistory={(id) => setHistoryTarget({ id, type: "employer" })} // ← ADD PROP
          />
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