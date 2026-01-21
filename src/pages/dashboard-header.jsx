"use client";
import { useState } from "react";
import Seo from "../components/seo";

import DashboardHeader from "../layout/dashboard-header";
export default function DashboardHeaderPage() {

  return (
 <>
      <span className="header-span"></span>

      <Seo pageTitle="Dashboard" />
      <DashboardHeader />
      {/* Conditional DashboardArea */}
     </>
 
  );
}
