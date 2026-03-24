"use client";

import React, { Component } from "react";
import Link from "next/link";
import { Navbar, NavbarBrand, Collapse, NavbarToggler } from "reactstrap";
import HeaderNavContent from "./HeaderNavContent";
import Image from "next/image";
import { Button } from "react-bootstrap";

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
        className={`navbar-light shadow-sm py-2 ${navbarScrolled ? "navbar-glass" : "navbar-solid"
          }`}
      >
        {/* Container is relative to allow absolute dropdown */}
        <div
          className="container d-flex align-items-center justify-content-between"
          style={{ position: "relative" }}
        >
          {/* Brand */}
          <NavbarBrand>
            <Link href="/">
              <Image
                src="/images/logo.svg"
                width={154}
                height={50}
                alt="brand"
              />
            </Link>
          </NavbarBrand>

          {/* Mobile toggler (only render on small screens) */}
          {isMobileView && (
            <NavbarToggler
              onClick={this.toggle}
              className="d-lg-none border-0 shadow-none"
              aria-label="Toggle navigation"
            >
              <span aria-hidden="true">☰</span>
            </NavbarToggler>
          )}

          {/* Desktop nav */}
          <div className="d-none d-lg-flex flex-grow-1 justify-content-end align-items-center gap-3">
            <HeaderNavContent />

            <Button
              href="/?page=login"
              className="btn-outline-modern btn-dark text-center p-2 text-decoration-none"
            >
              Login / Register
            </Button>
            <Button
              href="/?page=login"
              className="btn-gradient btn-dark text-center p-2 text-decoration-none"
            >
              Post Job
            </Button>
          </div>

          {/* Mobile collapse menu (only render on small screens) */}
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
              <div
                className="mobile-nav-panel d-flex flex-column gap-2 px-3 py-3"
                style={{
                  backgroundColor: "white",
                  borderRadius: "0 0 8px 8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                <div className="w-100">
                  <HeaderNavContent isMobile />
                </div>

                <Link
                  href="/login"
                  className="btn-outline-modern text-left p-2 text-decoration-none text-black"
                >
                  Login / Register
                </Link>
                <Link
                  href="/login"
                  className="btn-gradient text-left p-2 text-decoration-none text-black"
                >
                  Post Job
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