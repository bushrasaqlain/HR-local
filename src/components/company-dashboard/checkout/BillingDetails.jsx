import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
const BillingDetails = () => {
  const [companyInfo, setCompanyInfo] = useState({
    company_name: '',
    email_address: '',
    department: '',
    phone: '',
    NTN: '',
    city: '',
    complete_address: '',
  });
  const { userId } = useSelector((state) => state.user);
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch(`http://localhost:8080/company-info/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch company information');
        }

        const data = await response.json();
        setCompanyInfo(data);
      } catch (error) {
        console.error('Error fetching company information:', error.message);
      }
    };

    fetchCompanyInfo();
  }, [userId]);

  return (
  
 <div className="default-form">
      <div className="row" style={{marginLeft:"10px", marginRight:"10px",marginTop:"10px"}}>
        {/* <!--Form Group--> */}
        <strong className="mt-3 mb-3 font-size-20 " >Billing Details</strong>
    
        {/* <div className="form-group col-lg-6 col-md-12 col-sm-12">
          <div className="field-label">
            First name <sup>*</sup>
          </div>
          <input type="text" name="field-name" placeholder="" />
        </div> */}

        {/* <!--Form Group--> */}
        {/* <div className="form-group col-lg-6 col-md-12 col-sm-12">
          <div className="field-label">
            Last name <sup>*</sup>
          </div>
          <input type="text" name="field-name" placeholder="" />
        </div> */}

        {/* <!--Form Group--> */}
        <div className="form-group col-lg-12 col-md-12 col-sm-12">
          <div className="field-label">Company name <span className="text-danger">*</span></div>
          <input type="text" name="company_name" placeholder="" value={companyInfo.full_name} />
        </div>

        <div className="form-group col-lg-12 col-md-12 col-sm-12">
          <div className="field-label">Email Address <span className="text-danger">*</span></div>
          <input type="text" name="email_address" placeholder="" value={companyInfo.email} />
        </div>
        {/* <!--Form Group--> */}
        {/* <div className="form-group col-lg-12 col-md-12 col-sm-12">
          <div className="field-label">
            Country <sup>*</sup>
          </div>
          <select
            name="billing_country"
            className="select2 sortby-select form-select"
            autoComplete="country"
          >
            <option>Select a country&hellip;</option>
            <option value="AX">&#197;land Islands</option>
            <option value="AF">Afghanistan</option>
            <option value="AL">Albania</option>
            <option value="DZ">Algeria</option>
            <option value="AS">American Samoa</option>
            <option value="AD">Andorra</option>
            <option value="AO">Angola</option>
            <option value="AI">Anguilla</option>
            <option value="AQ">Antarctica</option>
            <option value="AG">Antigua and Barbuda</option>
            <option value="AR">Argentina</option>
          </select>
        </div> */}

        {/* <!--Form Group--> */}
  
       
        <div className="form-group col-lg-6 col-md-12 col-sm-12">
          <div className="field-label">Phone <span className="text-danger">*</span></div>
          <input type="text" name="phone" placeholder="" value={companyInfo.phone} />
        </div>

        <div className="form-group col-lg-6 col-md-12 col-sm-12">
          <div className="field-label">City <span className="text-danger">*</span></div>
          <input type="text" name="city" placeholder="" required="" value={companyInfo.city} />
        </div>

        {/* <!--Form Group--> */}
        {/* <div className="form-group col-lg-6 col-md-12 col-sm-12">
          <div className="field-label">
            State / County <sup>*</sup>
          </div>
          <input type="text" name="field-name" placeholder="" required="" />
        </div> */}

        {/* <!--Form Group--> */}
        {/* <div className="form-group col-lg-6 col-md-12 col-sm-12">
          <div className="field-label">
            Postcode/ ZIP <sup>*</sup>
          </div>
          <input type="text" name="field-name" placeholder="" required="" />
        </div> */}

        {/* <!--Form Group--> */}
      

        {/* <!--Form Group--> */}
       
        <div className="form-group col-lg-12 col-md-12 col-sm-12">
          <div className="field-label">Complete address <span className="text-danger">*</span></div>
          <input
            type="text"
            name="complete_address"
            style={{ marginBottom: "40px" }}
            placeholder="Apartment, suite, unit, etc. (optional)"
            value={companyInfo.complete_address}
          />
        </div>
      </div>
        {/* <!--Form Group--> */}
        {/* <div className="form-group col-lg-12 col-md-12 col-sm-12">
          <h3 className="title">Additional information</h3>
          <div className="field-label">Order notes (optional)</div>
          <textarea
            className=""
            style={{ marginBottom: "40px" }} 
            placeholder="Notes about your order, e.g. special notes for delivery."
          ></textarea>
        </div> */}
      </div>
   

   
  );
};

export default BillingDetails;
