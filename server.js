const functions = require("firebase-functions");
const fetch = require("node-fetch");
const Busboy = require("busboy");

const HF_TOKEN = process.env.HF_TOKEN;
const MODEL = "Salesforce/blip-image-captioning-base";

exports.getCaption = functions.https.onRequest((req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const busboy = new Busboy({ headers: req.headers });
  let uploadBuffer = null;

  busboy.on("file", (fieldname, file) => {
    const chunks = [];
    file.on("data", (data) => chunks.push(data));
    file.on("end", () => {
      uploadBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on("finish", async () => {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/octet-stream",
          },
          body: uploadBuffer,
        }
      );

      const result = await response.json();
      res.json({ caption: result[0]?.generated_text || "No caption found." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  req.pipe(busboy);
});
