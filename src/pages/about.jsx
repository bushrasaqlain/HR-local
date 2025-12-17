import dynamic from "next/dynamic";
import Seo from "../components/seo";
import About from "../components/about/index";
import Header from "../layout/header";
import Footer from "../layout/Footer";
const Page = () => {
  return (
    <>
      <Seo pageTitle="About" />
      <Header />
      <About />
      <Footer />
    </>
  );
};

export default Page;
