import Link from "next/link";
import { useState, useEffect } from "react";

const Pricing = ({ userId }) => {
  const [pricingContent, setPricingContent] = useState([]);

  const [successMessage, setSuccessMessage] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8080/pricing");
        const data = await response.json();
        setPricingContent(data);
      } catch (error) {
        console.error("Error fetching pricing data:", error);
      }
    };

    fetchData();
  }, []);

  const staticPricingContent = [
    {
      id: 1,
      tag: "",
      features: [
        // "30 job posting",
        // "3 featured job",
        // "Job displayed for 15 days",
        "Premium Support 24/7",
      ],
    },
    {
      id: 2,
      tag: "tagged",
      features: [
        // "40 job posting",
        // "5 featured job",
        // "Job displayed for 20 days",
        "Premium Support 24/7",
      ],
    },
    {
      id: 3,
      tag: "",
      features: [
        // "50 job posting",
        // "10 featured job",
        // "Job displayed for 60 days",
        "Premium Support 24/7",
      ],
    },
  ];

  const combinedPricingContent = pricingContent.map((dynamicItem, index) => {
    const staticItem = staticPricingContent[index];
    return {
      ...staticItem,
      ...dynamicItem,
    };
  });
  const handleAddToCart = async (packageType, price) => {
    try {
      const response = await fetch(`http://localhost:8080/cart/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_type: packageType,
          price: price,
        }),
      });
  
      if (response.ok) {
        setSuccessMessage("Item added to cart successfully");
  
        // Automatically hide the success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
  
        // Update the local state immediately
        setPackageCount((prevCount) => (prevCount || 0) + 1);
  
        // Dispatch an action to update Redux state
        dispatch(reloadCart());
  
        // If you have WebSocket implemented, notify the server about the cart update
        // socket.emit('cartUpdated', { userId });
  
        // Set reloadHeader to true to trigger the header reload
        setReloadHeader(true);
      } else {
        console.error("Failed to add item to cart", response.status, response.statusText);
        const responseBody = await response.json();
        const errorMessage = responseBody.error;
  
        // Set the error message to the successMessage state
        setSuccessMessage(errorMessage);
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
    }
  };
  
  
  
  
  return (
    <div className="pricing-tabs tabs-box wow fadeInUp">
        {successMessage && (
        <div className="success-message alert alert-info">
          {successMessage}
        </div>
      )}
      <div className="row">
        {combinedPricingContent.map((item) => (
          <div
            className={`pricing-table col-lg-4 col-md-6 col-sm-12 ${item.tag}`}
            key={item.id}
          >
            <div className="inner-box">
              {item.tag ? (
                <>
                  <span className="tag">Recommended</span>
                </>
              ) : (
                ""
              )}

              <div className="title">{item.package_type}</div>
              <div className="price">
                Rs{item.price} <span className="duration">
                  / monthly
                  </span>
              </div>
              <div className="table-content">
              <ul>
                  <li>
                  <span>{`${item.Jobs} job postings`}</span>
                
                  </li>
                  <li>
                  <span>{`Job displayed for ${item.days} days`}</span>
                  </li>
                  {item.features.map((feature, i) => (
                    <li key={i}>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="table-footer">
              <button
                  className="theme-btn btn-style-three"
                  onClick={() => handleAddToCart(item.package_type, item.price)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
