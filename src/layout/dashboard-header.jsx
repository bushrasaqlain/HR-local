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
import NotificationCenter from "../components/company-dashboard/Notificationcenter";
import MessagesDropdown from "../components/company-dashboard/dashboard/MessagesDropdown";
import CandidateJobAlertsDropdown from "../components/candidate-dashboard/dashboard/CandidateJobAlertsDropdown";
import CandidateJobAlertsPage from "../components/candidate-dashboard/dashboard/CandidateJobAlertsPage";
import axios from "axios";

const EMPLOYER_ROUTE_MAP = {
  profile: "/employer",
  companyProfile: "/employer/update-profile",
  postJob: "/employer/post-job",
  jobList: "/employer/job-list",
  allApplicants: "/employer/applicants",
  shortlistedcandidates: "/employer/shortlisted",
  approved: "/employer/approved",
  availableCandidates: "/employer/candidates",
  packagesList: "/employer/packages",
  viewpackage: "/employer/pricing",
  wallet: "/employer/wallet",
  messages: "/employer/messages",
};

const CANDIDATE_ROUTE_MAP = {
  profile: "/candidate",
  lists: "/candidate/job-list",
  appliedJobs: "/candidate/applied-jobs",
  register: "/candidate/register",
  candidatewallet: "/candidate/wallet", 
   messages: "/candidate/messages",      
  jobAlerts: "/candidate/job-alerts",
};

const DB_ADMIN_ROUTE_MAP = {
  country: "/admin/countries",
  district: "/admin/districts",
  city: "/admin/cities",
  institute: "/admin/institutes",
  degreetype: "/admin/degree-types",
  degreefields: "/admin/degree-fields",
  skills: "/admin/skills",
  speciality: "/admin/specialties",
  businessentitytypes: "/admin/business-entities",
  jobtypes: "/admin/job-types",
  jobtitles: "/admin/job-titles",
  packages: "/admin/packages",
  licensetypes: "/admin/license-types",
  bank: "/admin/banks",
  currency: "/admin/currencies",
};

const REG_ADMIN_ROUTE_MAP = {
  company: "/admin/companies",
  candidate: "/admin/candidates",
  job: "/admin/jobs",
  boosts: "/admin/boosts",
  contactMessages: "/admin/contact-messages",
};

function getRouteMap(accountType) {
  switch (accountType) {
    case "employer": return EMPLOYER_ROUTE_MAP;
    case "candidate": return CANDIDATE_ROUTE_MAP;
    case "db_admin": return DB_ADMIN_ROUTE_MAP;
    case "reg_admin": return REG_ADMIN_ROUTE_MAP;
    default: return {};
  }
}

class DashboardHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      jobAlertSelectedId: null,
      navbar: false,
      userDropdownOpen: false,
      menuDropdownOpen: false,
      isOpen: false,
      isMobileMenuOpen: false,
      openMobileDropdown: null,
      activeTab: null,
      selectedMessageContact: null,
      unreadCount: 0,
      profileGroup: false,
      jobsGroup: false,
      userInfo: { userId: null, displayName: "User", accountType: null, profileCompleted: false },
      jobListFilterStatus: null,
      openDesktopDropdown: null,
      packages: [],
      alertSettings: {
        lowCredits: { enabled: true, threshold: 20 },
        packageExpiry: { enabled: true, daysBefore: 7 },
        budgetThreshold: { enabled: false, threshold: 80 },
        unusualSpending: { enabled: true, sensitivity: "medium" },
      },
    };
  }

  componentDidMount() {
    const userId = sessionStorage.getItem("userId");
    const displayName = sessionStorage.getItem("displayName") || "User";
    const accountType = sessionStorage.getItem("accountType");
    const profileCompleted =
      sessionStorage.getItem("profile_completed") === "true";

    const savedTab = sessionStorage.getItem("activeTab");

    if (!accountType) return;

    const publicPages = ["/privacy-policy", "/terms-of-service", "/contact-us"];
    if (typeof window !== "undefined" && publicPages.includes(window.location.pathname)) {
      this.setState({
        userInfo: { userId, displayName, accountType, profileCompleted },
      });
      window.addEventListener("scroll", this.changeBackground);
      return;
    }

    const validTabs = [
      "profile",
      "postJob",
      "companyProfile",
      "allApplicants",
      "jobList",
      "packagesList",
      "viewpackage",
      "shortlistedcandidates",
      "approved",
      "chatBox",
      "changepassword",
      "messages",
      "lists",
      "appliedJobs",
      "jobAlerts",
    ];

    const safeTab =
      savedTab && validTabs.includes(savedTab)
        ? savedTab
        : accountType === "db_admin"
          ? "country"
          : accountType === "reg_admin"
            ? "company"
            : accountType === "employer"
              ? "profile"
              : accountType === "candidate"
                ? profileCompleted
                  ? "profile"
                  : "register"
                : null;

    this.setState({
      userInfo: { userId, displayName, accountType, profileCompleted },
      activeTab: safeTab,
    });

    if (safeTab && typeof window !== "undefined") {
      const routeMap = getRouteMap(accountType);
      const path = routeMap[safeTab];
      if (path) {
        window.history.replaceState(
          { ...window.history.state, tabKey: safeTab },
          "",
          path
        );
      }
    }
    if (accountType === "employer") {
      this.fetchPackagesForNotifications(userId);
      this.fetchUnreadCount(userId);
      this.unreadInterval = setInterval(() => this.fetchUnreadCount(userId), 3000);
    }
    if (accountType === "candidate" && profileCompleted) {
      this.fetchUnreadCount(userId);
      this.unreadInterval = setInterval(() => this.fetchUnreadCount(userId), 3000);
    }

    window.addEventListener("scroll", this.changeBackground);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.changeBackground);
    clearInterval(this.unreadInterval);
  }

  toggleNavbar = () => {
    this.setState((prev) => ({ isOpen: !prev.isOpen }));
  };

  toggleMobileMenu = () => {
    this.setState((prev) => ({
      isMobileMenuOpen: !prev.isMobileMenuOpen,
      openMobileDropdown: null,
    }));
  };

  fetchPackagesForNotifications = async (userId) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await axios.get(`${apiBaseUrl}job/getUserPackages/${userId}`);

      const subPackages = res.data
        .filter(p => !p.is_daily_budget)
        .map((p) => {
          const pkg = (() => {
            try { return typeof p.package === "string" ? JSON.parse(p.package) : (p.package || {}); }
            catch { return {}; }
          })();
          const total = pkg.pricing_model === "featured_boost" ? pkg.boost_duration_days || 0
            : pkg.pricing_model === "job_slot" ? pkg.slot_count || 0
              : pkg.pricing_model === "cv_credits" ? pkg.credit_count || 0
                : pkg.num_posts || pkg.slot_count || pkg.credit_count || 0;
          const used = p.used_posts || p.used_credits || p.used_slots || 0;
          return {
            id: p.subscription_id,
            name: pkg.name || "Package",
            type: pkg.pricing_model || "bundle",
            total, used,
            remaining: Math.max(total - used, 0),
            price: pkg.price || 0,
            status: p.status || "active",
            expiresRaw: p.end_date || null,
            isDailyBudget: false,
          };
        });

      const dailyPackages = res.data
        .filter(p => p.is_daily_budget)
        .map((p) => {
          const pkg = p.package || {};
          return {
            id: p.subscription_id,
            name: pkg.name || "Job Post",
            type: "daily_budget",
            total: pkg.daily_budget_cap || 0,
            used: pkg.total_spend || 0,
            remaining: Math.max((pkg.daily_budget_cap || 0) - (pkg.total_spend || 0), 0),
            price: pkg.total_spend || 0,
            status: p.status,
            expiresRaw: p.end_date || null,
            isDailyBudget: true,
            billingModel: pkg.billing_model,
            ratePerUnit: pkg.rate_per_unit,
            dailyCapToday: pkg.daily_budget_cap,
            dailySpendToday: pkg.daily_spend_today || 0,
          };
        });

      try {
        const alertRes = await axios.get(`${apiBaseUrl}alert-settings/get/${userId}`);
        if (alertRes.data.success && alertRes.data.data) {
          this.setState({ alertSettings: alertRes.data.data });
        }
      } catch (e) { /* default settings use honge */ }

      this.setState({ packages: [...subPackages, ...dailyPackages] });
    } catch (err) {
      console.error("Notification packages fetch failed:", err);
    }
  };

  fetchUnreadCount = async (userId) => {
    if (!userId) return;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await axios.get(`${apiBaseUrl}message/contacts/unread-count/${userId}`);
      if (res.data?.unreadCount !== undefined) {
        this.setState({ unreadCount: res.data.unreadCount });
      }
    } catch (err) {
      console.error("Unread count fetch failed:", err);
    }
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

  handleOpenMessages = (contact) => {
    this.setState({ selectedMessageContact: contact });
    this.handleTabChange("messages");
  };

  handleCandidateOpenMessages = (contact) => {
    if (!contact) {
      this.handleTabChange("messages");
      return;
    }

    this.setState({
      selectedMessageContact: {
        id: contact.id,
        full_name: contact.full_name,
        jobId: contact.jobId || null,
      },
    });

    this.handleTabChange("messages");
  };

  handleCandidateViewAlert = (alert) => {
    this.setState({
      jobAlertSelectedId: alert ? alert.alert_id : null,
    });
    this.handleTabChange("jobAlerts");
  };

  handleUserActionClick = (item) => {
    if (item.tabKey === "logout") {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("accountType");
      sessionStorage.removeItem("displayName");
      sessionStorage.removeItem("profile_completed");
      window.location.href = "/";
    } else {
      this.handleTabChange(item.tabKey);
    }
    this.setState({ userDropdownOpen: false });
  };

  handleTabChange = (tabKey, filterStatus = null) => {
    sessionStorage.setItem("activeTab", tabKey);
    this.setState({
      activeTab: tabKey,
      jobListFilterStatus: filterStatus,
    });

    if (typeof window !== "undefined") {
      const accountType = sessionStorage.getItem("accountType");
      const routeMap = getRouteMap(accountType);
      const path = routeMap[tabKey];
      if (path && window.history) {
        window.history.replaceState(
          { ...window.history.state, tabKey },
          "",
          path
        );
      }
    }
  };

  handleViewJobFromAlert = (jobAlert) => {
    const jobId = jobAlert.job_id || jobAlert.id;

    if (jobId) {
      sessionStorage.setItem('highlightJobId', jobId);

      this.handleTabChange("profile");

      setTimeout(() => {
        const event = new CustomEvent('highlightJobFromAlert', {
          detail: { jobId: jobId }
        });
        window.dispatchEvent(event);

        setTimeout(() => {
          const section = document.getElementById("matching-jobs-section");
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 500);
      }, 500);
    }
  };

  renderMenuItems = (isMobile) => {
    const { userInfo, activeTab, openMobileDropdown } = this.state;
    const accountType = userInfo?.accountType;
    const profileCompleted = userInfo?.profileCompleted;

    if (!accountType) return null;

    if (accountType === "employer") {
      const hasPackage = sessionStorage.getItem("has_package") === "true";
      // if (!profileCompleted) {
      //   // Sirf Update Profile button
      //   return (
      //     <NavItem key="update-profile">
      //       <Button
      //         color="custom-progress-bar"
      //         outline
      //         className="text-white border-bottom border-white border-2"
      //         onClick={() => { window.location.href = "/company-profile"; }}
      //       >
      //         <i className="las la-user-edit me-1"></i>
      //         Update Profile
      //       </Button>
      //     </NavItem>
      //   );
      // }

      // if (!hasPackage) {
      //   // Sirf Buy Package button
      //   return (
      //     <NavItem key="buy-package">
      //       <Button
      //         color="custom-progress-bar"
      //         outline
      //         className="text-white border-bottom border-white border-2"
      //         onClick={() => { window.location.href = "/company-packages"; }}
      //       >
      //         <i className="las la-box me-1"></i>
      //         Buy Package
      //       </Button>
      //     </NavItem>
      //   );
      // }
    }

    let items = [];
    if (accountType === "db_admin") items = dbadminmenuitem;
    else if (accountType === "reg_admin") items = regadminmenuitem;
    else if (accountType === "employer") {
      if (!profileCompleted) {
        return null;
      }
      items = companymenuitem;
    } else if (accountType === "candidate") {
      items = profileCompleted
        ? candidatesmenuitem.filter(
          (item) =>
            item.key === "profile" ||
            item.key === "lists" ||
            item.key === "appliedJobs" ||
            item.key === "chatbox"||
            item.key === "candidatewallet",
        )
        : candidatesmenuitem.filter((item) => item.key === "register");
    }

    return items.map((item) => {
      if (!item.children) {
        const { unreadCount } = this.state;
        const isMessages = item.key === "messages";
        return (
          <NavItem key={item.key} className={isMobile ? "mb-2" : ""}>
            <Button
              color="custom-progress-bar"
              outline
              className={`text-white ${activeTab === item.key ? "border-bottom border-white border-2" : ""}`}
              onClick={() => {
                if (this.props.headerOnly) {
                  window.history.back();
                  return;
                }
                this.handleTabChange(item.key);
                if (isMessages) this.setState({ unreadCount: 0 });
                this.setState({
                  isMobileMenuOpen: false,
                  openMobileDropdown: null,
                });
              }}
            >
              <i className={`las ${item.icon} me-1`}></i>
              {item.label}
              {isMessages && unreadCount > 0 && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#e74c3c",
                  color: "#fff",
                  borderRadius: "50%",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 4px",
                  marginLeft: "6px",
                  lineHeight: 1,
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </NavItem>
        );
      }

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
            color="custom-progress-bar text-white"
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
            className="custom-progress-bar"
            style={{
              backgroundColor: "#36565F",
              width: isMobile ? "100%" : undefined,
            }}
          >
            {item.children.map((child) => (
              <DropdownItem
                key={child.key}
                onClick={() => {
                  if (this.props.headerOnly) {
                    window.history.back();
                    return;
                  }
                  this.handleTabChange(child.key);
                  this.setState({
                    isMobileMenuOpen: false,
                    openMobileDropdown: null,
                    openDesktopDropdown: null,
                    [item.key]: false,
                  });
                }}
                style={{
                  color: activeTab === child.key ? "#36565F" : "#fff",
                  backgroundColor:
                    activeTab === child.key ? "#e2f0f0" : "#36565F",
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
    const { headerOnly } = this.props;
    const { navbar, userDropdownOpen, menuDropdownOpen, activeTab, userInfo } =
      this.state;
    const { accountType, displayName, userId, profileCompleted } = userInfo;

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
        <Navbar expand="md" fixed="top" className="shadow-sm custom-bg">
          <div className="container-fluid d-flex align-items-center justify-content-between flex-nowrap py-2">

            {/* LEFT: Logo + Desktop Menu */}
            <div className="d-flex align-items-center gap-3 flex-nowrap">
              <NavbarBrand href="/">
                <Image width={154} height={50} src="/images/logo-2.svg" alt="brand" />
              </NavbarBrand>

              {/* Desktop Menu — sirf md+ pe */}
              <div className="d-none d-md-flex align-items-center gap-3">
                {this.renderMenuItems(false)}
              </div>
            </div>

            {/* RIGHT: Desktop icons + Mobile icons + Hamburger — sab ek saath */}
            <div className="d-flex align-items-center gap-2 flex-nowrap">

              {/* Desktop: Notification + Message + Name + User icon */}
              <div className="d-none d-md-flex align-items-center gap-3">
                {accountType === "employer" && profileCompleted && (
                  <>
                    <NotificationCenter userId={userId} apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL} />
                    <MessagesDropdown
                      userId={userId}
                      apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
                      onOpenMessages={this.handleOpenMessages}
                      externalUnreadCount={this.state.unreadCount}
                    />
                  </>
                )}
                {accountType === "candidate" && profileCompleted && (
                  <>
                    <CandidateJobAlertsDropdown userId={userId} apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL} onViewAlert={this.handleCandidateViewAlert} />
                    <MessagesDropdown
                      userId={userId}
                      apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
                      onOpenMessages={this.handleCandidateOpenMessages}
                      externalUnreadCount={this.state.unreadCount}
                    />
                  </>
                )}
                <span className="text-white" style={{ whiteSpace: "nowrap" }}>
                  <strong>{displayName || "Admin"}</strong>
                </span>
                <Dropdown isOpen={userDropdownOpen} toggle={this.toggleUserDropdown}>
                  <DropdownToggle tag="span">
                    <i className="las la-user-circle fs-2 text-white cursor-pointer"></i>
                  </DropdownToggle>
                  <DropdownMenu end>
                    {dropdownItem(userId, accountType).map((item) => (
                      <DropdownItem key={item.id} onClick={() => this.handleUserActionClick(item)}>
                        <i className={`la ${item.icon} me-2`}></i>
                        {item.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* ✅ Mobile: Notification + Message icons — logo ke saath same line */}
              <div className="d-flex d-md-none align-items-center gap-2">
                {accountType === "employer" && profileCompleted && (
                  <>
                    <NotificationCenter userId={userId} apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL} />
                    <MessagesDropdown
                      userId={userId}
                      apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
                      onOpenMessages={this.handleOpenMessages}
                      externalUnreadCount={this.state.unreadCount}
                    />
                  </>
                )}
                {accountType === "candidate" && profileCompleted && (
                  <>
                    <CandidateJobAlertsDropdown userId={userId} apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL} onViewAlert={this.handleCandidateViewAlert} />
                    <MessagesDropdown
                      userId={userId}
                      apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
                      onOpenMessages={this.handleCandidateOpenMessages}
                      externalUnreadCount={this.state.unreadCount}
                    />
                  </>
                )}
              </div>

              {/* ✅ Hamburger — sirf mobile pe, icons ke baad */}
              <NavbarToggler onClick={this.toggleMobileMenu} className="d-md-none" />

            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {this.state.isMobileMenuOpen && (
            <div
              className="d-md-none custom-progress-bar text-white p-3"
              style={{ position: "absolute", top: "60px", left: 0, right: 0, zIndex: 999 }}
            >
              {this.renderMenuItems(true)}
              <div className="my-2 px-2 p-2 border-top border-bottom custom-progress-bar">
                <strong>{displayName || "Admin"}</strong>
              </div>
              <div className="mt-3">
                {dropdownItem(userId, accountType).map((item) => (
                  <div key={item.id} className="p-2 text-white cursor-pointer" onClick={() => this.handleUserActionClick(item)}>
                    <i className={`la ${item.icon} me-2`}></i>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Navbar>

        {/* Dashboard content */}
        {!headerOnly && (
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
                  profileCompleted={profileCompleted}
                  onProfileComplete={this.handleProfileComplete}
                  selectedMessageContact={this.state.selectedMessageContact}
                />
              )}
              {accountType === "candidate" && activeTab === "jobAlerts" ? (
                <CandidateJobAlertsPage
                  apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL}
                  onViewJob={this.handleViewJobFromAlert}
                  initialAlertId={this.state.jobAlertSelectedId}
                  onBack={() => this.handleTabChange("profile")}
                  onApply={() => {
                    this.handleTabChange("profile");
                    setTimeout(() => {
                      const section = document.getElementById("matching-jobs-section");
                      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 300);
                  }}
                />
              ) : accountType === "candidate" ? (
                <CandidateDashboardArea
                  activeTab={activeTab}
                  onProfileComplete={this.handleProfileComplete}
                  selectedMessageContact={this.state.selectedMessageContact}
                />
              ) : null}
            </div>

            <DashboardFooter className="dashboard-footer" />
          </div>
        )}
      </>
    );
  }
}

function DashboardHeaderWrapper(props) {
  const router = useRouter();
  return <DashboardHeader {...props} router={router} />;
}

export default DashboardHeaderWrapper;