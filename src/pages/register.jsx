import dynamic from "next/dynamic";
import Seo from "../components/seo";
import Header from "../layout/header";
import RegisterForm from "../components/register";
import CandidateRegisterForm from "../components/register";
const Page = () => {
  return (
    <>
      <Seo pageTitle="Register" />
      <Header />
      <RegisterForm />
      {/* <CandidateRegisterForm /> */}
    </>
  );
};

// export default dynamic(() => Promise.resolve(index), { ssr: false });

export default Page;
