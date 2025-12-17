
"use client"
import { useRouter } from "next/navigation";
import React, { useState } from 'react';
import axios from 'axios';
import api from "../lib/api";

const Form = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',

  });
  const router = useRouter();
  //pasword Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [shownewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword((prev) => !prev);
    } else if (field === 'newPassword') {
      setShowNewPassword((prev) => !prev);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword((prev) => !prev);
    }
  };

  const [message, setMessage] = useState('');
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.newPassword || !formData.oldPassword || !formData.confirmPassword) {
      setMessage('Please Fill out all fields');
      setTimeout(()=>{
        setMessage('');
      },1000,);
      return;
    }

    if(formData.newPassword.length < 8) {
      setMessage("Password must be 8 characters long.");
      setTimeout(()=>{
        setMessage('');
      },1000,);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setTimeout(()=>{
        setMessage('');
      },1000,);
      return;
    }
    if (formData.oldPassword === formData.newPassword) {
      setMessage('New password cannot be the same as the old password.');
    
      // Clear the message after 3 seconds (3000ms)
      setTimeout(() => {
        setMessage('');
      }, 1000);
    
      return;
    }
    try {
      const response = await api.post(`/changepassword`, formData);
      setMessage(response.data.message);
      setTimeout(() => {
        setMessage('');
      }, 3000);
      // Assuming successful update, clear the form fields
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage(error.response.data.error);
      setTimeout(()=>{
        setMessage('');
      },1000);
    }
  };


  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  return (
    <form className="default-form" onSubmit={handleSubmit}>
      {message && (
        <div className={message.startsWith('Error') ? 'error-message alert alert-danger' : 'success-message alert alert-info'}>
          {message}
        </div>
      )}
      <div className="row">
        {/* Old Password */}
        <div className="form-group col-lg-7 col-md-12">
          <label>Old Password</label>

          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              name="oldPassword"
              placeholder="Password"
              onChange={handleInputChange}
              className="form-control password-input"
              value={formData.oldPassword}
            />
            <button
              className="btn btn-light eye-icon align-items-stretch"
              onClick={() => togglePasswordVisibility('password')}
              type="button"
            >
              <span className={`las ${showPassword ?'la-eye': 'la-eye-slash' }`}></span>
            </button>

          </div>
        </div>
        {/* New Password */}
        <div className="form-group col-lg-7 col-md-12">
        <label>New Password</label>

          <div className="input-group">
            <input
              type={shownewPassword ? 'text' : 'password'}
              name="newPassword"
              placeholder="New Password"
              onChange={handleInputChange}
              className="form-control password-input"
              value={formData.newPassword}
            />
            <button
              className="btn btn-light eye-icon align-items-stretch"
              onClick={() => togglePasswordVisibility('newPassword')}
              type="button"
            >
              <span className={`las ${shownewPassword ? 'la-eye': 'la-eye-slash'}`}></span>
            </button>

          </div>
        </div>

        {/* Confirm Password */}
      
        <div className="form-group col-lg-7 col-md-12">
          <label>Confirm Password</label>
          <div  className="input-group">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm Password"
            onChange={handleInputChange}
            className="form-control password-input"
            value={formData.confirmPassword}
          />
          <button
            className="btn btn-light eye-icon align-items-stretch"
            onClick={() => togglePasswordVisibility('confirmPassword')}
            type="button"
          >
            <span className={`las ${showConfirmPassword ? 'la-eye': 'la-eye-slash'}`}></span>
          </button>

          </div>
        </div>
        {/* Submit Button */}
        <div className="form-group col-lg-6 col-md-12">
          <button type="submit" className="theme-btn btn-style-one">
            Update
          </button>
        </div>
      </div>
    </form>
  );
};

export default Form;
