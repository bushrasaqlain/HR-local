import FormContent from "./FormContent";
import Link from "next/link";

const Register2 = ({ setShowNext, setUserId }) => {
  return (
    <div className="form-inner">
      <h3>Create a Free Superio Account</h3>

      <FormContent setShowNext={setShowNext} setUserId={setUserId}/>

      <div className="bottom-box">
        <div className="text">
          Already have an account?{" "}
          <Link href="/login" className="call-modal login">
            LogIn
          </Link>
        </div>
        {/* <div className="divider">
          <span>or</span>
        </div>
        <LoginWithSocial /> */}
      </div>
      {/* End bottom-box LoginWithSocial */}
    </div>
  );
};

export default Register2;
