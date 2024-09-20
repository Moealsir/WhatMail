// app/login/page.tsx
"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation'; // Updated import for App Router
import FloatingMessage from "../../components/FloatingMessage";
import Navbar from "../../components/Nav"

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    identifier: "",
    password: "",
  });

  const [floatingMessage, setFloatingMessage] = useState("");
  const router = useRouter();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: "",
    });
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    let valid = true;
    let newErrors = { ...errors };
  
    if (!formData.identifier) {
      newErrors.identifier = "Username or email is required.";
      valid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required.";
      valid = false;
    }
  
    setErrors(newErrors);
  
    if (!valid) {
      return; 
    }
  
    try {
      const response = await axios.post("http://localhost:5000/api/login", formData);
      if (response.status === 200) {
        setFloatingMessage("Login successful!");
        router.push('/');
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        // It's an AxiosError, so we can safely access error.response.data
        const errorMessage = error.response?.data?.error || "An error occurred";
        setFloatingMessage(errorMessage);
      } else {
        // It's a generic error (not from Axios), handle accordingly
        console.log(error);
        setFloatingMessage("An error occurred");
      }
    }
  };
  

  return (
    <div>
      <Navbar />
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="identifier"
          >
            Username or Email
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.identifier ? "border-red-500" : ""
            }`}
            id="identifier"
            type="text"
            name="identifier"
            placeholder="Username or Email"
            value={formData.identifier}
            onChange={handleChange}
            required
          />
          {errors.identifier && (
            <span className="text-red-500 text-xs italic">{errors.identifier}</span>
          )}
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.password ? "border-red-500" : ""
            }`}
            id="password"
            type="password"
            name="password"
            placeholder="********"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && (
            <span className="text-red-500 text-xs italic">{errors.password}</span>
          )}
        </div>
        <div className="flex items-center justify-center">
          <button
            className="bg-malachite-500 hover:bg-malachite-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Login
          </button>
        </div>
      </form>

      {/* <FloatingMessage message={floatingMessage} /> */}
    </div>
    </div>
  );
};

export default Login;
