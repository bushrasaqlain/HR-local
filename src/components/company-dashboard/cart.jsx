
import CartTable from "./cart/CartTable";

import CartTotal from "./cart/CartTotal";

import { useState } from "react";


const Cart = () => {
  const [subtotal, setSubtotal] = useState(0);

  const handleCumulativeTotalChange = (cumulativeTotal) => {
    setSubtotal(cumulativeTotal);
  };
  return (
    
    <div className="page-wrapper dashboard">
      <span className="header-span"></span>
   
      <section className="cart-section">
        <div className="auto-container">
          <div className="row">
            <div className="column col-lg-8 col-md-12 col-sm-12">
            
                <CartTable onCumulativeTotalChange={handleCumulativeTotalChange} />
          
                
       
            </div>
        

            <div className="column col-lg-4 col-md-12 col-sm-12">
              <CartTotal subtotal={Number(subtotal)} />
            </div>
            {/* End .col-lg-4 */}
          </div>
        </div>
      </section>
        
    </div>
    // End page-wrapper
  );
};

export default Cart;
