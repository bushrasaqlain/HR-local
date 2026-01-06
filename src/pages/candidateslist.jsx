import Header from "../layout/header";
import Seo from "../components/seo";
import CandidatesListV2 from "../components/candidatelist";
import Footer from "../layout/Footer";
const index = () => {
  return (
    <>
      <Seo pageTitle="Candidates List V2" />
      <Header />
      <CandidatesListV2 />
      <Footer />
    </>
  );
};
export default index;
