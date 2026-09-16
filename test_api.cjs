const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'dummy' });
async function test() {
  try {
    await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Hello',
    });
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}
test();
