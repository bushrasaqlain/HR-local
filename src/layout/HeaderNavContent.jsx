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
  /* Add this to your header/navbar wrapper element */
  .navbar-glass {
  background: rgba(30, 50, 56, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
}
  .nav-underline-item { position: relative; }

  .nav-underline-link {
    position: relative;
    color: inherit !important;
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
     color: inherit !important;
    bottom: 0;
    left: 14px;
    right: 14px;
    height: 2px;
    background-color: #fff;
    border-radius: 2px;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.25s ease;
  }

  .nav-underline-link:hover::after,
  .nav-underline-link.active-link::after { transform: scaleX(1); }

  .nav-underline-link.active-link { font-weight: 600 !important; }

  .nav-underline-link:hover { color: #fff !important; }
`;

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "FAQ's", href: "/faq" },
  { label: "Terms", href: "/terms" },
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