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
  NavbarToggler,
} from "reactstrap";
import { useRouter } from "next/router";
import dropdownItem from "./dropdownItem";
import {
  dbadminmenuitem,
  regadminmenuitem,
  companymenuitem,
  candidatesmenuitem,
} from "./menuitem";
import DBAdminDashboardArea from "../components/dbadmin-dashboard/dashboard-area";
import RegAdminDashboardArea from "../components/regadmin-dashboard/dashboard-area";
import CompanyDashboardArea from "../components/company-dashboard/dashboard-area";
import CandidateDashboardArea from "../components/candidate-dashboard/dashboard-area";
import DashboardFooter from "./dashboard-footer";

class DashboardHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      navbar: false,
      userDropdownOpen: false,
      menuDropdownOpen: false,
      isOpen: false, // for mobile menu collaps
      isMobileMenuOpen: false, // add this
      openMobileDropdown: null, // also add
      activeTab: null,
      profileGroup: false,
      jobsGroup: false,
      userInfo: { userId: null, username: "User", accountType: null },
      jobListFilterStatus: null,
      openDesktopDropdown: null,
    };
  }

  componentDidMount() {
    const userId = sessionStorage.getItem("userId");
    const username = sessionStorage.getItem("username") || "User";
    const accountType = sessionStorage.getItem("accountType");
    const profileCompleted =
      sessionStorage.getItem("profile_completed") === "true";

    if (!accountType) {
      // optional: redirect to login
      return;
    }

    // ✅ Set all user info at once
    this.setState({
      userInfo: { userId, username, accountType, profileCompleted },
      activeTab:
        accountType === "db_admin"
          ? "country"
          : accountType === "reg_admin"
            ? "company"
            : accountType === "employer"
              ? "profile"
              : accountType === "candidate"
                ? profileCompleted
                  ? "profile"
                  : "register"
                : null,
    });

    window.addEventListener("scroll", this.changeBackground);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.changeBackground);
  }
  toggleNavbar = () => {
    this.setState((prev) => ({ isOpen: !prev.isOpen }));
  };
  toggleMobileMenu = () => {
    this.setState((prev) => ({
      isMobileMenuOpen: !prev.isMobileMenuOpen,
      openMobileDropdown: null, // close any open dropdowns
    }));
  };

  changeBackground = () => {
    this.setState({ navbar: window.scrollY >= 10 });
  };

  toggleUserDropdown = () => {
    this.setState({ userDropdownOpen: !this.state.userDropdownOpen });
  };

  toggleMenuDropdown = () => {
    this.setState({ menuDropdownOpen: !this.state.menuDropdownOpen });
  };
  handleProfileComplete = () => {
    sessionStorage.setItem("profile_completed", "true");

    this.setState((prev) => ({
      userInfo: {
        ...prev.userInfo,
        profileCompleted: true,
      },
      activeTab: "profile",
    }));
  };

  handleUserActionClick = (item) => {
    if (item.tabKey === "logout") {
      window.location.href = "/";
    } else {
      this.setState({ activeTab: item.tabKey });
    }
    this.setState({ userDropdownOpen: false });
  };

  // Add this method to handle tab changes from child components
  handleTabChange = (tabKey, filterStatus = null) => {
    this.setState({
      activeTab: tabKey,
      jobListFilterStatus: filterStatus,
    });
  };
  renderMenuItems = (isMobile) => {
    const { userInfo, activeTab, openMobileDropdown } = this.state;
    const accountType = userInfo?.accountType; // optional chaining
    const profileCompleted = userInfo?.profileCompleted;

    if (!accountType) return null; // don't render until we have userInfo

    let items = [];
    if (accountType === "db_admin") items = dbadminmenuitem;
    else if (accountType === "reg_admin") items = regadminmenuitem;
    else if (accountType === "employer") items = companymenuitem;
    else if (accountType === "candidate") {
      items = profileCompleted
        ? candidatesmenuitem.filter(
            (item) =>
              item.key === "profile" ||
              item.key === "lists" ||
              item.key === "chatbox",
          )
        : candidatesmenuitem.filter((item) => item.key === "register");
    }

    return items.map((item) => {
      if (!item.children) {
        return (
          <NavItem key={item.key} className={isMobile ? "mb-2" : ""}>
            <Button
              color="dark"
              outline
              className={`text-white ${activeTab === item.key ? "border-bottom border-white border-2" : ""}`}
              onClick={() =>
                this.setState({
                  activeTab: item.key,
                  isMobileMenuOpen: false,
                  openMobileDropdown: null,
                })
              }
            >
              <i className={`las ${item.icon} me-1`}></i>
              {item.label}
            </Button>
          </NavItem>
        );
      }

      // Dropdown item
      return (
        <Dropdown
          key={item.key}
          isOpen={
            isMobile
              ? openMobileDropdown === item.key
              : this.state.openDesktopDropdown === item.key
          }
          toggle={() =>
            isMobile
              ? this.setState((prev) => ({
                  openMobileDropdown:
                    prev.openMobileDropdown === item.key ? null : item.key,
                }))
              : this.setState((prev) => ({
                  openDesktopDropdown:
                    prev.openDesktopDropdown === item.key ? null : item.key,
                }))
          }
          nav={!isMobile}
          inNavbar={!isMobile}
          className={isMobile ? "" : "d-inline-block"}
        >
          <DropdownToggle
            caret
            color="dark"
            outline={!isMobile}
            style={{
              color: "#fff",
              backgroundColor: isMobile ? "transparent" : undefined,
              border: isMobile ? "none" : undefined,
              width: isMobile ? "100%" : undefined,
              textAlign: isMobile ? "left" : undefined,
            }}
          >
            {item.label}
          </DropdownToggle>
          <DropdownMenu
            style={{
              backgroundColor: "#faf6f6",
              width: isMobile ? "100%" : undefined,
            }}
          >
            {item.children.map((child) => (
              <DropdownItem
                key={child.key}
                onClick={() =>
                  this.setState({
                    activeTab: child.key,
                    isMobileMenuOpen: false,
                    openMobileDropdown: null,
                    openDesktopDropdown: null, // ✅ add this
                    [item.key]: false,
                  })
                }
                style={{
                  color: activeTab === child.key ? "#fff" : "#000",
                  backgroundColor:
                    activeTab === child.key ? "#181a1dff" : "#faf6f6",
                }}
              >
                {child.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      );
    });
  };

  render() {
    const { navbar, userDropdownOpen, menuDropdownOpen, activeTab, userInfo } =
      this.state;
    const { accountType, username, userId } = userInfo;

    if (!accountType) {
      return (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          Loading...
        </div>
      );
    }

    return (
      <>
        <Navbar color="dark" dark expand="md" fixed="top" className="shadow-sm">
          <div className="container-fluid d-flex align-items-center justify-content-between flex-nowrap py-2">
            {/* Left: Logo + Desktop Menu */}
            <div className="d-flex align-items-center gap-3 flex-nowrap">
              <NavbarBrand href="/">
                <Image
                  width={154}
                  height={50}
                  src="/images/logo-2.svg"
                  alt="brand"
                />
              </NavbarBrand>

              {/* Desktop Menu */}
              <div className="d-none d-md-flex align-items-center gap-3">
                {this.renderMenuItems(false)}
              </div>
            </div>

            {/* Mobile Hamburger */}
            <NavbarToggler
              onClick={this.toggleMobileMenu}
              className="d-md-none"
            />

            {/* Menu: Desktop */}
            {/* <div className="d-none d-md-flex align-items-center gap-3">
        {this.renderMenuItems(false)}
 
    </div> */}
          </div>

          {/* Right: User */}
          {/* Right: User */}
          <div className="d-flex align-items-center gap-3 flex-nowrap position-relative">
            <span className="text-white d-none d-lg-inline">
              Welcome <strong>{username || "Admin"}</strong>
            </span>
            <Dropdown
              isOpen={userDropdownOpen}
              toggle={this.toggleUserDropdown}
            >
              <DropdownToggle tag="span">
                <i className="las la-user-circle fs-2 text-white cursor-pointer"></i>
              </DropdownToggle>
              <DropdownMenu end>
                {dropdownItem(userId).map((item) => (
                  <DropdownItem
                    key={item.id}
                    onClick={() => this.handleUserActionClick(item)}
                  >
                    <i className={`la ${item.icon} me-2`}></i>
                    {item.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Mobile Menu */}
          {this.state.isMobileMenuOpen && (
            <div
              className="d-md-none bg-dark text-white p-3"
              style={{
                position: "absolute",
                top: "60px",
                left: 0,
                right: 0,
                zIndex: 999,
              }}
            >
              {this.renderMenuItems(true)}
            </div>
          )}
        </Navbar>

        {/* Dashboard content */}
        <div className="dashboard-wrapper">
          <div className="dashboard-content">
            {accountType === "db_admin" && (
              <DBAdminDashboardArea
                activeTab={activeTab}
                onTabChange={this.handleTabChange}
              />
            )}
            {accountType === "reg_admin" && (
              <RegAdminDashboardArea
                activeTab={activeTab}
                onTabChange={this.handleTabChange}
              />
            )}
            {accountType === "employer" && (
              <CompanyDashboardArea
                activeTab={activeTab}
                onTabChange={this.handleTabChange}
                jobListFilterStatus={this.state.jobListFilterStatus}
              />
            )}
            {accountType === "candidate" && (
              <CandidateDashboardArea
                activeTab={activeTab}
                onProfileComplete={this.handleProfileComplete}
              />
            )}
          </div>

          <DashboardFooter className="dashboard-footer" />
        </div>
      </>
    );
  }
}

export default DashboardHeader;
