"use client"

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const TopCompany = () => {
  const [topCompany, setTopCompany] = useState(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    fetch(`${apiBaseUrl}job-description/topCompanies/1`) // only fetch 1
      .then((res) => res.json())
      .then((data) => {
        
        setTopCompany(data[0]); // get the first object
      })
      .catch((err) => console.error(err));
  }, []);

  if (!topCompany) return null; // or loading placeholder

  return (
    <div className="company-block full-width">
      <div className="inner-box">
        <figure className="image">
          {/* <Image
            width={150}
            height={150}
    src={`data:image/png;base64,${Buffer.from(topCompany.Image.data).toString('base64')}`}
            alt={topCompany.name}
          /> */}
        </figure>
        <h4 className="name">
          <Link href={`/employers-single-v1/${topCompany.id}`}>
            {topCompany.name}
          </Link>
        </h4>
        <div className="location">
          <i className="flaticon-map-locator"></i> {topCompany.complete_address}
        </div>
        <Link
          href={`/employers-single-v1/${topCompany.id}`}
          className="theme-btn btn-style-three"
        >
          Open Position
        </Link>
      </div>

      <style jsx>{`
        .company-block.full-width {
          width: 100%;
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        .inner-box {
          max-width: 600px; /* adjust size as needed */
          width: 100%;
          text-align: center;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .image {
          margin-bottom: 15px;
        }
        .name {
          margin-bottom: 10px;
        }
        .location {
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
};

export default TopCompany;
