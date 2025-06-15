// src/pages/LandingPage.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiArrowRight, FiEdit, FiLayout, FiDownload, FiZap,
  FiCpu, FiShare2, FiFileText, FiLayers, FiLogOut, FiClock
} from 'react-icons/fi';

// --- Reusable Animated Components ---

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8
    }
  }
};

const containerVariants = {
  offscreen: { opacity: 0 },
  onscreen: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};


// --- Reusable SVG Icons (Unchanged) ---
const FeatureIcon = ({ icon: Icon }) => (
  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
    <Icon className="h-8 w-8" />
  </div>
);

const InnovationIcon = ({ icon: Icon }) => (
  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/80 text-indigo-300 ring-1 ring-white/10">
    <Icon className="h-7 w-7" />
  </div>
);


const LandingPage = () => {
  // --- DATA (LOGIC UNCHANGED) ---
  const features = [
    { icon: <FeatureIcon icon={FiEdit} />, title: 'Effortless First Drafts', description: 'Save hours of tedious writing. Our AI turns your code or abstracts into well-structured core document sections automatically.' },
    { icon: <FeatureIcon icon={FiLayout} />, title: 'Visualize Complexity, Simply', description: 'Gain instant clarity. Automatically generate UML diagrams from your source code to visually map out your architecture and flows.' },
    { icon: <FeatureIcon icon={FiDownload} />, title: 'Polished Docs, Your Way', description: 'Deliver professional results every time. Export your documentation seamlessly into DOCX, PDF, or PPTX formats with one click.' },
    { icon: <FeatureIcon icon={FiZap} />, title: 'Intuitive From Start to Finish', description: 'Focus on your ideas, not the tool. Provide minimal input, and let our intelligent agent handle the heavy lifting of documentation.' }
  ];

  const coreInnovations = [
    { id: 1, icon: <InnovationIcon icon={FiCpu} />, title: 'AI-Powered Understanding', description: 'Our agent intelligently processes both abstracts and code, ensuring comprehensive, context-aware docs.' },
    { id: 2, icon: <InnovationIcon icon={FiShare2} />, title: 'Automated UML Generation', description: 'Go from raw source code to clear visual diagrams without manual effort.' },
    { id: 3, icon: <InnovationIcon icon={FiFileText} />, title: 'One-Click Multi-Format Export', description: 'Instantly get polished DOCX, PDF, and PPTX files, ready for any audience.' },
    { id: 4, icon: <InnovationIcon icon={FiLayers} />, title: 'Minimal Input, Maximum Output', description: 'An intuitive workflow that saves you time and effort.' }
  ];

  // --- STATE AND LOGIC (UNCHANGED) ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({ username: '', email: '' });
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { setUser(res.data); setIsAuthenticated(true); })
        .catch(() => setIsAuthenticated(false));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsProfileOpen(false);
    setUser({ username: '', email: '' });
    navigate('/login');
  };

  const handleLogin = () => navigate('/login');
  const handleCTA = () => isAuthenticated ? navigate('/generate') : navigate('/login');
  
  useEffect(() => {
    const onClick = e => { if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setIsProfileOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);


  // --- UI & UX (REFINED & ANIMATED) ---
  return (
    <div className="min-h-screen bg-slate-900 text-gray-300 antialiased selection:bg-indigo-500/40">
      {/* Background Aurora Effect */}
      <div className="fixed top-0 left-0 -z-10 h-full w-full">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]"></div>
      </div>

      {/* --- Header --- */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-lg"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <motion.a href="#" className="text-2xl font-bold tracking-tighter" whileHover={{ scale: 1.05 }}>
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Gen</span>
            <span className="text-indigo-400">Doc</span>
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">AI</span>
          </motion.a>
          <nav className="hidden items-center space-x-2 md:flex">
            {['Benefits', 'How It Works', 'Innovations'].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(' ', '-')}`} className="rounded-md px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div ref={profileMenuRef} className="relative">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsProfileOpen(o => !o)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-slate-700">
                  <FiUser className="text-indigo-400" />
                </motion.button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-64 origin-top-right rounded-xl border border-white/10 bg-slate-800/80 p-2 text-sm text-gray-300 shadow-2xl backdrop-blur-md"
                    >
                      <div className="px-3 py-2">
                        <p className="font-semibold text-white truncate">{user.username}</p>
                        <p className="text-gray-400 truncate">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-white/10"></div>
                      <button onClick={() => navigate('/history')} className="flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-slate-700/80">
                        <FiClock /> History
                      </button>
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-red-400 transition-colors hover:bg-slate-700/80">
                        <FiLogOut /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button onClick={handleLogin} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-indigo-500/40">
                Sign In
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>
 
      <main className="flex-grow overflow-hidden">
        {/* --- Hero Section --- */}
        <motion.section 
          className="relative py-24 text-center md:py-32 lg:py-40"
          initial="offscreen"
          animate="onscreen"
          variants={containerVariants}
        >
          <div className="relative z-10 mx-auto max-w-5xl px-6">
            <motion.h1 variants={cardVariants} className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
              Reclaim Your Time with AI-Powered Documentation
            </motion.h1>
            <motion.p variants={cardVariants} className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
              Stop wrestling with tedious docs. Let our intelligent agent generate, visualize, and polish your project documentation in minutes, not weeks.
            </motion.p>
            <motion.button variants={cardVariants} onClick={handleCTA} className="group mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-indigo-500/20 transition-transform duration-300 ease-in-out hover:scale-105">
              Start Automating Now
              <FiArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </div>
        </motion.section>

        {/* --- Features Section --- */}
        <motion.section 
          id="benefits" 
          className="py-20 sm:py-24"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <motion.div variants={cardVariants} key={i} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-8 transition-all duration-300 hover:!scale-105 hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/20">
                  {feature.icon}
                  <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* --- How It Works Section --- */}
        <motion.section 
          id="how-it-works" 
          className="py-20 sm:py-24"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <div className="mx-auto max-w-5xl px-6 text-center">
            <motion.h2 variants={cardVariants} className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your Streamlined Path to Perfect Docs
            </motion.h2>
            <motion.p variants={cardVariants} className="mt-4 text-lg text-gray-400">In three simple steps, transform raw ideas into polished, professional documents.</motion.p>
            <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              <motion.div 
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute top-1/2 left-0 hidden h-px w-full -translate-y-1/2 bg-[linear-gradient(to_right,transparent_0%,#4f46e5_10%,#4f46e5_90%,transparent_100%)] md:block"
              ></motion.div>
              {[
                { num: '1', title: 'Provide Input', desc: 'Upload code, paste abstracts, or give a simple prompt.' },
                { num: '2', title: 'AI Processes', desc: 'Our engine structures content & auto-generates UML diagrams.' },
                { num: '3', title: 'Download Results', desc: 'Get polished DOCX, PDF, or PPTX files instantly.' }
              ].map((step) => (
                <motion.div variants={cardVariants} key={step.num} className="relative rounded-2xl border border-white/10 bg-slate-900 p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-indigo-500 bg-slate-800 text-xl font-bold text-white">{step.num}</div>
                  <h3 className="mb-2 text-2xl font-semibold text-white">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* --- Innovations Section --- */}
        <motion.section 
          id="innovations" 
          className="py-20 sm:py-24"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
                <motion.h2 variants={cardVariants} className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Core Innovations</motion.h2>
                <motion.p variants={cardVariants} className="mt-4 text-lg text-gray-400">Powered by cutting-edge technology to deliver unparalleled results.</motion.p>
            </div>
            <motion.div 
              className="mt-16 grid grid-cols-1 gap-8 text-center sm:grid-cols-2 lg:grid-cols-4"
              variants={containerVariants}
            >
              {coreInnovations.map(item => (
                <motion.div variants={cardVariants} key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 transition-colors duration-300 hover:border-indigo-400/50">
                  {item.icon}
                  <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-white/10 bg-slate-900/50 py-16">
        <motion.div 
          className="mx-auto max-w-7xl px-6 text-center"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.4 }}
          variants={containerVariants}
        >
          <motion.h3 variants={cardVariants} className="text-2xl font-bold text-white">Ready to Revolutionize Your Documentation?</motion.h3>
          <motion.p variants={cardVariants} className="mt-2 text-gray-400">Get started for free. No credit card required.</motion.p>
          <motion.button variants={cardVariants} onClick={handleCTA} className="group mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-indigo-500/20 transition-transform duration-300 ease-in-out hover:scale-105">
            Get Started For Free
            <FiArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
          <p className="mt-12 text-sm text-gray-500">© {new Date().getFullYear()} GenDocAI. All rights reserved.</p>
        </motion.div>
      </footer>
    </div>
  );
};

export default LandingPage;