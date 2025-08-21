import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

const HF_TOKEN = process.env.HF_TOKEN;
const MODEL = "Salesforce/blip-image-captioning-base";

// Route: Upload image + get caption
app.post("/caption", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const image = fs.readFileSync(filePath);

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: image,
      }
    );

    fs.unlinkSync(filePath); // delete after use
    const result = await response.json();

    res.json({ caption: result[0]?.generated_text || "No caption found." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
