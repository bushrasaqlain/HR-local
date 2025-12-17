import Header from "../layout/header";
import Seo from "../components/seo";
import Invoice from "../components/invoice";
import Footer from "../layout/Footer";
const Page = () => {
  return (
    <>
      <Seo pageTitle="Invoice" />
      <Header />
      <Invoice />
      <Footer />
    </>
  );
};

export default Page;
