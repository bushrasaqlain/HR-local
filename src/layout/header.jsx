"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar, NavbarBrand, Nav, NavItem, Button, Collapse } from "reactstrap";
import HeaderNavContent from "./HeaderNavContent";
import Image from "next/image";

const DefaulHeader2 = () => {
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  useEffect(() => {
    setMounted(true);

    const changeBackground = () => {
      setNavbarScrolled(window.scrollY >= 10);
    };

    window.addEventListener("scroll", changeBackground);
    return () => window.removeEventListener("scroll", changeBackground);
  }, []);

  // 🔑 Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <Navbar
      expand="lg"
      light
      fixed={navbarScrolled ? "top" : undefined}
      className={`shadow-sm py-2 ${navbarScrolled ? "bg-light" : "bg-transparent"}`}
    >
      <div className="container d-flex align-items-center justify-content-between">
        <NavbarBrand>
          <Link href="/">
            <Image src="/images/logo.svg" width={154} height={50} alt="brand" />
          </Link>
        </NavbarBrand>

        <Button color="primary" onClick={toggle} className="d-lg-none">
          ☰
        </Button>

        <Collapse isOpen={isOpen} navbar className="justify-content-between">
          <HeaderNavContent />
           <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
            <Link href="/candidates-dashboard/cv-manager" passHref>
              <Button color="secondary" outline>Upload CV</Button>
            </Link>
            <Link href="/login" passHref>
              <Button color="info" outline>Login / Register</Button>
            </Link>
            <Link href="/employers-dashboard/post-jobs" passHref>
              <Button color="success">Job Post</Button>
            </Link>
          </div>
        </Collapse>
      </div>
    </Navbar>
  );
};

export default DefaulHeader2;
