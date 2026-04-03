"use client";

import React, { Component } from "react";
import Link from "next/link";
import {
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import { withRouter } from "next/router";

const navStyles = `
  .nav-underline-item {
    position: relative;
  }

  .nav-underline-link {
    position: relative;
    color: #36565F !important;
    font-weight: 500;
    padding: 8px 14px !important;
    border-radius: 0 !important;
    text-decoration: none !important;
    transition: color 0.25s ease, font-weight 0.25s ease;
    display: inline-block;
  }

  .nav-underline-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 14px;
    right: 14px;
    height: 2px;
    background-color: #36565F;
    border-radius: 2px;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.25s ease;
  }

  .nav-underline-link:hover::after,
  .nav-underline-link.active-link::after {
    transform: scaleX(1);
  }

  .nav-underline-link.active-link {
    font-weight: 600 !important;
  }

  .nav-underline-link:hover {
    color: #1e3d44 !important;
  }
`;

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/?page=about" },
  { label: "FAQ's", href: "/?page=faq" },
  { label: "Terms", href: "/?page=terms" },
];

class HeaderNavContent extends Component {
  isActive(href) {
    const { router } = this.props;
    if (href === "/") return router.asPath === "/";
    return router.asPath === href;
  }

  render() {
    const { isMobile = false } = this.props;

    return (
      <>
        <style>{navStyles}</style>
        <Nav navbar className={`${isMobile ? "w-100" : "me-auto"} navbar-nav`}>
          {navItems.map(({ label, href }) => (
            <NavItem key={href} className="nav-underline-item">
              <NavLink
                tag={Link}
                href={href}
                className={`nav-link nav-underline-link ${this.isActive(href) ? "active-link" : ""}`}
              >
                {label}
              </NavLink>
            </NavItem>
          ))}
        </Nav>
      </>
    );
  }
}

export default withRouter(HeaderNavContent);