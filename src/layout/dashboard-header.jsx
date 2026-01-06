"use client";

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
import { dbadminmenuitem, regadminmenuitem, companymenuitem } from './menuitem';
import DBAdminDashboardArea from "../components/dbadmin-dashboard/dashboard-area";
import RegAdminDashboardArea from "../components/regadmin-dashboard/dashboard-area";
import CompanyDashboardArea from "../components/company-dashboard/dashboard-area";
import DashboardFooter from "./dashboard-footer";

class DashboardHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      navbar: false,
      userDropdownOpen: false,
      menuDropdownOpen: false,
      activeTab: null,
      userInfo: { userId: null, username: "User", accountType: null },
     
    };
  }
 
  componentDidMount() {
    const userId = sessionStorage.getItem("userId");
    const username = sessionStorage.getItem("username") || "User";
    const accountType = sessionStorage.getItem("accountType");

    this.setState(
      {
        userInfo: { userId, username, accountType },
      },
      () => {
        if (accountType && !this.state.activeTab) {
          if (accountType === "db_admin") this.setState({ activeTab: "country" });
          else if (accountType === "reg_admin") this.setState({ activeTab: "company" });
          else if (accountType === "employer") this.setState({ activeTab: "companyProfile" });
        }
      }
    );

    window.addEventListener("scroll", this.changeBackground);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.changeBackground);
  }

  changeBackground = () => {
    this.setState({ navbar: window.scrollY >= 10 });
  };

  toggleUserDropdown = () => {
    this.setState({ userDropdownOpen: !this.state.userDropdownOpen });
  };

  toggleMenuDropdown = () => {
    this.setState({ menuDropdownOpen: !this.state.menuDropdownOpen });
  };

handleUserActionClick = (item) => {
  if (item.tabKey === "logout") {
    window.location.href = "/";
  } else {
    this.setState({ activeTab: item.tabKey });
  }
  this.setState({ userDropdownOpen: false });
};


  render() {
    const { navbar, userDropdownOpen, menuDropdownOpen, activeTab, userInfo } = this.state;
    const { accountType, username, userId } = userInfo;

    if (!accountType) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
          Loading...
        </div>
      );
    }

    return (
      <>
        <Navbar color="dark" dark expand="md" fixed="top" className="shadow-sm">
          <div className="container-fluid d-flex align-items-center justify-content-between py-2">
            {/* Left: Logo & Menu */}
            <div className="d-flex align-items-center gap-3">
              <NavbarBrand href="/">
                <Image width={154} height={50} src="/images/logo-2.svg" alt="brand" />
              </NavbarBrand>

              {/* DB Admin Dropdown */}
              {accountType === "db_admin" && (
                <Dropdown isOpen={menuDropdownOpen} toggle={this.toggleMenuDropdown}>
                  <DropdownToggle
                    caret
                    color="dark"
                    className="fw-bold"
                    style={{ fontSize: "20px", fontFamily: "Times New Roman", width: "150px" }}
                  >
                    DataBase
                  </DropdownToggle>
                  <DropdownMenu>
                    {dbadminmenuitem.map((item) => (
                      <DropdownItem
                        key={item.key}
                        onClick={() => {
                          this.setState({ activeTab: item.key, menuDropdownOpen: false });
                        }}
                      >
                        <i className={`las ${item.icon} me-2`}></i>
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}

              {/* Reg Admin / Employer Menu */}
              {(accountType === "reg_admin" || accountType === "employer") && (
                <Nav className="d-flex gap-2">
                  {(accountType === "reg_admin" ? regadminmenuitem : companymenuitem).map((item) => (
                    <NavItem key={item.key}>
                      <Button
                        color="dark"
                        outline
                        className={`text-white ${activeTab === item.key ? "border-bottom border-white" : ""}`}
                        onClick={() => this.setState({ activeTab: item.key })}
                      >
                        <i className={`las ${item.icon} me-1`}></i>
                        {item.label}
                      </Button>
                    </NavItem>
                  ))}
                </Nav>
              )}
            </div>

            {/* Right: User Dropdown */}
            <div className="d-flex align-items-center gap-3 position-relative">
              <span className="text-white d-none d-lg-inline">
                Welcome <strong>{username || "Admin"}</strong>
              </span>

              <Dropdown isOpen={userDropdownOpen} toggle={this.toggleUserDropdown}>
                <DropdownToggle tag="span">
                  <i className="las la-user-circle fs-2 text-white cursor-pointer"></i>
                </DropdownToggle>
                <DropdownMenu end>
                  {admindropdwonData(userId).map((item) => (
                    <DropdownItem key={item.id} onClick={() => this.handleUserActionClick(item)}>
                      <i className={`la ${item.icon} me-2`}></i>
                      {item.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </Navbar>

        {/* Dashboard content */}
        {accountType === "db_admin" && <DBAdminDashboardArea activeTab={activeTab} />}
        {accountType === "reg_admin" && <RegAdminDashboardArea activeTab={activeTab} />}
        {accountType === "employer" && <CompanyDashboardArea activeTab={activeTab} />}

        <DashboardFooter />
      </>
    );
  }
}

// Use withRouter HOC to get router inside class component
export default DashboardHeader;
