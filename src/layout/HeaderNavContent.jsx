import Link from "next/link";
import { isActiveLink } from "../../lib/linkActiveChecker";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const HeaderNavContent = () => {
  const router = useRouter();
  const [navbar, setNavbar] = useState(false);

  const changeBackground = () => {
    if (window.scrollY >= 10) {
      setNavbar(true);
    } else {
      setNavbar(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", changeBackground);
  }, []);

  return (
    <nav className="nav main-menu">
      <ul className="navigation" id="navbar">
        {/* Home */}
        <li className={isActiveLink("/", router.asPath) ? "current" : ""}>
          <Link href="/">
            <span>Home</span>
          </Link>
        </li>

        {/* Jobs List */}
        <li
          className={
            isActiveLink("/job-list/job-list-v5", router.asPath)
              ? "current"
              : ""
          }
        >
          <Link href="/job-list/job-list-v5">Jobs List</Link>
        </li>

        {/* Employers List */}
        <li
          className={
            isActiveLink("/employers-list/employers-list-v1", router.asPath)
              ? "current"
              : ""
          }
        >
          <Link href="/employers-list/employers-list-v1">Employers</Link>
        </li>

        {/* Candidates List */}
        <li
          className={
            isActiveLink("/candidates-list/candidates-list-v2", router.asPath)
              ? "current"
              : ""
          }
        >
          <Link href="/candidates-list/candidates-list-v2">Candidates</Link>
        </li>

        {/* Pages Dropdown */}
        <li className="dropdown">
          <span>Pages</span>
          <ul>
            <li
              className={isActiveLink("/about", router.asPath) ? "current" : ""}
            >
              <Link href="/about">About</Link>
            </li>

            <li
              className={
                isActiveLink("/pricing", router.asPath) ? "current" : ""
              }
            >
              <Link href="/pricing">Pricing</Link>
            </li>

            <li
              className={isActiveLink("/faq", router.asPath) ? "current" : ""}
            >
              <Link href="/faq">FAQ's</Link>
            </li>

            <li
              className={isActiveLink("/terms", router.asPath) ? "current" : ""}
            >
              <Link href="/terms">Terms</Link>
            </li>

            <li
              className={
                isActiveLink("/invoice", router.asPath) ? "current" : ""
              }
            >
              <Link href="/invoice">Invoice</Link>
            </li>

            <li
              className={
                isActiveLink("/contact", router.asPath) ? "current" : ""
              }
            >
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
};

export default HeaderNavContent;
