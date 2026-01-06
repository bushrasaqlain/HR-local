import Header from "../layout/header";
import Seo from "../components/seo";
import EmployersListV1 from "../components/employeelist";
import Footer from "../layout/Footer";
const index = () => {
  return (
    <>
      <Seo pageTitle="Employers List V1" />
      <Header/>
      <EmployersListV1 />
      <Footer/>
    </>
  );
};

export default index;
