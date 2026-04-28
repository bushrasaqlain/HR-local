import Seo from "../components/seo";
import Header from "../layout/header";
import Faq from "../components/faq";
import Footer from "../layout/footer";
const Page = () => {
  return (
    <>
      <Seo pageTitle="Faq" />
      <Header />
      <Faq />
      {/* <Footer /> */}
    </>
  );
};

export default Page;
