import { useRouter } from "next/router";
import Seo from "../components/seo";
import Header from "../layout/header";

// Components
import Home from "../components/home";
import About from "../components/about/index";
import Faq from "../components/faq";
import Terms from "../components/terms";
import Pricing from "../components/pricing";
import LogIn from "../components/login/index";
import RegisterForm from "../components/register";

const Index = () => {
  const router = useRouter();
  const { page } = router.query;

  // 🔥 Page Switch Logic
  const renderPage = () => {
    switch (page) {
      case "about":
        return { component: <About />, title: "About" };

      case "faq":
        return { component: <Faq />, title: "Faq" };

      case "terms":
        return { component: <Terms />, title: "Terms" };

      case "pricing":
        return { component: <Pricing />, title: "Pricing" };

      case "login":
        return { component: <LogIn />, title: "Login" };

      case "register":
        return { component: <RegisterForm />, title: "Register" };

      default:
        return { component: <Home />, title: "Home" };
    }
  };

  const { component, title } = renderPage();

  return (
    <>
      <Seo pageTitle={title} />
      <Header />
      {component}
    </>
  );
};

export default Index;