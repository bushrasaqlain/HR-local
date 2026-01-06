"use client";

import ProfessionForm from "./profession.jsx";
import City from "./city.jsx";
import Jobtype from "./jobtypes.jsx";
import Skills from "./skills.jsx";
import Country from "./country";
import DegreeType from "./degreetype.jsx";
import DegreeFields from "./degreefields";
import BusinessEntityTypes from "./businessentitytype";
import Currency from "./currency";
import Districts from "./district";
import ChangePasswordForm from "../form/changepassword/changepasswordform.jsx"
import { useEffect,useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";

const DashboardArea = ({ activeTab }) => {
  // ✅ Receive as prop
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
      case "country":
        return <Country />;
      case "district":
        return <Districts />;
      case "city":
        return <City />;
      case "profession":
        return <ProfessionForm />;
      case "skills":
        return <Skills />;
      case "degreetype":
        return <DegreeType />;
      case "degreefields":
        return <DegreeFields />;
      case "currency":
        return <Currency />;
      case "businessentitytypes":
        return <BusinessEntityTypes />;
      case "jobtypes":
        return <Jobtype />;
         case "changepassword":
      return <ChangePasswordForm />;
      default:
        return <City />;
    }
  };

  return (
    <section className="profile__area py-2 my-4">
      <div className="container">
        <div className="profile__tab-content p-3">
          <div style={{ overflowX: "auto" }}>{renderContent()}</div>
        </div>
      </div>
    </section>
  );
};

export default DashboardArea;
