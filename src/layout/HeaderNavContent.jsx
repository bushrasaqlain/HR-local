"use client";

import React, { Component } from "react";
import Link from "next/link";
import {
  Nav,
  NavItem,
  NavLink,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { withRouter } from "next/router"; // for class component
import { isActiveLink } from "../../lib/linkActiveChecker";
import { pageItems } from "./menuitem";

class HeaderNavContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false,
    };
  }

  toggleDropdown = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  };

  render() {
    const { dropdownOpen } = this.state;
    const { router, isMobile = false } = this.props;

    return (
      <Nav navbar className={`${isMobile ? "w-100" : "me-auto"} navbar-nav`}>
        <NavItem className="nav-item">
          <NavLink
            tag={Link}
            href="/"
            className="nav-link"
            style={{
              color: "#000000",
              fontWeight: router.asPath === "/" ? "600" : "500",
              transition: "all 0.3s ease",
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Home
          </NavLink>
        </NavItem>

        <NavItem className="nav-item">
          <NavLink
            tag={Link}
            href="/about"
            className="nav-link"
            style={{
              color: "#000000",
              fontWeight: router.asPath === "/" ? "600" : "500",
              transition: "all 0.3s ease",
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            About
          </NavLink>
        </NavItem>

        {/* <NavItem className="nav-item">
          <NavLink
            tag={Link}
            href="/pricing"
            className="nav-link"
            style={{
              color: "#000000",
              fontWeight: router.asPath === "/" ? "600" : "500",
              transition: "all 0.3s ease",
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Pricing
          </NavLink>
        </NavItem> */}

        <NavItem className="nav-item">
          <NavLink
            tag={Link}
            href="/faq"
            className="nav-link"
            style={{
              color: "#000000",
              fontWeight: router.asPath === "/" ? "600" : "500",
              transition: "all 0.3s ease",
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            FAQ's
          </NavLink>
        </NavItem>
<NavItem className="nav-item">
          <NavLink
            tag={Link}
            href="/terms"
            className="nav-link"
            style={{
              color: "#000000",
              fontWeight: router.asPath === "/" ? "600" : "500",
              transition: "all 0.3s ease",
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
           Terms
          </NavLink>
        </NavItem>

    
      </Nav>
    );
  }
}

// Wrap the class component with `withRouter` to get access to router
export default withRouter(HeaderNavContent);