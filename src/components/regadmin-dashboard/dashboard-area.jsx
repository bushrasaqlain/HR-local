"use client";

import CompanyData from "./company";
import Candidate from "./candidate";
import { useEffect,useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import ChangePasswordForm from "../form/changepassword/changepasswordform.jsx"
import Packages from "./packages.jsx";
const RegAdminDashboardArea = ({ activeTab }) => {
   const router = useRouter();
const [userInfo, setUserInfo] = useState({ userId: null, token:null });

useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    const token = sessionStorage.getItem("token");
    setUserInfo({ userId, token });

    if (!token) {
        router.replace("/login");
    }
}, [router]);

  if (!userInfo.userId) return <div>Loading dashboard…</div>;

  const renderContent = () => {
    switch (activeTab) {
      case "company":
        return <CompanyData />;
      case "candidate":
        return <Candidate />;
         case "changepassword":
      return <ChangePasswordForm />;
       case "packages":
      return <Packages />;
        default:
          return <CompanyData />
    }
  };

  return (
    <section className="user-dashboard py-2 my-4">
      <div className="container">
        <div className="profile__tab-content p-3">{renderContent()}</div>
      </div>
    </section>
  );
};

export default RegAdminDashboardArea;
