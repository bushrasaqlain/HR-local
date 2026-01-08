"use client";

import React, { Component } from "react";
import Link from "next/link";
import { Navbar, NavbarBrand, Button, Collapse } from "reactstrap";
import HeaderNavContent from "./HeaderNavContent";
import Image from "next/image";

class DefaulHeader2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      navbarScrolled: false,
      isOpen: false,
      mounted: false,
    };

    this.toggle = this.toggle.bind(this);
    this.changeBackground = this.changeBackground.bind(this);
  }

  componentDidMount() {
    this.setState({ mounted: true });
    window.addEventListener("scroll", this.changeBackground);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.changeBackground);
  }

  changeBackground() {
    this.setState({
      navbarScrolled: window.scrollY >= 10,
    });
  }

  toggle() {
    this.setState((prevState) => ({
      isOpen: !prevState.isOpen,
    }));
  }

  render() {
    const { navbarScrolled, isOpen, mounted } = this.state;

    // 🔑 Prevent hydration mismatch
    if (!mounted) return null;

    return (
      <Navbar
        expand="lg"
        light
        fixed={navbarScrolled ? "top" : undefined}
        className={`shadow-sm py-2 ${
          navbarScrolled ? "bg-light" : "bg-transparent"
        }`}
      >
        <div className="container d-flex align-items-center justify-content-between">
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

          <Button color="primary" onClick={this.toggle} className="d-lg-none">
            ☰
          </Button>

          <Collapse isOpen={isOpen} navbar className="justify-content-between">
            <HeaderNavContent />

            <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
              <Link href="/candidates-dashboard/cv-manager" passHref>
                <Button color="secondary" outline>
                  Upload CV
                </Button>
              </Link>

              <Link href="/login" passHref>
                <Button color="info" outline>
                  Login / Register
                </Button>
              </Link>

              <Link href="/employers-dashboard/post-jobs" passHref>
                <Button color="success">Job Post</Button>
              </Link>
            </div>
          </Collapse>
        </div>
      </Navbar>
    );
  }
}

export default DefaulHeader2;
