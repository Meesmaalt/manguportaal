const fs = require('fs');

let file = 'frontend/src/components/AdminAiSettingsCard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add model state
code = code.replace(/const \[apiKey, setApiKey\] = useState\(''\)/, "const [apiKey, setApiKey] = useState('')\n  const [model, setModel] = useState('gemini-3.8-flash')");

// Parse fetched data to get model
code = code.replace(/if \(data\.ok && data\.key\) \{[\s\S]*?\}/, `if (data.ok) {\n          if (data.key) {\n            setApiKey(data.key)\n            setHasKey(true)\n          }\n          if (data.model) {\n            setModel(data.model)\n          }\n        }`);

// Update handleSave fetch body
code = code.replace(/body: JSON\.stringify\(\{ key: val \}\)/, "body: JSON.stringify({ key: val, model })");
// Update handleClear fetch body
code = code.replace(/body: JSON\.stringify\(\{ key: '' \}\)/, "body: JSON.stringify({ key: '', model: 'gemini-3.8-flash' })");

// Add model selector HTML
const modelHtml = `        <div className="mt-4">
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            Gemini Mudel
          </label>
          <select
            className="input-field text-sm w-full sm:w-64"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gemini-3.8-flash">Gemini 3.8 Flash (Vaikimisi - kiire)</option>
            <option value="gemini-3.6-flash">Gemini 3.6 Flash (Stabiilne)</option>
            <option value="gemini-3.8-pro">Gemini 3.8 Pro (Võimsam, aga aeglasem)</option>
            <option value="gemini-3.6-pro">Gemini 3.6 Pro</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>`;

code = code.replace(/<\/div>\n\s*<div className="bg-blue-950\/30/, `</div>\n${modelHtml}\n        <div className="bg-blue-950/30`);

fs.writeFileSync(file, code, 'utf8');
console.log("Patched admin card");
