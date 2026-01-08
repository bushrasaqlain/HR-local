import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
const OrderDetails = ({ total }) => {
  const { userId } = useSelector((state) => state.user);
  const router = useRouter();
  const [packageType, setPackageType] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  useEffect(() => {
    // Fetch package type data from your API
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/cart_package/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch package type");
        }

        const data = await response.json();
        setPackageType(data.inactivePackages.join(', '));
      } catch (error) {
        console.error("Error fetching package type:", error.message);
      }
    };

    // Call the fetchData function
    fetchData();
  }, [userId]);
  const handlePlaceOrder = async () => {
    if (isProcessingOrder || !packageType) {
      // Do not proceed if the order is already being processed
      return;
    }
    document.getElementById("popup1").classList.toggle("active");
    // Set the processing state to true
    setIsProcessingOrder(true);

    // Extract payment details
    const paymentData = {
      package_type: packageType || "Unknown Package",
      price: total,
      payment_method: paymentMethod,
      payment_status: "Not Paid",
    };

    try {
      const response = await fetch(`http://localhost:8080/payment/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const responseData = await response.json();
      console.log(responseData);

      // Redirect to the order completed page
      // router.push(`/employers-dashboard/order-completed/${userId}`);

    } catch (error) {
      console.error("Error placing order:", error.message);
    } finally {
      // Set the processing state back to false
      setIsProcessingOrder(false);
    }
  };
  const handleCancelPopup = () => {
    // Toggle the visibility of the popup by adding/removing the "active" class
    const popup = document.getElementById("popup1");
    popup.classList.toggle("active");
  };
  return (
    <div>
    <div className="order-box">
      <h3>Your Order</h3>
      <table>
        <thead>
          <tr>
            <th>
              <strong>Package Type</strong>
            </th>
            <th>
              <strong>Subtotal</strong>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="cart-item">
            <td className="product-name">{packageType || 'Loading...'}</td>
            <td className="product-total">{`Rs${total}`}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="order-total">
            <td>Total</td>
            <td>
              <span className="amount">{`Rs${total}`}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <div className="payment-box">
    <div className="payment-options">
      <ul>

      <li>
  <div className="radio-option radio-box">
    <input
      type="radio"
      name="payment-group"
      id="payment-1"
      checked={paymentMethod === "Cash"}
      onChange={() => setPaymentMethod("Cash")}
    />
    <label htmlFor="payment-1">Cash</label>
  </div>
</li>

<li>
  <div className="radio-option radio-box">
    <input
      type="radio"
      name="payment-group"
      id="payment-3"
      checked={paymentMethod === "Card"}
      onChange={() => setPaymentMethod("Card")}
    />
    <label htmlFor="payment-3">Card</label>
  </div>
</li>


      </ul>
  

      <div className="btn-box">
      <button
          type="button"
          className="theme-btn btn-style-one proceed-btn"
          onClick={handlePlaceOrder}
          disabled={!packageType || isProcessingOrder}// Disable the button if the order is being processed
        >
          {isProcessingOrder ? "Processing..." : "Place Order"}
        </button>
        <section className="order-confirmation">
        <div className="auto-container">
        <div id="popup1" className="popup">
                    <div className='overlay1'></div>
                   
                          <div className="content" style={{textAlign: 'start', fontSize:"14px"}}>
                        
       
        <div className="upper-box">
                          <span className="icon fa fa-check"></span>
                          <h5>Your order is completed!</h5>
                          <div className="text">Thank you. Your order has been received.</div>
                        </div>
          
                        <div className="modal-footer">
                        <Link href={`../../../employers-dashboard/packages/${userId}`} 
    type="button"
    className="btn btn-success text-start mr-3" // Add margin-right to create space between buttons
    style={{ marginRight: '70px' }} 
  >
    View Package
  </Link>
  {/* <button
    type="button"
    className="btn btn-primary"
    onClick={handleCancelPopup}
  >
    Close
  </button> */}
</div>




    
  
                         
                          </div>
                        
                  </div>
                  </div>
                  </section>
                  <style>
                        {`
                          .popup .overlay1 {
                            position: fixed;
                            top: 0px;
                            left: 0px;
                            width: 100vw;
                            height: 100vh;
                            background: rgba(0, 0, 0, 0.1);
                            z-index: 1;
                            display: none; /* initially hide the overlay */
                          }
                          .popup .content {
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) scale(0); /* initially scale down */
                            background: #fff;
                            width: 310px;
                            height: 270px;
                            z-index: 2;
                            text-align: center;
                            padding: 20px;
                            box-sizing: border-box;
                          }
                          .popup.active .overlay1 {
                            display: block;
                          }
                          .popup.active .content {
                            transition: 300ms ease-in-out;
                            transform: translate(-50%, -50%) scale(1);
                          }

                          .btn-responsive {
                            font-size: 15px;
                          }

                          @media (max-width: 1100px) {
                            .btn-responsive {
                              font-size: 14px;
                              width: 42%;
                            }
                          }

                          @media (max-width: 1000px) {
                            .btn-responsive {
                              font-size: 10px;
                              width: 20%;
                            }
                          }

                          @media (max-width: 355px) {
                            .btn-responsive {
                              font-size: 6px;
                              width: 15%;
                            }
                          }
                      `}
              </style>
           {/* <Link
                  href={`../../../employers-dashboard/order-completed/${userId}`}
                  className="theme-btn btn-style-one proceed-btn"
                >
            
            Place Order
                </Link> */}
      </div>
    </div>
    {/* <!--Payment Options--> */}
  </div>
  </div>
  );
};

export default OrderDetails;
