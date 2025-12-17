import Seo from "../components/seo";
import Pricing from "../components/pricing";
import Header from "../layout/header";
import Footer from "../layout/Footer";
const Page = () => {
  return (
    <>
      <Seo pageTitle="Pricing" />
      <Header />
      <Pricing />
      <Footer />
    </>
  );
};

export default Page;
