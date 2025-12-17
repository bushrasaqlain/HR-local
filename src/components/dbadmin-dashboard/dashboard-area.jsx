"use client";

import ProfessionForm from "./profession.jsx";
import City from "./city.jsx";
import Jobtype from "./jobtypes.jsx";
import Skills from "./skills.jsx";
import Country from "./country";
import Degree from "./degree";
import DegreeFields from "./degreefields";
import BusinessEntityTypes from "./businessentitytype";
import Currency from "./currency";
import Districts from "./district";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";

const DashboardArea = ({ activeTab }) => {
  // ✅ Receive as prop
  const router = useRouter();
  const { userId } = useSelector((state) => state.user);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  if (!userId) return <div>Loading dashboard…</div>;

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
      case "degree":
        return <Degree />;
      case "degreefields":
        return <DegreeFields />;
      case "currency":
        return <Currency />;
      case "businessentitytypes":
        return <BusinessEntityTypes />;
      case "jobtypes":
        return <Jobtype />;
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
