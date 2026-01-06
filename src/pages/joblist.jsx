import dynamic from "next/dynamic";
import Seo from "../components/seo";
import JobListV5 from "../components/joblist";
import Footer from "../layout/Footer";
import Header from "../layout/header";
const index = () => {
  return (
    <>
      <Seo pageTitle="Job List V5" />
        <Header />
      <JobListV5 />
      <Footer />
      
    </>
  );
};

export default dynamic(() => Promise.resolve(index), { ssr: false });
