const express = require("express");
const multer = require("multer");
const pdf = require("pdf-parse");
const tesseract = require("node-tesseract-ocr");
const OpenAI = require("openai");
const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

// MongoDB Schema
// const summarySchema = new mongoose.Schema({
//   originalText: String,
//   shortSummary: String,
//   mediumSummary: String,
//   longSummary: String,
//   highlights: [String],
//   createdAt: { type: Date, default: Date.now },
//   documentName: String,
// });

// const Summary = mongoose.model("Summary", summarySchema);

// Configure OpenAI
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// Text extraction function
async function extractText(file) {
  if (file.mimetype === "application/pdf") {
    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdf(dataBuffer);
    return data.text;
  } else if (file.mimetype.startsWith("image/")) {
    const config = {
      lang: "eng",
      oem: 1,
      psm: 3,
    };
    const text = await tesseract.recognize(file.path, config);
    return text;
  }
  throw new Error("Unsupported file type");
}

// API Endpoint
app.post("/api/summarize", upload.single("document"), async (req, res) => {
  try {
    const text = await extractText(req.file);
    console.log("text: ", text);
    return res.json({
      text,
    });
    const summaries = await generateSummaries(text);

    const summary = new Summary({
      originalText: text,
      shortSummary: summaries.short,
      mediumSummary: summaries.medium,
      longSummary: summaries.long,
      highlights: summaries.highlights,
      documentName: req.file.originalname,
    });

    await summary.save();
    res.json(summary);
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/crash", () => {
  throw new Error("forceful app crash1");
});

app.get("/fatal", (req, res) => {
  process.exit(1); // Exit with error code
});

app.listen(4000, (err) => {
  if (err) {
    console.error("Error starting server: ", err);
  } else {
    console.log("server listening at 4000");
  }
});
