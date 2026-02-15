import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyDxoy7ZeU7pNcRJS5X3DVXFD2VmHbJm_R4";
const ai = new GoogleGenAI({ apiKey });

async function check() {
  const modelsToTest = [
    'gemini-flash-latest', 
    'gemini-2.0-flash-lite-preview-09-2025',
    'gemini-1.5-flash-latest', // Guessing, probably not there
    'gemini-1.5-flash-001'
  ];

  for (const modelName of modelsToTest) {
    console.log(`\nTesting ${modelName}...`);
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: 'Hello, are you working?',
      });
      console.log(`SUCCESS: ${modelName}`);
      console.log(response.text().substring(0, 50));
      // If one works, we might just stop or continue to see options
    } catch (e) {
      console.log(`FAILED: ${modelName} - ${e.message}`);
    }
  }
}

check();
