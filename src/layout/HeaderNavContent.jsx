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
import { isActiveLink } from "../../lib/linkActiveChecker";
import { pageItems } from "./menuitem";

class HeaderNavContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false,
    };

    this.toggleDropdown = this.toggleDropdown.bind(this);
  }

  toggleDropdown() {
    this.setState((prevState) => ({
      dropdownOpen: !prevState.dropdownOpen,
    }));
  }

  render() {
    const { router } = this.props;
    const { dropdownOpen } = this.state;

    return (
      <Nav navbar className="me-auto">
        <NavItem>
          <NavLink active={isActiveLink("/", router.asPath)}>
            <Link href="/">Home</Link>
          </NavLink>
        </NavItem>

        <NavItem>
          <NavLink active={isActiveLink("/joblist", router.asPath)}>
            <Link href="/joblist">Jobs List</Link>
          </NavLink>
        </NavItem>

        <NavItem>
          <NavLink active={isActiveLink("/employeeslist", router.asPath)}>
            <Link href="/employeeslist">Employers</Link>
          </NavLink>
        </NavItem>

        <NavItem>
          <NavLink active={isActiveLink("/candidateslist", router.asPath)}>
            <Link href="/candidateslist">Candidates</Link>
          </NavLink>
        </NavItem>

        {/* Pages Dropdown */}
        <Dropdown nav inNavbar isOpen={dropdownOpen} toggle={this.toggleDropdown}>
          <DropdownToggle nav caret>
            Pages
          </DropdownToggle>

          <DropdownMenu>
            {pageItems.map((item, index) => (
              <DropdownItem
                key={index}
                tag={Link}
                href={item.routePath}
                active={router.asPath === item.routePath}
              >
                {item.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </Nav>
    );
  }
}

export default HeaderNavContent;
