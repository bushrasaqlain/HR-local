"use client";
import dynamic from "next/dynamic";

const CompanyProfile = dynamic(
  () => import("../components/company-dashboard/companyProfile"),
  { ssr: false }
);

export default function CompanyProfilePage() {
  return <CompanyProfile />;
}