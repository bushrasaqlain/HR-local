import Header from "../layout/header";
import Seo from "../components/seo";
import Home from "../components/home";
import Footer from "../layout/Footer";

const Index = () => {
  return (
    <>
      <Seo pageTitle="Home" />
      <Header />
      <Home />
      <Footer />
    </>

  );
};

export default Index;
