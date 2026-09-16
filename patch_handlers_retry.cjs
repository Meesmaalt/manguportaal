const fs = require('fs');

function addRetry(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace the single generateContent call with a try-catch and fallback
  const searchStr = `  const response = await ai.models.generateContent({
    model: getGlobalModel(),
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  })`;
  
  const searchStr2 = searchStr.replace('temperature: 0.2', 'temperature: 0.7'); // for quiz handler

  const replaceStr = (temp) => `  let response;
  try {
    response = await ai.models.generateContent({
      model: getGlobalModel() || 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: ${temp}, responseMimeType: 'application/json' },
    });
  } catch (err: any) {
    console.log("Model failed, falling back to gemini-1.5-flash. Error:", err?.message);
    // Fallback to stable 1.5 flash
    response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { temperature: ${temp}, responseMimeType: 'application/json' },
    });
  }`;

  if (code.includes('temperature: 0.2')) {
    code = code.replace(searchStr, replaceStr('0.2'));
  } else if (code.includes('temperature: 0.7')) {
    code = code.replace(searchStr2, replaceStr('0.7'));
  }
  
  fs.writeFileSync(file, code, 'utf8');
}

addRetry('frontend/src/server/aiTranslateHandler.ts');
addRetry('frontend/src/server/aiQuizHandler.ts');
console.log("Patched retry logic");
