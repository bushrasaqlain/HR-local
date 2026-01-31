"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Profile from "./dashboard/profile.jsx";
import EditProfile from "./dashboard/editprofile.jsx";
import ChatBox from "./messages/chatbox.jsx";
import JobListings from "./jobList.jsx";

const CandidateDashboardArea = ({ activeTab: parentActiveTab }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(parentActiveTab || "profile");
  const [userInfo, setUserInfo] = useState({ userId: null, token: null });

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setUserInfo({ userId, token });
  }, [router]);
  useEffect(() => {
    setActiveTab(parentActiveTab); // update whenever parent changes
  }, [parentActiveTab]);
  if (!userInfo.userId) return <div>Loading dashboard…</div>;

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile onEdit={() => setActiveTab("editprofile")} />;
      case "editprofile":
        return <EditProfile onBack={() => setActiveTab("profile")} />;
      case "jobList":
        return <JobListings />;
      case "chatbox":
        return <ChatBox />;
      default:
        return <Profile onEdit={() => setActiveTab("editprofile")} />;
    }
  };

  return (
    <section className="user-dashboard py-2 my-4">
      <div className="container">{renderContent()}</div>
    </section>
  );
};

export default CandidateDashboardArea;
