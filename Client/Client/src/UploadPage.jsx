// src/pages/UploadPage.jsx
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FaCss3Alt,
  FaHtml5,
  FaJava,
  FaJs,
  FaNodeJs,
  FaPhp,
  FaPython,
  FaReact,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiCheck,
  FiDownload,
  FiFile,
  FiFilePlus,
  FiFileText,
  FiHelpCircle,
  FiLayout,
  FiMessageSquare,
  FiRefreshCw,
  FiStar,
  FiUpload,
  FiUser,
  FiX,
  FiZap,
} from "react-icons/fi";

const UploadPage = ({ onBackToLanding }) => {
  const [files, setFiles] = useState([]);
  const [instructions, setInstructions] = useState("");
  const [format, setFormat] = useState("docx");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [downloadInfo, setDownloadInfo] = useState(null);
  const fileInputRef = useRef(null);
  const authDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        authDropdownRef.current &&
        !authDropdownRef.current.contains(event.target)
      ) {
        setShowAuthDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- RECTIFIED: This is the corrected download handler ---
  const handleDownload = () => {
    if (!downloadInfo || !downloadInfo[format]) {
      setError(
        "Could not find the file to download. Please try generating again."
      );
      setTimeout(() => setError(""), 3000);
      return;
    }

    const filename = downloadInfo[format];
    const downloadUrl = `https://autodoc-v8zx.onrender.com/${format}/${filename}`;
    const authToken = localStorage.getItem("token");

    // Use fetch to make an authenticated request
    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // Handle HTTP errors like 401 Unauthorized or 404 Not Found
          throw new Error(`Server responded with ${res.status}`);
        }
        return res.blob(); // Get the raw file data as a blob
      })
      .then((blob) => {
        // Create a temporary URL for the blob data
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename); // Set the correct filename for the download
        document.body.appendChild(link);
        link.click(); // Trigger the download
        link.remove(); // Clean up the link
        window.URL.revokeObjectURL(url); // Free up memory
      })
      .catch((err) => {
        console.error("Download error:", err);
        setError(
          "Download failed. Please ensure you are logged in and the file exists."
        );
        setTimeout(() => setError(""), 4000);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please upload at least one file");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (instructions.trim() === "") {
      setError("Custom instructions are required");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!token) {
      setError("Please login to generate documentation");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setIsGenerated(false);
    setError("");
    setDownloadInfo(null);

    try {
      const formData = new FormData();
      // Backend is set to upload.single(), so we only send the first file.
      formData.append("inputFile", files[0]);
      formData.append("instructions", instructions);
      formData.append("format", format);

      const response = await axios.post(
        "https://autodoc-v8zx.onrender.com/generate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      setDownloadInfo(response.data);
      setIsGenerated(true);
    } catch (error) {
      console.error("Generation failed:", error);
      const errorDetail = error.response?.data?.detail || "Please try again.";
      setError(`Document generation failed. ${errorDetail}`);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("https://autodoc-v8zx.onrender.com/login", {
        email: authEmail,
        password: authPassword,
      });
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      setAuthError("");
      setShowAuthDropdown(false);
    } catch (error) {
      console.error("Login failed:", error);
      setAuthError("Login failed. Please check your credentials.");
    }
  };

  const handleSignup = async () => {
    try {
      const response = await axios.post("https://autodoc-v8zx.onrender.com/signup", {
        email: authEmail,
        password: authPassword,
      });
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      setAuthError("");
      setShowAuthDropdown(false);
    } catch (error) {
      console.error("Signup failed:", error);
      setAuthError("Signup failed. Email might be already in use.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setShowAuthDropdown(false);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(droppedFiles);
      setError("");
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFiles([]);
    setInstructions("");
    setIsGenerated(false);
    setError("");
    setDownloadInfo(null);
  };

  const goToLandingPage = () => {
    onBackToLanding ? onBackToLanding() : (window.location.href = "/");
  };

  const showHelpTooltip = (content) => {
    setTooltipContent(content);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };

  const toggleAuthDropdown = () => {
    setShowAuthDropdown(!showAuthDropdown);
    setAuthError("");
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === "login" ? "signup" : "login");
    setAuthError("");
  };

  const formatOptions = [
    {
      id: "docx",
      label: "DOCX",
      icon: <FiFileText />,
      desc: "Editable document format",
    },
    {
      id: "pdf",
      label: "PDF",
      icon: <FiFile />,
      desc: "Universal document format",
    },
    {
      id: "pptx",
      label: "PPTX",
      icon: <FiFilePlus />,
      desc: "Presentation format",
    },
  ];

  const fileIcons = {
    py: <FaPython className="text-indigo-400" />,
    js: <FaJs className="text-indigo-400" />,
    jsx: <FaReact className="text-indigo-400" />,
    java: <FaJava className="text-indigo-400" />,
    php: <FaPhp className="text-indigo-400" />,
    html: <FaHtml5 className="text-indigo-400" />,
    css: <FaCss3Alt className="text-indigo-400" />,
    ts: <FaJs className="text-indigo-400" />,
    json: <FaJs className="text-indigo-400" />,
    node: <FaNodeJs className="text-indigo-400" />,
    default: <FiFile className="text-gray-400" />,
  };

  const fileTypeNames = {
    py: "Python",
    js: "JavaScript",
    jsx: "React",
    java: "Java",
    php: "PHP",
    html: "HTML",
    css: "CSS",
    ts: "TypeScript",
    json: "JSON",
    node: "Node.js",
    default: "File",
  };

  const getFileIcon = (fileName) =>
    fileIcons[fileName.split(".").pop().toLowerCase()] || fileIcons["default"];
  const getFileType = (fileName) =>
    fileTypeNames[fileName.split(".").pop().toLowerCase()] ||
    fileTypeNames["default"];

  const cardHover = {
    scale: 1.02,
    boxShadow: "0 10px 25px rgba(106, 117, 245, 0.3)",
    transition: { duration: 0.3 },
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-300">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="bg-slate-800 py-4 px-6 flex justify-between items-center border-b border-white/10"
      >
        <div className="flex items-center">
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 15px rgba(106, 117, 245, 0.5)",
              backgroundColor: "#2D2D5A",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={goToLandingPage}
            className="flex items-center p-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white transition-all"
          >
            <motion.span
              animate={{ x: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <FiArrowLeft className="text-lg" />
            </motion.span>
          </motion.button>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-indigo-500 w-8 h-8 rounded-md flex items-center justify-center ml-6"
          >
            <FiLayout className="text-white" />
          </motion.div>
          <h1 className="text-xl font-bold ml-2">
            <span className="text-white">Gen</span>
            <span className="text-indigo-400">Doc</span>
            <span className="text-white">AI</span>
          </h1>
        </div>
        <div className="relative" ref={authDropdownRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleAuthDropdown}
            className="flex items-center bg-slate-800 hover:bg-slate-700 rounded-full p-2 transition-colors relative"
          >
            <FiUser className="text-xl text-indigo-400" />
            {token && (
              <motion.span
                className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              />
            )}
          </motion.button>
          <AnimatePresence>
            {showAuthDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-12 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-lg z-50 overflow-hidden"
              >
                {token ? (
                  <div className="p-4">
                    <div className="text-center p-4">
                      <FiUser className="mx-auto text-3xl text-indigo-400 mb-3" />
                      <p className="font-medium text-white">Logged In</p>
                      <p className="text-sm text-gray-400 mt-1">
                        You are now authenticated
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogout}
                      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg"
                    >
                      Logout
                    </motion.button>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-white">
                        {authMode === "login" ? "Login" : "Sign Up"}
                      </h3>
                      <button onClick={() => setShowAuthDropdown(false)}>
                        <FiX className="text-gray-400" />
                      </button>
                    </div>
                    {authError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mb-4 p-2 bg-red-500/20 text-red-300 rounded text-sm"
                      >
                        {authError}
                      </motion.div>
                    )}
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white"
                      />
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={
                        authMode === "login" ? handleLogin : handleSignup
                      }
                      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg my-4"
                    >
                      {authMode === "login" ? "Login" : "Sign Up"}
                    </motion.button>
                    <div className="text-center text-sm text-gray-400">
                      {authMode === "login"
                        ? "Don't have an account? "
                        : "Already have an account? "}
                      <button
                        onClick={switchAuthMode}
                        className="text-indigo-400 hover:underline"
                      >
                        {authMode === "login" ? "Sign Up" : "Login"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
          >
            <span className="text-white">Transform Your </span>
            <span className="text-indigo-400">Code</span>
            <span className="text-white"> into Documentation</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Upload your files and let AI generate professional documentation
            with diagrams and insights
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={cardHover}
          className="bg-slate-900/50 rounded-2xl shadow-xl overflow-hidden border border-white/10"
        >
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <motion.h2
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-semibold text-white flex items-center"
                  >
                    <FiUpload className="mr-2 text-indigo-400" />
                    Upload Your Files
                    <span className="text-red-500 ml-1">*</span>
                  </motion.h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    className="text-indigo-400"
                    onMouseEnter={() =>
                      showHelpTooltip(
                        "Supported formats: .py, .js, .jsx, .java, .php, .html, .css, .ts, .json"
                      )
                    }
                  >
                    <FiHelpCircle />
                  </motion.button>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all relative ${
                    isDragging
                      ? "border-indigo-400 bg-slate-700"
                      : "border-white/10 bg-slate-800"
                  } ${
                    error.includes("upload")
                      ? "border-red-500 shake-animation"
                      : ""
                  }`}
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isDragging && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-indigo-500/20 rounded-xl flex items-center justify-center"
                    >
                      <div className="text-2xl text-white font-bold">
                        Drop your files here
                      </div>
                    </motion.div>
                  )}
                  <FiUpload className="mx-auto text-3xl text-indigo-400 mb-3" />
                  <p className="text-gray-400 mb-2">
                    <span className="text-indigo-400 font-medium">
                      Drag & Drop your files
                    </span>{" "}
                    or <span className="text-indigo-400">browse</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Supported formats: .py, .js, .jsx, .java, .php, .html, .css,
                    .ts, .json
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    accept=".py,.js,.jsx,.java,.php,.html,.css,.ts,.json,.txt"
                    required
                  />
                </motion.div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 text-red-400 text-sm flex items-center"
                  >
                    <FiX className="mr-1" /> {error}
                  </motion.div>
                )}
                {files.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-4"
                  >
                    <h3 className="text-md font-medium text-gray-400 mb-3">
                      Uploaded Files ({files.length})
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {files.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ scale: 1.03 }}
                          className="bg-slate-800 px-4 py-3 rounded-xl flex items-center min-w-[200px]"
                        >
                          <div className="mr-3">{getFileIcon(file.name)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-white">
                              {file.name}
                            </div>
                            <div className="text-xs text-indigo-400">
                              {getFileType(file.name)}
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-2 text-gray-400 hover:text-white"
                          >
                            <FiX />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="instructions"
                    className="block text-lg font-medium text-white flex items-center"
                  >
                    <FiMessageSquare className="mr-2 text-indigo-400" />
                    Custom Instructions
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    className="text-indigo-400"
                    onMouseEnter={() =>
                      showHelpTooltip(
                        "Add specific requirements, focus areas, or special requests for the documentation"
                      )
                    }
                  >
                    <FiHelpCircle />
                  </motion.button>
                </div>
                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => {
                    setInstructions(e.target.value);
                    setError("");
                  }}
                  placeholder="Specify documentation requirements, focus areas, or special requests..."
                  required
                  className={`w-full h-32 px-4 py-3 bg-slate-800 border ${
                    error.includes("Custom")
                      ? "border-red-500 shake-animation"
                      : "border-white/10"
                  } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-white`}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-lg font-medium text-white flex items-center">
                    <FiStar className="mr-2 text-indigo-400" />
                    Output Format<span className="text-red-500 ml-1">*</span>
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    className="text-indigo-400"
                    onMouseEnter={() =>
                      showHelpTooltip(
                        "Choose your preferred documentation format"
                      )
                    }
                  >
                    <FiHelpCircle />
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {formatOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      type="button"
                      onClick={() => setFormat(option.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={format === option.id ? "selected" : "default"}
                      variants={{
                        selected: {
                          scale: 1.05,
                          boxShadow: "0 0 20px rgba(106, 117, 245, 0.7)",
                          borderColor: "#6A75F5",
                          backgroundColor: "#2D2D5A",
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 15,
                          },
                        },
                        default: {
                          scale: 1,
                          boxShadow: "0 0 0px rgba(0,0,0,0)",
                          backgroundColor: "#14142B",
                          transition: { duration: 0.2 },
                        },
                      }}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                        format === option.id
                          ? "border-indigo-500"
                          : "border-white/10 hover:border-indigo-500"
                      }`}
                    >
                      <div className="text-2xl mb-3 text-indigo-400">
                        {option.icon}
                      </div>
                      <span className="font-medium text-lg mb-1 text-white">
                        {option.label}
                      </span>
                      <span className="text-sm text-gray-400">
                        {option.desc}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
                {files.length > 0 && !isGenerating && !isGenerated && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetForm}
                    className="px-6 py-3 font-medium rounded-full bg-slate-800 border border-indigo-500 text-indigo-400 hover:bg-slate-700 transition-colors"
                  >
                    <span className="flex items-center justify-center">
                      <FiRefreshCw className="mr-2" />
                      Reset Files
                    </span>
                  </motion.button>
                )}
                <motion.button
                  type="submit"
                  disabled={files.length === 0 || isGenerating || isGenerated}
                  whileHover={{
                    scale: files.length > 0 ? 1.05 : 1,
                    boxShadow:
                      files.length > 0
                        ? "0 0 20px rgba(106, 117, 245, 0.5)"
                        : "none",
                  }}
                  whileTap={{ scale: files.length > 0 ? 0.95 : 1 }}
                  className={`px-8 py-4 font-bold rounded-full text-white shadow-lg transition-all relative overflow-hidden ${
                    files.length === 0 || isGenerated
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-indigo-500/40"
                  }`}
                >
                  {isGenerating ? (
                    <span className="flex items-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="mr-3"
                      >
                        <FiZap className="text-white" />
                      </motion.div>
                      Generating... {progress}%
                    </span>
                  ) : isGenerated ? (
                    <span className="flex items-center">
                      <FiCheck className="mr-2" />
                      Documentation Ready!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FiZap className="mr-2" />
                      Generate Documentation
                    </span>
                  )}
                  {isGenerating && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-indigo-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  )}
                </motion.button>
              </div>
            </form>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6"
              >
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Processing files...
                  </span>
                  <span className="text-sm text-indigo-400 font-medium">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
              </motion.div>
            )}
            {isGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-slate-800 rounded-xl border border-indigo-500"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <FiFileText className="mr-2 text-indigo-400" />
                    Documentation Ready!
                  </h3>
                  <span className="px-3 py-1 bg-indigo-500 rounded-full text-xs font-medium">
                    {format.toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-900 border border-white/10 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm text-gray-400">Generated from:</div>
                    <div className="text-sm text-white">
                      {files.length} file{files.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="h-48 relative bg-gradient-to-br from-slate-900 to-slate-800 rounded border border-white/10 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full filter blur-[90px]"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400 rounded-full filter blur-[80px]"></div>
                    </div>
                    <div className="text-center relative z-10">
                      <div className="text-4xl mb-3 text-indigo-400">📄</div>
                      <p className="text-xl text-white mb-2">
                        AI Documentation Preview
                      </p>
                      <p className="text-sm text-gray-400">
                        Introduction, Architecture, Features, Diagrams
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="bg-slate-800 px-3 py-1 rounded-full text-xs text-gray-400">
                      20 Pages
                    </div>
                    <div className="bg-slate-800 px-3 py-1 rounded-full text-xs text-gray-400">
                      5 Diagrams
                    </div>
                    <div className="bg-slate-800 px-3 py-1 rounded-full text-xs text-gray-400">
                      Code Examples
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-3 rounded-lg flex items-center justify-center shadow-lg"
                  >
                    <FiDownload className="mr-2" />
                    Download {format.toUpperCase()}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetForm}
                    className="flex-1 bg-slate-800 border border-indigo-500 text-indigo-400 hover:bg-slate-700 px-4 py-3 rounded-lg flex items-center justify-center"
                  >
                    <FiRefreshCw className="mr-2" />
                    Create New
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-6 right-6 bg-slate-800 border border-indigo-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-xs z-50"
            >
              <div className="flex items-start">
                <FiHelpCircle className="text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
                <p>{tooltipContent}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="bg-slate-800 border-t border-white/10 py-8 mt-16"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-indigo-500 w-8 h-8 rounded-md flex items-center justify-center mr-3">
                <FiLayout className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-bold">
                <span className="text-white">Gen</span>
                <span className="text-indigo-400">Doc</span>
                <span className="text-white">AI</span>
              </h3>
            </div>
            <div className="text-gray-400 text-sm">
              <p>© 2025 GenDocAI. All rights reserved.</p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              {["#6A75F5", "#5D5FEF", "#4A4BCC"].map((color, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.2, backgroundColor: "#6A75F5" }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  <div className="bg-slate-900 w-6 h-6 rounded-full"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <style jsx>{`
        .shake-animation {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes shake {
          10%,
          90% {
            transform: translateX(-1px);
          }
          20%,
          80% {
            transform: translateX(2px);
          }
          30%,
          50%,
          70% {
            transform: translateX(-4px);
          }
          40%,
          60% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
};

export default UploadPage;
