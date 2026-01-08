import BillingDetails from "../components/BillingDetails";
import OrderDetails from "../components/OrderDetails";
import PaymentOptions from "../components/PaymentOptions";

const index = ({ total}) => {
  return (
    <div className="row">
      <div className="column col-lg-8 col-md-12 col-sm-12">
        {/* <!--Checkout Details--> */}
        <div className="checkout-form" >
          {/* <h3 className="title" >Billing Details</h3> */}
          <BillingDetails total={total} />
        </div>
        {/* <!--End Billing Details--> */}
      </div>

      <div className="column col-lg-4 col-md-12 col-sm-12">
        <OrderDetails total={total}/>
        {/* <!--End Order Box--> */}

        {/* <div className="payment-box"> */}
          {/* <PaymentOptions userId={userId} total={total}/> */}
          {/* <!--Payment Options--> */}
        {/* </div> */}
        {/* <!--End Payment Box--> */}
      </div>
    </div>
  );
};

export default index;
