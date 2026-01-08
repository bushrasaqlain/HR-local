
import BillingAll from "./checkout/BillingDetails";
const Checkout = ({total}) => {
  return (
    <div className="page-wrapper dashboard">
      <span className="header-span"></span>
      
          {/* Collapsible sidebar button */}
          {/* <MenuToggler /> */}
          <section className="checkout-page">
        <div className="auto-container">
          <BillingAll total={total}/>
        </div>
      </section>
       
    </div>
    // End page-wrapper
  );
};

export default Checkout;
