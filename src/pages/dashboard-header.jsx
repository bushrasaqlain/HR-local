"use client";
import { useState } from "react";
import Seo from "../components/seo";
import DashboardHeader from "../layout/dashboard-header";
import DashboardArea from "../components/dbadmin-dashboard/dashboard-area";

export default function DashboardHeaderPage() {
  const [activeTab, setActiveTab] = useState("country"); // 👈 default City

  return (
    <>
      <span className="header-span"></span>

      <Seo pageTitle="Admin Dashboard" />

      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <DashboardArea
        activeTab={activeTab}   // 👈 pass it
      />
    </>
  );
}
