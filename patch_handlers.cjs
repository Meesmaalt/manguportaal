const fs = require('fs');

let file1 = 'frontend/src/server/aiQuizHandler.ts';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace("import { getGlobalApiKey } from '../../../aiSettings.ts'", "import { getGlobalApiKey, getGlobalModel } from '../../../aiSettings.ts'");
code1 = code1.replace(/model: 'gemini-3\.8-flash'/g, "model: getGlobalModel()");
fs.writeFileSync(file1, code1, 'utf8');

let file2 = 'frontend/src/server/aiTranslateHandler.ts';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace("import { getGlobalApiKey } from '../../../aiSettings.ts'", "import { getGlobalApiKey, getGlobalModel } from '../../../aiSettings.ts'");
code2 = code2.replace(/model: 'gemini-3\.8-flash'/g, "model: getGlobalModel()");
fs.writeFileSync(file2, code2, 'utf8');

console.log("Patched handlers");
