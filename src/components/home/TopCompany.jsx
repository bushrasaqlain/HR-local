"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TopCompany = () => {
  const [companies, setCompanies] = useState([]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    fetch(`${apiBaseUrl}company-info/top-companies`)
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch((err) => console.error(err));
  }, []);

  if (companies.length === 0) return null;

  const visible = companies.slice(0, 20);

  const renderTile = (company) => {
    const initials = company.company_name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    return (
      <div key={company.id} className="col">
        <div className="company-tile d-flex flex-column align-items-center justify-content-center text-center py-4 px-2">
          {company.logo ? (
            <div
              className="rounded-circle overflow-hidden mb-2"
              style={{
                width: "64px",
                height: "64px",
                border: "1px solid rgba(54,86,95,0.15)",
              }}
            >
              <img
                src={`data:image/png;base64,${company.logo}`}
                alt={company.company_name}
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mb-2 fw-semibold"
              style={{
                width: "64px",
                height: "64px",
                background: "rgba(54,86,95,0.08)",
                border: "1px solid rgba(54,86,95,0.15)",
                color: "#36565f",
                fontSize: "20px",
              }}
            >
              {initials}
            </div>
          )}

          <p className="mb-0 small fw-medium text-dark" style={{ lineHeight: 1.3 }}>
            {company.company_name}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        .company-tile {
          transition: background-color 0.2s ease, transform 0.2s ease;
          border-radius: 12px;
        }
        .company-tile:hover {
          background-color: rgba(54, 86, 95, 0.06);
          transform: translateY(-3px);
        }
      `}</style>

      <div className="row row-cols-2 row-cols-md-4 g-3">
        {visible.map((company) => renderTile(company))}
      </div>

      {companies.length > 20 && (
        <div className="text-center mt-4">
          <Link href="/companies">
            <button
              className="btn text-white fw-semibold rounded-pill px-4 py-2"
              style={{ background: "#36565f", border: "none" }}
            >
              Show All Companies
            </button>
          </Link>
        </div>
      )}
    </>
  );
};

export default TopCompany;