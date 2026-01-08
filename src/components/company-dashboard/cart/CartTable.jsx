// import CartItems from "./CartItems";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
const CartTable = ({ onCumulativeTotalChange }) => {



  const {userId} = useSelector((state) => state.user);
  const [packages, setPackages] = useState([]);
  const [cumulativeTotal, setCumulativeTotal] = useState(0);
 
  const handleDeleteCart = async (cartId) => {
    if (!cartId) {
      console.error("Invalid cart ID:", cartId);
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:8080/cart/${userId}/${cartId}`, {
        method: "DELETE",
      });
  
      if (!response.ok) {
        throw new Error("Failed to delete cart item");
      }
  
      // Assuming you want to perform some action after successful deletion
      console.log("Cart item deleted successfully");
  
      // Update the frontend state to reflect the deletion
      setPackages(packages.filter(item => item.id !== cartId));
      
      // You may want to refetch the cart data or update the state after deletion
      // Call the fetchCartData function or any relevant logic here
    } catch (error) {
      console.error("Error deleting cart item:", error.message);
    }
  }
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/cart/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch cart data");
        }

        const data = await response.json();
        setPackages(data.packages);
      } catch (error) {
        console.error("Error fetching cart data:", error.message);
      }
    };

    fetchCartData();
  }, [userId]);

  useEffect(() => {
    let total = 0;
    const updatedPackages = packages.map((item, index) => {
      total += parseFloat(item.price);
      return { ...item, cumulativeTotal: total.toFixed(2) };
    });

    if (cumulativeTotal !== total.toFixed(2)) {
      setCumulativeTotal(total.toFixed(2));

      // Ensure that onCumulativeTotalChange is defined before calling it
      if (typeof onCumulativeTotalChange === "function") {
        onCumulativeTotalChange(total.toFixed(2));
      }

      setPackages(updatedPackages);
    }
  }, [packages, cumulativeTotal, onCumulativeTotalChange]);

  return (
    <table className="default-table ">
      <thead className="cart-header">
        <tr>
          <th className="product-name">Package Type</th>
    
          <th className="product-price">Price</th>

          <th className="product-subtotal">Total</th>
          <th className="product-remove">&nbsp;</th>
        </tr>
      </thead>
      {/* End thead */}

      <tbody>
      {packages.map((item, index) => (
  <tr key={index}>
    <td className="product-name">{item.package_type}</td>
    <td className="product-price">{item.price}</td>
    <td className="product-subtotal">{item.cumulativeTotal}</td>

    <td>
      <button
        type="button"
        className="theme-btn btn-style-three"
        onClick={() => handleDeleteCart(item.id)} // Use item.id instead of item.cart_id
        style={{ fontSize: "12px", padding: "5px 10px" }}
      >
        Delete cart
      </button>
    </td>
  </tr>
))}

        {/* <CartItems userId={userId}/> */}
      </tbody>
      {/* End tbody */}
    </table>
  );
};

export default CartTable;
