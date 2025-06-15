require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const parser = require("@babel/parser");

// -----------------------------------------------------------------------------
// Load environment variables
const PORT = process.env.PORT || 3001;
const DOCBUILDER_URL = process.env.DOCBUILDER_URL || "http://localhost:5002";

console.log("Step: Starting Express server setup");

// -----------------------------------------------------------------------------
// Init Express
const app = express();
app.use(express.json());
app.use(cors());

// -----------------------------------------------------------------------------
// Define static prompts for project info & UML instructions
const PROJECT_INFO_PROMPT = `You are a documentation builder.
Analyze the code and user instructions, then output a JSON object with a 'project_info' field summarizing:
- Purpose
- Key modules/classes/functions
- Data models or entities
`;

const UML_INSTRUCTIONS_PROMPT = `You are a UML generation assistant.
Given the code and user instructions, output a JSON object with a 'uml_instructions' field describing which UML diagrams to generate (e.g., class, sequence, component) and key elements for each.
`;

// -----------------------------------------------------------------------------
// Code parsing utility with @babel/parser
function parseCode(code, ext) {
  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: [
        "jsx",
        "classProperties",
        "optionalChaining",
        "decorators-legacy",
        "dynamicImport",
      ],
    });
    const funcs = [],
      classes = [];
    ast.program.body.forEach((node) => {
      if (node.type === "FunctionDeclaration" && node.id)
        funcs.push(node.id.name);
      if (node.type === "ClassDeclaration" && node.id)
        classes.push(node.id.name);
    });
    return { functions: funcs, classes, lines: code.split("\n").length };
  } catch (err) {
    console.error("Code parsing error:", err);
    return { error: err.message };
  }
}

// -----------------------------------------------------------------------------
// Multer config
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_, file, cb) =>
      cb(null, uuidv4() + path.extname(file.originalname)),
  }),
});
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// -----------------------------------------------------------------------------
// Helpers: Return predefined prompts along with code + instructions
function generateProjectInfoPrompted(code, instructions) {
  return (
    PROJECT_INFO_PROMPT + `\nCode:\n${code}\nInstructions:\n${instructions}`
  );
}

function generateUmlInstructionsPrompted(code, instructions) {
  return (
    UML_INSTRUCTIONS_PROMPT + `\nCode:\n${code}\nInstructions:\n${instructions}`
  );
}

// -----------------------------------------------------------------------------
// Generate route
app.post("/generate", upload.single("inputFile"), async (req, res) => {
  console.log(">>> /generate called");
  const file = req.file;
  const instructions = req.body.instructions;
  const format = req.body.format || "markdown";

  if (!file) {
    console.warn("No file uploaded");
    return res.status(400).json({ message: "No file uploaded" });
  }
  if (!instructions) {
    console.warn("Missing instructions");
    return res.status(400).json({ message: "Missing instructions" });
  }

  let code;
  try {
    code = fs.readFileSync(file.path, "utf8");
  } catch (e) {
    console.error("File read error:", e);
    return res.status(500).json({ message: "File read error" });
  }

  const ext = path.extname(file.originalname).substring(1);
  const parseInfo = parseCode(code, ext);
  console.log("Parsed code info:", parseInfo);

  // Build prompts
  const project_info_payload = generateProjectInfoPrompted(code, instructions);
  const uml_instructions_payload = generateUmlInstructionsPrompted(
    code,
    instructions
  );
  console.log("Project Info Prompt length:", project_info_payload.length);
  console.log(
    "UML Instructions Prompt length:",
    uml_instructions_payload.length
  );

  // Build payload for Docbuilder
  const payload = {
    code,
    instructions,
    abstract: project_info_payload, // ← send the project summary here
    format,
    project_info: project_info_payload,
    uml_instructions: uml_instructions_payload,
  };
  console.log("Payload to Docbuilder:", {
    codeLength: code.length,
    instructions,
    format,
    project_info_length: project_info_payload.length,
    uml_instructions_length: uml_instructions_payload.length,
  });
  console.debug("Full payload object:", payload);

  try {
    // Call Docbuilder service
    const resp = await axios.post(`${DOCBUILDER_URL}/build-document`, payload, {
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true,
    });
    console.log(`Docbuilder responded status ${resp.status}`);
    console.debug("Docbuilder response data:", resp.data);

    if (resp.status !== 200) {
      console.error("Docbuilder error detail:", {
        status: resp.status,
        data: resp.data,
      });
      return res.status(resp.status).json({
        message: "Docbuilder error",
        detail: resp.data,
      });
    }

    // Forward success
    console.log("Sending final response back to client");
    return res.json(resp.data);
  } catch (err) {
    console.error("Integration error:");

    // Handle Axios AggregateError
    if (err instanceof AggregateError && err.errors) {
      console.error("  Multiple errors occurred:");
      err.errors.forEach((sub, i) => {
        console.error(`  [${i}]`, sub.stack || sub.message || sub);
      });
    }
    // Handle single Axios error with response
    else if (err.response) {
      console.error("  Status:", err.response.status);
      console.error("  Headers:", err.response.headers);
      console.error("  Data:", err.response.data);
    } else {
      // Some other error
      console.error("  Message:", err.message);
      console.error(err.stack);
    }

    return res
      .status(500)
      .json({ message: "Service integration failed", detail: err.message });
  } finally {
    // Cleanup uploaded file
    if (file && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log("Upload file cleaned up");
      } catch (cleanupErr) {
        console.error("Error cleaning up upload file:", cleanupErr);
      }
    }
  }
});

// -----------------------------------------------------------------------------
// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
