"use client";

import React, { Component } from "react";
import Link from "next/link";
import { Navbar, NavbarBrand, Collapse, NavbarToggler } from "reactstrap";
import HeaderNavContent from "./HeaderNavContent";
import Image from "next/image";

class DefaulHeader2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      navbarScrolled: false,
      isOpen: false,
      mounted: false,
      isMobileView: false,
    };
  }

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  handleScroll = () => {
    this.setState({ navbarScrolled: window.scrollY >= 10 });
  };

  updateViewport = () => {
    // Bootstrap lg breakpoint is 992px
    this.setState({ isMobileView: window.innerWidth < 992 });
  };

  componentDidMount() {
    this.setState({ mounted: true });
    this.updateViewport();
    window.addEventListener("scroll", this.handleScroll);
    window.addEventListener("resize", this.updateViewport);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.updateViewport);
  }

  render() {
    const { navbarScrolled, isOpen, mounted, isMobileView } = this.state;

    if (!mounted) return null;

    return (
      <Navbar
        expand="lg"
        fixed="top"
        className={`hunar-navbar py-2 ${navbarScrolled ? "hunar-navbar--scrolled" : ""
          }`}
      >
        <div
          className="container d-flex align-items-center justify-content-between"
          style={{ position: "relative" }}
        >
          {/* Brand */}
          <NavbarBrand className="p-0">
            <Link href="/" className="d-flex align-items-center text-decoration-none">
              <Image
                src="/images/12.png"
                width={120}
                height={60}
                alt="Hunar"
                priority
              />
            </Link>
          </NavbarBrand>

          {/* Mobile toggler */}
          {isMobileView && (
            <NavbarToggler
              onClick={this.toggle}
              className="hunar-toggler d-lg-none"
              aria-label="Toggle navigation"
            >
              <span aria-hidden="true">&#9776;</span>
            </NavbarToggler>
          )}

          {/* Desktop nav */}
          <div className="d-none d-lg-flex flex-grow-1 justify-content-end align-items-center gap-4">
            <div className="hunar-links d-flex align-items-center">
              <HeaderNavContent />
            </div>

            <div className="d-flex align-items-center gap-3">
              <Link href="/login" className="hunar-signin text-decoration-none">
                Sign in
              </Link>
              <Link href="/register" className="hunar-cta text-decoration-none">
                Get started
              </Link>
            </div>
          </div>

          {/* Mobile collapse menu */}
          {isMobileView && (
            <Collapse
              isOpen={isOpen}
              navbar
              className="d-lg-none"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 1050,
              }}
            >
              <div className="hunar-mobile-panel d-flex flex-column gap-2 px-3 py-3">
                <div className="w-100 hunar-links hunar-links--mobile">
                  <HeaderNavContent isMobile />
                </div>

                <Link href="/login" className="hunar-signin-mobile text-decoration-none">
                  Sign in
                </Link>
                <Link href="/register" className="hunar-cta hunar-cta--mobile text-decoration-none text-center">
                  Get started
                </Link>
              </div>
            </Collapse>
          )}
        </div>

        
      </Navbar>
    );
  }
}

export default DefaulHeader2;