import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyDxoy7ZeU7pNcRJS5X3DVXFD2VmHbJm_R4";
const ai = new GoogleGenAI({ apiKey });

async function check() {
  console.log("Checking models...");
  try {
    console.log("Attempting to generate with gemini-1.5-flash...");
    await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Hello',
    });
    console.log("Success with gemini-1.5-flash");
  } catch (e) {
    console.error("Failed with gemini-1.5-flash:", e.message);
  }

  try {
    console.log("Attempting to list models...");
    const result = await ai.models.list();
    // result might be an async iterable or a response object depending on SDK version
    console.log("Models found:");
    for await (const model of result) {
      if (model.name.includes("flash")) {
         console.log(model.name);
      }
    }
  } catch (e) {
    console.error("List models failed:", e);
  }
}

check();
