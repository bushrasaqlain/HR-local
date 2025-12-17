import Seo from "../components/seo";
import Contact from "../components/contact";
import Header from "../layout/header";
import Footer from "../layout/Footer";
const Page = () => {
  return (
    <>
      <Seo pageTitle="Contact" />
           <Header />
      <Contact />
       <Footer />
    </>
  );
};

export default Page;
