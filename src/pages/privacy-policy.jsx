import Seo from "../components/seo";
import PrivacyPolicy from "../components/privacy-policy/index";
// import Header from "../layout/header";
import Footer from "../layout/dashboard-footer";

const Page = () => {
  return (
    <>
      <Seo pageTitle="Privacy Policy" />
      <Footer />
      {/* <Header /> */}
      <PrivacyPolicy />
    </>
  );
};

export default Page;