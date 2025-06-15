import React, { useState } from 'react';
import axios from 'axios';
import { FaGoogle, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { FiEye, FiEyeOff, FiUserPlus, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    // Clear confirm password error when password fields change
    if (name === 'password' || name === 'confirmPassword') {
      if (errors.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: null }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    // "Terms and Conditions" validation has been removed.
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        const payload = {
          username: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        };
        const response = await axios.post(
          'http://localhost:3001/signup',
          payload,
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          }
        );

        if (response.status === 200 || response.status === 201) {
          setSuccessMessage('Account created successfully! Please log in.');
          setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        } else {
          setServerError('An unexpected error occurred.');
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          setServerError(err.response.data.message);
        } else {
          setServerError('Unable to connect to the server.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Animation variants remain the same
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };
  const messageVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 } };

  const getInputClass = (fieldName) => `w-full pl-12 pr-4 py-3 bg-[#14142B] border rounded-lg placeholder-[#A1A1AA] text-white focus:outline-none focus:ring-2 focus:ring-[#6A75F5] transition-all ${errors[fieldName] ? 'border-red-500 ring-red-500' : 'border-[#2D2D5A]'}`;
  const getIconClass = (fieldName) => `absolute left-4 top-1/2 transform -translate-y-1/2 text-lg text-[#A1A1AA] transition-colors group-focus-within:text-[#6A75F5] ${errors[fieldName] ? 'text-red-500' : ''}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A23] to-[#14142B] p-4 text-white">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
          <div className="bg-[#6A75F5] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <FiUserPlus className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-[#A1A1AA] mt-2">Start your journey with GenDocAI</p>
        </motion.div>

        <motion.div variants={itemVariants} className="relative bg-gradient-to-r from-[#5D5FEF] to-[#6A75F5] p-1 rounded-2xl shadow-2xl">
          <div className="bg-[#0F0F2C] rounded-xl p-8">
            <form onSubmit={handleSubmit} noValidate>
              {/* Form fields remain the same */}
              <div className={`relative mb-4 group ${errors.name ? 'shake-animation' : ''}`}>
                <FaUser className={getIconClass('name')} />
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className={getInputClass('name')} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-[-8px] mb-2 ml-1">{errors.name}</p>}

              <div className={`relative mb-4 group ${errors.email ? 'shake-animation' : ''}`}>
                <FaEnvelope className={getIconClass('email')} />
                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className={getInputClass('email')} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-[-8px] mb-2 ml-1">{errors.email}</p>}

              <div className={`relative mb-4 group ${errors.password ? 'shake-animation' : ''}`}>
                <FaLock className={getIconClass('password')} />
                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={getInputClass('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors duration-200">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-[-8px] mb-2 ml-1">{errors.password}</p>}

              <div className={`relative mb-6 group ${errors.confirmPassword ? 'shake-animation' : ''}`}> {/* Increased bottom margin */}
                <FaLock className={getIconClass('confirmPassword')} />
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className={getInputClass('confirmPassword')} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors duration-200">
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-[-16px] mb-4 ml-1">{errors.confirmPassword}</p>}

              {/* Terms and Conditions UI has been removed. */}

              <AnimatePresence>
                {serverError && (
                  <motion.p variants={messageVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center text-red-500 text-sm mb-4">
                    <FiAlertCircle className="mr-2" /> {serverError}
                  </motion.p>
                )}
                {successMessage && (
                  <motion.p variants={messageVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center text-green-400 text-sm mb-4">
                    <FiCheck className="mr-2" /> {successMessage}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(106, 117, 245, 0.5)' }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting} className={`w-full py-3 mb-6 ${isSubmitting ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-[#5D5FEF] to-[#6A75F5]'} text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex justify-center`}>
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </motion.button>

              <div className="flex items-center mb-6">
                <hr className="flex-grow border-t border-[#2D2D5A]" />
                <span className="mx-4 text-[#A1A1AA] text-sm">OR</span>
                <hr className="flex-grow border-t border-[#2D2D5A]" />
              </div>
              
              <motion.button whileHover={{ scale: 1.03, backgroundColor: '#1E1E3C' }} whileTap={{ scale: 0.98 }} className="flex items-center justify-center w-full py-3 bg-transparent border border-[#2D2D5A] text-[#A1A1AA] rounded-lg hover:text-white transition-all duration-200 mb-6">
                <FaGoogle className="w-5 h-5 mr-3 text-white" />
                Sign up with Google
              </motion.button>
            </form>
          </div>
        </motion.div>

        <motion.p variants={itemVariants} className="text-center text-[#A1A1AA] text-sm mt-8">
          Already have an account?{' '}
          <a href="/login" className="text-[#6A75F5] hover:underline font-medium">
            Sign In
          </a>
        </motion.p>
      </motion.div>
      <style jsx>{`
        .shake-animation { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}