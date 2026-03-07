"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // use App Router import
import Profile from "./dashboard/profile.jsx";
import EditProfile from "./dashboard/editprofile.jsx";
import ChatBox from "./messages/chatbox.jsx";
import JobList from "./dashboard/lists.jsx";
import CandidateRegisterForm from "./dashboard/register.jsx";
import CompanyInfo from "./dashboard/companyinfo.jsx";

const CandidateDashboardArea = ({ activeTab: parentActiveTab }) => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(parentActiveTab || "profile");
  const [userInfo, setUserInfo] = useState({
    userId: null,
    token: null,
    profileCompleted: null, // null = loading, false = register, true = dashboard
  });
  const [listsType, setListsType] = useState("");

  // ✅ Load session info once
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");
    const profileCompleted = sessionStorage.getItem("profile_completed");

    if (!token) {
      router.replace("/login");
      return;
    }

    setUserInfo({
      token,
      userId,
      profileCompleted: profileCompleted === "true", // convert string to boolean
    });

    // Optional: keep token/userId updated on session change
  }, []);

  // Update activeTab if parent changes
  useEffect(() => {
    setActiveTab(parentActiveTab);
  }, [parentActiveTab]);

  // 🔹 Show loading until we know profile_completed
  if (userInfo.profileCompleted === null) {
    return <div>Loading dashboard…</div>;
  }

  // Determine menu logic: if profile not completed, show only register
  const renderContent = () => {
    if (!userInfo.profileCompleted) {
      return (
        <CandidateRegisterForm
          onComplete={() => {
            // Update state once profile is complete
            setUserInfo({ ...userInfo, profileCompleted: true });
            setActiveTab("profile"); // switch to profile tab
            sessionStorage.setItem("profile_completed", "true"); // persist
          }}
        />
      );
    }

    // Dashboard menu after profile is complete
    switch (activeTab) {
      case "profile":
        return (
          <Profile
            onEdit={() => setActiveTab("editprofile")}
            onTabChange={(tabKey, type) => {
              setActiveTab(tabKey);
              setListsType(type || "shortlisted");
            }}
          />
        );
      case "editprofile":
        return <EditProfile onBack={() => setActiveTab("profile")} />;
      case "lists":
        return <JobList onClick={() => setActiveTab("lists")} />;
      case "chatbox":
        return <ChatBox />;
      case "companyinfo":
        return <CompanyInfo />
      default:
        return <Profile onEdit={() => setActiveTab("editprofile")} />;
    }
  };

  return (
    <section className="user-dashboard py-3">
      <div className="container">{renderContent()}</div>
    </section>
  );
};

export default CandidateDashboardArea;
