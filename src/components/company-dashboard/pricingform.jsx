"use client";
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { useRouter } from "next/navigation";

const PricingForm = ({ jobId, setShowPricing }) => {
  const router = useRouter();

  const APIBASEURL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [packages, setPackages] = useState(null);
  const userId = sessionStorage.getItem("userId");
  useEffect(() => {
    const loadPackages = async () => {
      const response = await axios.get(`${APIBASEURL}packages/getallpackages`)
      
      setPackages(response.data.packages);
    }

    loadPackages();
  }, [])

   const addPackage = async (packageId) => {
    if (!jobId) {
      toast.error("Job ID not found. Please post job first.");
      return;
    }

    const data = { jobId, packageId,userId };

    const response = await api.put(
      `${APIBASEURL}job/subcribepackage`,
      data
    );

    if (response.status === 200) {
      toast.success("Package Subscribed Successfully");
      toast.info("Wait for admin approval");
      setTimeout(() => {
  router.push("/cart");   // ✅ route to cart.jsx
}, 1000);

    } else {
      toast.error("Unable to subscribe package");
    }
  };
  


  return (
    <div className="container pb-5">
      <h2 className="text-center py-5 fw-bold" style={{ fontSize: "3rem" }}>Pricing</h2>

      <div className="row g-4 justify-content-center">
        {packages?.map((pkg) => {
          let cardClass = "";
          let features = [];

          // Decide card style and features based on duration
          switch (pkg.duration_unit) {
            case "Hours":
              cardClass = "plan-card plan-hours";
              features = [
                "Quick job posting for urgent needs",
                "Job visible immediately after approval",
                "Basic applicant tracking included",
                "Affordable short-term exposure",
              ];
              break;
            case "Days":
              cardClass = "plan-card plan-days";
              features = [
                "Job listed for multiple days",
                "Highlighted in search results",
                "Email notifications to candidates",
                "Access to applicant details & resumes",
                "Standard support included",
              ];
              break;
            case "Months":
              cardClass = "plan-card plan-months";
              features = [
                "Extended job visibility",
                "Boosted placement in candidate dashboards",
                "Priority listing above short-term plans",
                "Analytics on views and applications",
                "Dedicated employer support",
              ];
              break;
            case "Years":
              cardClass = "plan-card plan-years";
              features = [
                "Premium long-term visibility",
                "Maximum exposure across platform",
                "Unlimited applicant management",
                "Featured employer branding",
                "Priority customer support",
              ];
              break;
            default:
              cardClass = "plan-card plan-default";
              features = [
                "Standard job posting",
                "Candidate application tracking",
                "Basic support included",
              ];
          }

          return (
            <div className="col-md-4" key={pkg.id}>
              <div className={cardClass}>
                {/* Title */}
                <h5 className="plan-title">
                  {pkg.duration_unit.charAt(0).toUpperCase() +
                    pkg.duration_unit.slice(1)}{" "}
                  Plan
                </h5>

                {/* Price */}
                <div className="plan-price">
                  <span>
                    {pkg.price} {pkg.currency}
                  </span>
                  <small>/ {pkg.duration_unit}</small>
                </div>

                {/* Duration */}
                <p className="plan-desc">
                  Your Job Post will show for <br />
                  <strong>
                    {pkg.duration_value} {pkg.duration_unit}
                  </strong>
                </p>

                {/* Features */}
                <ul className="plan-features">
                  {features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>

                {/* Button */}
              <button
  type="button"   // ✅ VERY IMPORTANT
  className="plan-btn"
  onClick={() => addPackage(pkg.id)}
>
  Select
</button>

              </div>
            </div>
          );
        })}
      </div>
    </div>



  )
}

export default PricingForm
