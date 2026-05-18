import dynamic from "next/dynamic";
import Seo from "../components/seo";
import ContactUs from "../components/contact-us/index";
// import Header from "../layout/header";
import Footer from "../layout/dashboard-footer";

const Page = () => {
  return (
    <>
      <Seo pageTitle="Contact Us" />
      {/* <Header /> */}
      <ContactUs />
      <Footer />
    </>
  );
};

export default Page;
