"use client";
import dynamic from "next/dynamic";

const CompanyPricingPage = dynamic(
  () => import("../components/company-dashboard/CompanyPricingPage"),
  { ssr: false }
);

CompanyPackages.getLayout = function getLayout(page) {
  return page;
};

export default function CompanyPackages() {
  return <CompanyPricingPage />;
}