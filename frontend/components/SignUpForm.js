// components/SignUpForm.js
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import FormField from "./FormField";
import FileUploadField from "./FileUploadField";
import VerificationField from "./VerificationField";
import FloatingMessage from "./FloatingMessage";
import Navbar from "../components/Nav"

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    verificationCode: "",
    clientId: "",
    clientSecret: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    verificationCode: "",
    clientId: "",
    clientSecret: "",
  });

  const [fileData, setFileData] = useState(null);
  const [successMessage, setSuccessMessage] = useState(false);
  const [userId, setUserId] = useState(null);
  const [codeSent, setCodeSent] = useState(false);
  const [phoneExistsError, setPhoneExistsError] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [floatingMessage, setFloatingMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    if (floatingMessage) {
      const timer = setTimeout(() => {
        setFloatingMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [floatingMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: "",
    });
    setPhoneExistsError("");
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileData(file);

      const fileContent = await file.text();
      try {
        const parsedData = JSON.parse(fileContent);
        setFormData({
          ...formData,
          clientId: parsedData.web.client_id || "",
          clientSecret: parsedData.web.client_secret || "",
        });
      } catch (error) {
        console.error("Invalid JSON file:", error);
        setFloatingMessage("Invalid JSON file");
        setMessageType("error");
      }

      setErrors({ clientId: "", clientSecret: "" });
    } else {
      setFileData(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let valid = true;
    let newErrors = { ...errors };

    if (!formData.username) {
      newErrors.username = "Username is required.";
      valid = false;
    }
    if (!formData.email) {
      newErrors.email = "Email is required.";
      valid = false;
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
      valid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required.";
      valid = false;
    }
    if (!codeVerified) {
      newErrors.verificationCode = "Please verify your phone number.";
      valid = false;
    }
    if (!formData.clientId) {
      newErrors.clientId = "Client ID is required.";
      valid = false;
    }
    if (!formData.clientSecret) {
      newErrors.clientSecret = "Client Secret is required.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) {
      setFloatingMessage("Please fill in all required fields correctly.");
      setMessageType("error");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/signup", formData);
      console.log(`response for signup: ${response.status}`)
      if (response.status === 201) {
        setSuccessMessage(true);
        setUserId(response.data.userId);
        const authorizationUrl = `http://localhost:5000/authorize?user_id=${response.data.userId}&email=${encodeURIComponent(formData.email)}`;
        console.log(authorizationUrl);
        window.location.href = authorizationUrl;
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.error;
        setFloatingMessage(errorMessage);
        setMessageType("error");
        if (errorMessage.includes("Username")) {
          setErrors((prevErrors) => ({ ...prevErrors, username: errorMessage }));
        } else if (errorMessage.includes("Email")) {
          setErrors((prevErrors) => ({ ...prevErrors, email: errorMessage }));
        } else if (errorMessage.includes("WhatsApp number")) {
          setErrors((prevErrors) => ({ ...prevErrors, phoneNumber: errorMessage }));
        }
      } else {
        console.log(error);
      }
    }
  };
 
  const handleSendCode = async () => {
    try {
      // Change API endpoint to your backend running on port 5000
      await axios.post("http://localhost:5000/api/send-code", {
        phoneNumber: formData.phoneNumber,
      });
      setCodeSent(true);
      setFloatingMessage("Verification code sent to your WhatsApp!");
      setMessageType("success");
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.error;
        setFloatingMessage(errorMessage);
        setMessageType("error");
        if (errorMessage.includes("Phone number already exists.")) {
          setPhoneExistsError("Phone number already exists.");
          setErrors((prevErrors) => ({ ...prevErrors, phoneNumber: errorMessage }));
        }
      } else {
        console.log("Error sending verification code:", error);
      }
    }
  };

  const handleVerifyCode = async () => {
    try {
      // Change API endpoint to your backend running on port 5000
      const response = await axios.post("http://localhost:5000/api/verify-code", {
        phoneNumber: formData.phoneNumber,
        code: formData.verificationCode,
      });
      if (response.data.message === "Code verified successfully.") {
        setCodeVerified(true);
        setFloatingMessage("Code verified successfully.");
        setMessageType("success");
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          verificationCode: "Invalid verification code.",
        }));
        setFloatingMessage("Invalid verification code.");
        setMessageType("error");
      }
    } catch (error) {
      console.log("Error verifying code:", error);
      setFloatingMessage("Error verifying code.");
      setMessageType("error");
    }
  };

  return (
    <div>
       <Navbar />

      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        {!successMessage && (
          <form
            className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
            <FormField
              label="Username"
              name="username"
              type="text"
              placeholder="WhatMail"
              value={formData.username}
              error={errors.username}
              onChange={handleChange}
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder="example@gmail.com"
              value={formData.email}
              error={errors.email}
              onChange={handleChange}
            />
            <FormField
              label="Phone Number"
              name="phoneNumber"
              type="text"
              placeholder="+249123123213"
              value={formData.phoneNumber}
              error={errors.phoneNumber || phoneExistsError}
              onChange={handleChange}
              readOnly={codeVerified}
              additionalElement={
                !codeVerified && (
                  <button
                    className="bg-malachite-500 hover:bg-malachite-700 text-white text-sm text-nowrap font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={handleSendCode}
                  >
                    Send Code
                  </button>
                )
              }
            />
            {codeSent && !codeVerified && (
              <VerificationField
                name="verificationCode"
                value={formData.verificationCode}
                error={errors.verificationCode}
                onChange={handleChange}
                onVerify={handleVerifyCode}
              />
            )}
            <FormField
              label="Password"
              name="password"
              type="password"
              placeholder="********"
              value={formData.password}
              error={errors.password}
              onChange={handleChange}
            />
            <FileUploadField id="credentialsFile" onChange={handleFileChange} />
            <FormField
              label="Client ID"
              name="clientId"
              type="text"
              placeholder="Client ID"
              value={formData.clientId}
              error={errors.clientId}
              onChange={handleChange}
            />
            <FormField
              label="Client Secret"
              name="clientSecret"
              type="password"
              placeholder="Client Secret"
              value={formData.clientSecret}
              error={errors.clientSecret}
              onChange={handleChange}
            />
            <div className="flex justify-center">
              <button
                className="bg-malachite-500 hover:bg-malachite-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}
      </div>
      {floatingMessage && (
        <FloatingMessage
          message={floatingMessage}
          onClose={() => setFloatingMessage("")}
          type={messageType}
        />
      )}
    </div>
  );
};

export default SignUpForm;
