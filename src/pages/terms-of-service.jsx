import dynamic from "next/dynamic";
import Seo from "../components/seo";
import TermsOfService from "../components/terms-of-service/index";
// import Header from "../layout/header";
import Footer from "../layout/dashboard-footer";

const Page = () => {
  return (
    <>
      <Seo pageTitle="Terms of Service" />
      <Footer />
      {/* <Header /> */}
      <TermsOfService />
    </>
  );
};

export default Page;
