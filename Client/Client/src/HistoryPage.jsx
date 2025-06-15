// src/HistoryPage.jsx

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiDownload,
  FiFileText,
  FiGift,
  FiInbox, // REPLACED FiSparkles with FiGift
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const docuAgentFacts = [
  "Our DocuAgent can read and understand over 10 different programming languages.",
  "The average documentation time is reduced by 95% using our AI.",
  "DocuAgent's diagram generator was trained on millions of open-source projects.",
  "Every document helps our AI learn and improve for the next user.",
  "DocuAgent can even find and document undocumented legacy code.",
  "The core AI model uses advanced transformer architecture for deep code analysis.",
];

const FunFact = () => {
  const [fact, setFact] = useState("");
  useEffect(() => {
    setFact(docuAgentFacts[Math.floor(Math.random() * docuAgentFacts.length)]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6 p-4 bg-[#2D2D5A]/50 rounded-xl border border-dashed border-[#5D5FEF]/50"
    >
      <div className="flex items-start gap-3">
        {/* Using the new, correct icon */}
        <FiGift className="text-2xl text-[#6A75F5] flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-semibold text-white">Did You Know?</h4>
          <p className="text-[#A1A1AA] text-sm">{fact}</p>
        </div>
      </div>
    </motion.div>
  );
};

const CardSkeleton = () => (
  <div className="bg-[#1E1E3C]/50 p-6 rounded-2xl animate-pulse">
    <div className="h-10 w-10 bg-slate-700 rounded-lg mb-6"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
      <div className="h-3 bg-slate-700 rounded w-1/2"></div>
    </div>
  </div>
);

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const HistoryPage = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const { data: history } = await axios.get(
          "http://localhost:3001/history",
          config
        );
        setHistoryItems(history);
      } catch (err) {
        console.error("Error fetching history:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
      try {
        const { data: userData } = await axios.get(
          "http://localhost:3001/auth/me",
          config
        );
        setUser(userData);
      } catch {
        setUser({ name: "User" });
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const handleDelete = async (id) => {
    const original = [...historyItems];
    setHistoryItems(historyItems.filter((item) => item._id !== id));
    try {
      await axios.delete(`http://localhost:3001/history/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (err) {
      console.error("Delete failed:", err);
      setHistoryItems(original);
      alert("Failed to delete.");
    }
  };

  const handleDownload = (item) => {
    const fileType = item.format;
    const filename = item.generatedFiles?.[fileType];

    if (!filename) {
      alert("Download information not available for this item.");
      return;
    }

    const url = `http://localhost:3001/download/${fileType}/${filename}`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    // Add the token to the URL for simple GET request authentication
    const token = localStorage.getItem("token");
    link.href = `${url}?token=${token}`; // A simple way for GET auth if needed, but our proxy handles it.

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A23] to-[#14142B] text-white font-sans">
      <motion.header
        className="bg-[#0F0F2C]/80 backdrop-blur-md py-4 px-6 flex items-center justify-between border-b border-[#2D2D5A] sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.button
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center p-2 rounded-full bg-gradient-to-r from-[#5D5FEF] to-[#6A75F5]"
        >
          <FiArrowLeft className="text-lg" />
        </motion.button>
        <h1 className="text-2xl font-semibold">Your History</h1>
        <div className="w-10" />
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <motion.aside
            className="lg:w-1/3 lg:sticky lg:top-28 self-start bg-[#1E1E3C]/50 p-6 rounded-2xl border border-[#2D2D5A]"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-br from-[#5D5FEF] to-[#6A75F5] p-3 rounded-full">
                <FiUser className="text-2xl text-white" />
              </div>
              <h2 className="text-2xl font-bold">
                Welcome, {user?.name || "..."}
              </h2>
            </div>
            <p className="text-[#A1A1AA]">
              Curious to see what you've built so far? Explore your document
              history and revisit past creations! Hover over a card to download
              or delete your generated files.
            </p>
            <FunFact />
          </motion.aside>

          <section className="lg:w-2/3">
            <AnimatePresence>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : historyItems.length === 0 ? (
                <motion.div
                  className="col-span-full mt-12 flex flex-col items-center gap-4 bg-[#1E1E3C] p-8 rounded-2xl border-dashed border-[#2D2D5A]"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <FiInbox className="text-5xl text-[#6A75F5]" />
                  <h3 className="text-xl font-semibold">
                    Your History is Empty
                  </h3>
                  <p className="text-[#A1A1AA] text-center">
                    You haven't created anything yet.
                  </p>
                  <motion.button
                    onClick={() => navigate("/")}
                    whileHover={{ scale: 1.05 }}
                    className="mt-4 bg-gradient-to-r from-[#5D5FEF] to-[#6A75F5] py-2 px-5 rounded-lg"
                  >
                    Start Creating
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={{
                    visible: { transition: { staggerChildren: 0.1 } },
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {historyItems.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      variants={cardVariants}
                      className="relative bg-[#1E1E3C] rounded-2xl p-6 border border-[#2D2D5A] overflow-hidden group"
                    >
                      <div className="flex flex-col justify-between h-full">
                        <FiFileText className="text-4xl text-[#6A75F5] mb-4" />
                        <div>
                          <h3
                            className="font-semibold text-lg truncate"
                            title={item.fileName}
                          >
                            {item.fileName}
                          </h3>
                          <p className="text-sm text-[#A1A1AA]">
                            Format:{" "}
                            <span className="font-semibold text-white">
                              {item.format.toUpperCase()}
                            </span>
                          </p>
                          <p className="text-sm text-[#A1A1AA]">
                            Generated on{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 p-6 flex flex-col items-center justify-center bg-gradient-to-t from-[#14142B] to-[#1E1E3C]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-sm text-[#A1A1AA] mb-4">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                        <div className="flex gap-4">
                          <motion.button
                            onClick={() => handleDownload(item)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6A75F5] text-white"
                            whileHover={{ scale: 1.1 }}
                          >
                            <FiDownload /> Download
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(item._id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-600 text-red-400"
                            whileHover={{ scale: 1.1 }}
                          >
                            <FiTrash2 /> Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
