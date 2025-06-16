// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// Tree‑sitter setup for parsing
const Parser = require("node-tree-sitter");
const JavaScript = require("tree-sitter-javascript");
const Python = require("tree-sitter-python");

// -----------------------------------------------------------------------------
// Load environment variables
const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/gendocai_db";
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const DOC_BUILDER_URL = process.env.DOC_BUILDER_URL || "http://localhost:5002";

// -----------------------------------------------------------------------------
// Initialize Express app & middleware
const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// -----------------------------------------------------------------------------
// Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("🟢 MongoDB connected"))
  .catch((err) => {
    console.error("🔴 MongoDB connection error:", err);
    process.exit(1);
  });

// -----------------------------------------------------------------------------
// User schema & model for authentication
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", UserSchema);

// --- UPGRADED: History schema now stores both prompt info and filenames ---
const HistorySchema = new mongoose.Schema({
  userId: String,
  fileName: String,
  format: String,
  parseInfo: Object,
  projectInfo: String,
  umlInstructions: String,
  generatedFiles: {
    docx: String,
    pdf: String,
    pptx: String,
  },
  createdAt: { type: Date, default: Date.now },
});
const History = mongoose.model("History", HistorySchema);

// -----------------------------------------------------------------------------
// Auth middleware
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// -----------------------------------------------------------------------------
// Auth endpoints
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });
  const existing = await User.findOne({ email });
  if (existing)
    return res.status(409).json({ message: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.status(201).json({ message: "User created", token });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ message: "Logged in", token });
});

app.get("/auth/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ name: user.email.split("@")[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------------------------------------------------------------
// Multer setup
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) =>
    cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({ storage });
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// --- RESTORED: Code parsing and prompt building logic ---
function parseCode(code, ext) {
  const parser = new Parser();
  try {
    if (ext === ".js" || ext === ".jsx") parser.setLanguage(JavaScript);
    else if (ext === ".py") parser.setLanguage(Python);
    else return { functions: [], classes: [], lines: code.split("\n").length };
    const tree = parser.parse(code);
    const root = tree.rootNode;
    const functions = [],
      classes = [];
    root.namedChildren.forEach((node) => {
      if (node.type.includes("function"))
        functions.push(node.childForFieldName("name")?.text || "<anonymous>");
      if (node.type.includes("class"))
        classes.push(node.childForFieldName("name")?.text || "<anonymous>");
    });
    return { functions, classes, lines: code.split("\n").length };
  } catch (err) {
    console.error("Parsing error:", err);
    return { error: err.message };
  }
}

const PROJECT_INFO_PROMPT = `You are a documentation builder.
Analyze the code and user instructions, then output a JSON object with a 'project_info' field summarizing:
- Purpose
- Key modules/classes/functions
- Data models or entities
`;
const UML_INSTRUCTIONS_PROMPT = `You are a UML generation assistant.
Given the code and user instructions, output a JSON object with a 'uml_instructions' field describing which UML diagrams to generate (e.g., class, sequence, component) and key elements for each.
`;
function buildProjectInfoPrompt(code, instructions) {
  return `${PROJECT_INFO_PROMPT}\nCode:\n${code}\nInstructions:\n${instructions}`;
}
function buildUmlInstructionsPrompt(code, instructions) {
  return `${UML_INSTRUCTIONS_PROMPT}\nCode:\n${code}\nInstructions:\n${instructions}`;
}

// --- UPGRADED: /generate endpoint using restored logic ---
app.post("/generate", auth, upload.single("inputFile"), async (req, res) => {
  try {
    const {
      file,
      body: { instructions, format = "docx" },
    } = req;
    if (!file || !instructions)
      return res
        .status(400)
        .json({ message: "File and instructions required" });

    const code = fs.readFileSync(file.path, "utf8");

    // Perform parsing and prompt building from previous logic
    const parseInfo = parseCode(
      code,
      path.extname(file.originalname).toLowerCase()
    );
    const projectInfoPayload = buildProjectInfoPrompt(code, instructions);
    const umlInstructionsPayload = buildUmlInstructionsPrompt(
      code,
      instructions
    );

    // Assemble the complete payload for the docbuilder
    const payload = {
      code,
      instructions,
      format,
      abstract: projectInfoPayload,
      project_info: projectInfoPayload,
      uml_instructions: umlInstructionsPayload,
    };

    const resp = await axios.post(
      `${DOC_BUILDER_URL}/build-document`,
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 180000 }
    );
    if (resp.status !== 200) {
      return res
        .status(resp.status)
        .json({ message: "DocBuilder error", detail: resp.data });
    }

    // Save the complete history record
    await History.create({
      userId: req.user.id,
      fileName: file.originalname,
      format: format,
      parseInfo: parseInfo, // Save parsed info
      projectInfo: projectInfoPayload, // Save generated prompt
      umlInstructions: umlInstructionsPayload, // Save generated prompt
      generatedFiles: resp.data, // Save the filenames from the response
    });

    res.json(resp.data);
  } catch (err) {
    console.error("Error in /generate:", err);
    const detail = err.response ? err.response.data : err.message;
    res.status(500).json({ message: "Generation failed", detail });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

// -----------------------------------------------------------------------------
// History and Download Endpoints
app.get("/history", auth, async (req, res) => {
  try {
    const history = await History.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

app.delete("/history/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid history ID" });
    const historyItem = await History.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });
    if (!historyItem)
      return res.status(404).json({ message: "History item not found" });
    res.json({ message: "History item deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete history" });
  }
});

app.get("/download/:filetype/:filename", auth, async (req, res) => {
  try {
    const { filetype, filename } = req.params;
    const fileUrl = `${DOC_BUILDER_URL}/download/${filetype}/${filename}`;
    console.log(`Proxying download request for: ${fileUrl}`);

    const response = await axios({
      method: "GET",
      url: fileUrl,
      responseType: "stream",
    });
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Content-Length", response.headers["content-length"]);
    response.data.pipe(res);
  } catch (err) {
    console.error("Download proxy error:", err.message);
    const status = err.response ? err.response.status : 500;
    res.status(status).json({ error: "Could not download file." });
  }
});

// -----------------------------------------------------------------------------
// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
