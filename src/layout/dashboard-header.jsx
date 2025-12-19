"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Image from "next/image";
import { useRouter } from "next/navigation";
import admindropdwonData from "./userdropdownitem";

const DashboardHeader = ({ activeTab, setActiveTab }) => {
  const [navbar, setNavbar] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { username, userId } = useSelector((state) => state.user);
  const router = useRouter();

  const menuItems = [
    { key: "country", label: "Country" },
    { key: "district", label: "District" },
    { key: "city", label: "City" },
    { key: "profession", label: "Profession" },
    { key: "skills", label: "Skills" },
    { key: "degree", label: "Degree" },
    { key: "degreefields", label: "Degree Fields" },
    { key: "currency", label: "Currency" },
    { key: "businessentitytypes", label: "Business Entity" },
    { key: "jobtypes", label: "Job Types" },
  ];

  // Change header background on scroll
  const changeBackground = () => setNavbar(window.scrollY >= 10);

  useEffect(() => {
    window.addEventListener("scroll", changeBackground);
    return () => window.removeEventListener("scroll", changeBackground);
  }, []);

  const handleUserActionClick = (item) => {
    if (item.name === "Logout") router.push("/");
    else if (item.name === "Change Password")
      console.log("Show change password form");
    setUserDropdownOpen(false);
  };

  return (
    <header
      className={`fixed-top w-100 shadow-sm ${navbar ? "bg-dark" : "bg-dark"}`}
    >
      <div className="container-fluid d-flex align-items-center justify-content-between py-2">
        {/* Left: Logo + Menu */}
        <div className="d-flex align-items-center gap-3">
          <Link href="/">
            <Image width={154} height={50} src="/images/logo-2.svg" alt="brand" />
          </Link>

          {/* Menu Dropdown */}
          <div
            className="dropdown"
            style={{ position: "relative", display: "inline-block" }}
          >
            <li
              className="fw-bold"
              style={{
                // display: 'inline-block',       // so items are horizontal if you have multiple
                fontSize: "20px",
                fontFamily: "Times New Roman",
                width: "150px",
                textAlign: "center",
                padding: "5px 0",
                cursor: "pointer",
                color: "#ffffffff",
                border: menuDropdownOpen
                  ? "2px solid #f8f8f8ff"
                  : "2px solid transparent", // underline when active
                borderRadius: "50px",
                transition: "border-bottom 0.3s",
              }}
              onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
            >
              DataBase
            </li>

            {menuDropdownOpen && (
              <div
                className="dropdown-menu shadow mt-2 show"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(1, 1fr)",
                  gap: "10px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  zIndex: 1000,
                  minWidth: "200px",
                }}
              >
                {menuItems.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      className="dropdown-item"
                      style={{
                        fontSize: "16px",
                        fontFamily: "Helvetica Neue",
                        textAlign: "left",
                        backgroundColor: isActive ? "#0d0f11ff" : "#f8f9fa",
                        color: isActive ? "#fff" : "#000",
                        border: "none",
                        borderRadius: "8px",
                        width: "100%",
                      }}
                      onClick={() => {
                        setActiveTab(item.key);
                        setMenuDropdownOpen(false); // close dropdown on selection
                      }}
                    >
                      <i className={`las ${item.icon} me-2`}></i>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: User */}
        <div className="d-flex align-items-center gap-3 ">
          <span className="text-white d-none d-lg-inline">
            Welcome <strong>{username || "Admin"}</strong>
          </span>

          <i
            className="las la-user-circle fs-2 text-white cursor-pointer"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          ></i>

          {userDropdownOpen && (
            <div className="dropdown-menu dropdown-menu-end mt-2 show">
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
