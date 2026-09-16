const fs = require('fs');

// Patch AdminAiSettingsCard
let file1 = 'frontend/src/components/AdminAiSettingsCard.tsx';
let code1 = fs.readFileSync(file1, 'utf8');

const newDatalist = `<datalist id="gemini-models">
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Uusim, kiire)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Võimekas)</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Stabiilne)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          </datalist>`;
code1 = code1.replace(/<datalist id="gemini-models">[\s\S]*?<\/datalist>/, newDatalist);
code1 = code1.replace(/gemini-3\.8-flash/g, 'gemini-2.5-flash');
fs.writeFileSync(file1, code1, 'utf8');

// Patch aiSettings.ts
let file2 = 'aiSettings.ts';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/gemini-3\.8-flash/g, 'gemini-2.5-flash');
fs.writeFileSync(file2, code2, 'utf8');

// Patch server logic just in case
let file3 = 'server.ts';
let code3 = fs.readFileSync(file3, 'utf8');
code3 = code3.replace(/gemini-3\.8-flash/g, 'gemini-2.5-flash');
fs.writeFileSync(file3, code3, 'utf8');

console.log("Patched models");
