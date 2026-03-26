"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TopCompany = () => {
  const [companies, setCompanies] = useState([]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    fetch(`${apiBaseUrl}company-info/top-companies`)
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data);
      })
      .catch((err) => console.error(err));
  }, []);

  if (companies.length === 0)
    return <p className="text-white text-center">Loading...</p>;

  return (
    <>
      {companies.map((company) => (
        <div className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4 text-center" key={company.id}>

          {/* Logo */}
          {company.logo ? (
            <img
              src={`data:image/png;base64,${company.logo}`}
              alt={company.company_name}
              className="company-logo-clean"
            />
          ) : (
            <div>No Logo</div>
          )}

          {/* Name */}
          <h6 className="mt-3 company-name">
            {company.company_name}
          </h6>

        </div>
      ))}
    </>
  );
};

export default TopCompany;