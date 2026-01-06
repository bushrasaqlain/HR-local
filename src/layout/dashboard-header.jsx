"use client";

import React, { Component } from "react";
import React, { Component } from "react";
import Link from "next/link";
import Image from "next/image";
import { withRouter } from "next/navigation";
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  Button,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { useRouter } from "next/router";
import admindropdwonData from "./userdropdownitem";

const DashboardHeader = ({ activeTab, setActiveTab }) => {
  const [navbar, setNavbar] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { username, userId } = useSelector((state) => state.user);
  const router = useRouter();

  const menuItems = [
    { key: "country", label: "Country", icon: "la-flag" },
    { key: "district", label: "District", icon: "la-map" },
    { key: "city", label: "City", icon: "la-city" },
    { key: "profession", label: "Profession", icon: "la-briefcase" },
    { key: "skills", label: "Skills", icon: "la-tools" },
    { key: "degree", label: "Degree", icon: "la-graduation-cap" },
    { key: "degreefields", label: "Degree Fields", icon: "la-book" },
    { key: "currency", label: "Currency", icon: "la-money" },
    { key: "businessentitytypes", label: "Business Entity", icon: "la-building" },
    { key: "jobtypes", label: "Job Types", icon: "la-clipboard-list" },
  ];

  const changeBackground = () => setNavbar(window.scrollY >= 10);

  useEffect(() => {
    window.addEventListener("scroll", changeBackground);
    return () => window.removeEventListener("scroll", changeBackground);
  }, []);

  const handleUserActionClick = (item) => {
    if (item.name === "Logout") router.push("/");
    else if (item.name === "Change Password") console.log("Show change password form");
    setUserDropdownOpen(false);
  };

  return (
   <header
  className={`w-100 shadow-sm ${navbar ? "fixed-top bg-primary" : "bg-primary"}`}
>
  <div className="container-fluid px-4 py-2 d-flex align-items-center justify-content-between">
    
    {/* Left */}
    <div className="d-flex align-items-center gap-3">
      <Link href="/">
        <Image width={154} height={50} src="/images/logo.svg" alt="brand" />
      </Link>

      {/* Menu Dropdown */}
      <div className="dropdown">
      
        <li
          className="nav-item d-flex align-items-center gap-2"
          onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
        >
          <i className="las la-bars fs-4"></i>
          Menu
        </li>

        {menuDropdownOpen && (
          <div className="dropdown-menu shadow mt-2 show">
            {menuItems.map((item) => (
              <button
                key={item.key}
                className={`dropdown-item ${activeTab === item.key ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.key);
                  setMenuDropdownOpen(false);
                }}
              >
                <i className={`las ${item.icon} me-2`}></i>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

            {/* Right: User Dropdown */}
            <div className="d-flex align-items-center gap-3 position-relative">
              <span className="text-white d-none d-lg-inline">
                Welcome <strong>{username || "Admin"}</strong>
              </span>

      <i
        className="las la-user-circle fs-2 text-white cursor-pointer"
        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
      ></i>

      {userDropdownOpen && (
        <div className="dropdown-menu dropdown-menu-end shadow mt-2 show">
          {admindropdwonData(userId).map((item) => (
            <button
              key={item.id}
              className="dropdown-item"
              onClick={() => handleUserActionClick(item)}
            >
              <i className={`la ${item.icon} me-2`}></i>
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
</header>

  );
};

export default DashboardHeader;
