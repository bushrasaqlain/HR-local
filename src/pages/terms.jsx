import Seo from "../components/seo";
import Header from "../layout/header";
import Terms from "../components/terms";
import Footer from "../layout/Footer";
const Page = () => {
  return (
    <>
      <Seo pageTitle="Terms" />
      <Header />
      <Terms />
      <Footer />
    </>
  );
};

export default Page;
