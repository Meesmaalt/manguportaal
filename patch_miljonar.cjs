const fs = require('fs');
let code = fs.readFileSync('frontend/src/games/miljonar/generateMiljonarQuiz.ts', 'utf8');

const startStr = '// 1. Try direct Gemini API from browser if client key is configured';
const endStr = '// 2. Try Node.js server route if available';
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);
if (startIdx > -1 && endIdx > -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx);
    code = code.replace(/import \{ callGeminiDirectly, hasClientGeminiKey \} from '@\/lib\/geminiClient'\n?/, '');
    fs.writeFileSync('frontend/src/games/miljonar/generateMiljonarQuiz.ts', code, 'utf8');
    console.log("Patched");
}
