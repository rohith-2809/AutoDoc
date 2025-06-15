// src/components/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // New state for error messages
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const navigate = useNavigate(); // Hook to programmatically navigate

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous error
    setIsLoading(true);

    try {
      // POST to backend login route
      const response = await axios.post(
        "http://localhost:3001/login",
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true, // if you plan to use cookie-based auth
        }
      );

      // On success, backend sends back { token: "..." }
      const { token } = response.data;
      // Store JWT in localStorage (or whichever storage you prefer)
      localStorage.setItem("token", token);


      // Optionally, if "remember me" is unchecked, you could store in sessionStorage instead:
      // if (formData.remember) {
      //   localStorage.setItem("authToken", token);
      // } else {
      //   sessionStorage.setItem("authToken", token);
      // }

      // Redirect to dashboard (replace "/dashboard" with your actual protected route)
      navigate("/");
    } catch (err) {
      // If the server returned a 4xx/5xx status, axios throws an error
      console.error("Login failed:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
                    bg-gradient-to-b from-[#0A0A23] to-[#14142B] p-4"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-48 h-48 bg-[#6A75F5]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-[#5D5FEF]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Outer container animated fade-in */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 100,
        }}
        className="w-full max-w-md bg-[#0F0F2C]/90 backdrop-blur-sm
                   rounded-2xl shadow-2xl shadow-[#5D5FEF]/20 p-8 relative z-10"
      >
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6A75F5] to-[#5D5FEF] rounded-t-2xl"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[#A1A1AA]"
          >
            Sign in to continue to your dashboard
          </motion.p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative mb-6"
          >
            <FaEnvelope
              className="absolute left-3 top-1/2 transform -translate-y-1/2 
                         text-[#A1A1AA] text-lg"
            />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full pl-10 pr-4 py-3 bg-[#1A1A3A] 
                         border border-[#2D2D3E] rounded-lg 
                         placeholder-[#A1A1AA] text-white 
                         focus:outline-none focus:ring-2 focus:ring-[#6A75F5] transition-all"
              required
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative mb-6"
          >
            <FaLock
              className="absolute left-3 top-1/2 transform -translate-y-1/2 
                         text-[#A1A1AA] text-lg"
            />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full pl-10 pr-12 py-3 bg-[#1A1A3A] 
                         border border-[#2D2D3E] rounded-lg 
                         placeholder-[#A1A1AA] text-white 
                         focus:outline-none focus:ring-2 focus:ring-[#6A75F5] transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 
                         text-[#A1A1AA] hover:text-[#6A75F5] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </motion.div>

          {/* Remember Me + Forgot Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between mb-2"
          >
            <label className="flex items-center text-[#A1A1AA] text-sm cursor-pointer">
              <input
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                className="form-checkbox h-4 w-4 text-[#6A75F5] 
                           border-[#A1A1AA] focus:ring-[#6A75F5] rounded cursor-pointer"
              />
              <span className="ml-2">Remember me</span>
            </label>
            <a
              href="#"
              className="text-[#6A75F5] text-sm hover:underline transition-all"
            >
              Forgot Password?
            </a>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-red-400 text-sm mb-4 text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-3 mb-4 flex justify-center items-center
                       bg-gradient-to-r from-[#6A75F5] to-[#5D5FEF] text-white 
                       font-semibold rounded-lg 
                       shadow-lg hover:shadow-xl hover:shadow-[#6A75F5]/30
                       transform transition-all duration-200 ${
                         isLoading ? "opacity-80" : ""
                       }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : null}
            {isLoading ? "Signing In..." : "Sign In"}
          </motion.button>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center mb-6"
          >
            <hr className="flex-grow border-[#2D2D3E]" />
            <span className="mx-2 text-[#A1A1AA] text-sm">or continue with</span>
            <hr className="flex-grow border-[#2D2D3E]" />
          </motion.div>

          {/* Alternative Sign-In */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.03, backgroundColor: "#2D3748" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center w-full 
                       py-3 bg-[#252547] border border-[#3A3A5A] 
                       text-white rounded-lg 
                       hover:bg-[#1E1E2E] transition-all duration-200"
            type="button"
            onClick={() => {
              /* Implement Google OAuth flow here, if desired */
            }}
          >
            <FaGoogle className="text-[#DB4437] w-5 h-5 mr-2" />
            Sign in with Google
          </motion.button>

          {/* Signup Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-[#A1A1AA] text-sm mt-6"
          >
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-[#6A75F5] font-medium hover:underline transition-all"
            >
              Create one
            </a>
          </motion.p>
        </form>
      </motion.div>
    </div>
  );
}
