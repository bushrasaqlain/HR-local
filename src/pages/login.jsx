// import dynamic from "next/dynamic";
import Seo from "../components/seo";
import Header from "../layout/header";
import LogIn from "../components/login/index";

const Page = () => {
  return (
    <>
      <Seo pageTitle="Login" />
      <Header />
      <LogIn />
    </>
  );
};

// export default dynamic(() => Promise.resolve(index), { ssr: false });

export default Page;