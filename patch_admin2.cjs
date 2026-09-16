const fs = require('fs');
let file = 'frontend/src/components/AdminAiSettingsCard.tsx';
let code = fs.readFileSync(file, 'utf8');

const selectHtmlRegex = /<select[\s\S]*?<\/select>/;

const newHtml = `<input
            type="text"
            list="gemini-models"
            className="input-field text-sm w-full sm:w-64"
            value={model}
            placeholder="nt. gemini-3.7-flash"
            onChange={(e) => setModel(e.target.value)}
          />
          <datalist id="gemini-models">
            <option value="gemini-3.8-flash">Gemini 3.8 Flash (Vaikimisi - kiire)</option>
            <option value="gemini-3.8-pro">Gemini 3.8 Pro (Võimsam)</option>
            <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
            <option value="gemini-3.7-pro">Gemini 3.7 Pro</option>
            <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
            <option value="gemini-3.6-pro">Gemini 3.6 Pro</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </datalist>`;

code = code.replace(selectHtmlRegex, newHtml);
fs.writeFileSync(file, code, 'utf8');
console.log("Patched admin card with datalist");
