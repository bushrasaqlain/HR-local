import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Link from "next/link";

const CartTotal = ({ subtotal, totalProp }) => {
  const { userId } = useSelector((state) => state.user);
  const { cart } = useSelector((state) => state.shop) || {};

  let total = 0;  // Use a different variable name here

  cart?.forEach((item) => {
    const price = item.qty * item.price;
    total = total + price;
  });

  // Calculate Discount
  const discountPercentage = 0;
  const discount = (subtotal * discountPercentage) / 100;

  const router = useRouter();

  const handleProceedToCheckout = () => {
    const checkoutTotal = subtotal + discount;

    // Navigate to the checkout page with the total as a query parameter
    router.push({
      pathname: `/employers-dashboard/checkout/${userId}`,
      query: { total: checkoutTotal.toFixed(2) },
    });
  };

  return (
    <div className="totals-table-outer">
      <ul className="totals-table">
        <li>
          <h3>Cart Totals</h3>
        </li>

        <li>
          <span className="col">Subtotal</span>
          <span className="col price">Rs {subtotal.toFixed(2)}</span>
        </li>
        <li>
          <span className="col">Discount ({discountPercentage}%)</span>
          <span className="col price">Rs {discount.toFixed(2)}</span>
        </li>

        <li>
          <span className="col">Total</span>
          <span className="col price">Rs {(subtotal + discount).toFixed(2)}</span>
        </li>
      </ul>
      <button
        className="theme-btn btn-style-one proceed-btn"
        onClick={handleProceedToCheckout}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CartTotal;
