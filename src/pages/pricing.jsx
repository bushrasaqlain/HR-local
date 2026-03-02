import Seo from "../components/seo";
import Pricing from "../components/pricing";
import Header from "../layout/header";
const Page = () => {
  return (
    <>
      <Seo pageTitle="Pricing" />
      <Header />
      <Pricing />
    </>
  );
};

export default Page;
