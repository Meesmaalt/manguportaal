const fs = require('fs');

let file1 = 'frontend/src/components/AiGeneratorBar.tsx';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(/import \{ hasClientGeminiKey \} from '@\/lib\/geminiClient'\n/, '');
code1 = code1.replace(/import GeminiApiKeyModal from '@\/components\/GeminiApiKeyModal'\n/, '');
code1 = code1.replace(/const \[keyModalOpen, setKeyModalOpen\] = useState\(false\)\n/, '');
code1 = code1.replace(/const \[keyAvailable, setKeyAvailable\] = useState\(\(\) => hasClientGeminiKey\(\)\)\n/, '');
code1 = code1.replace(/<button[^>]*onClick=\{\(\) => setKeyModalOpen\(true\)\}[^>]*>[\s\S]*?<\/button>/, '');
code1 = code1.replace(/\{\!keyAvailable && \([\s\S]*?\}\)\}/, '');
code1 = code1.replace(/<GeminiApiKeyModal[\s\S]*?\/>/, '');
fs.writeFileSync(file1, code1, 'utf8');

let file2 = 'frontend/src/components/GameAiModal.tsx';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/import \{ hasClientGeminiKey \} from '@\/lib\/geminiClient'\n/, '');
code2 = code2.replace(/import GeminiApiKeyModal from '@\/components\/GeminiApiKeyModal'\n/, '');
code2 = code2.replace(/const \[keyModalOpen, setKeyModalOpen\] = useState\(false\)\n/, '');
code2 = code2.replace(/const \[keyAvailable, setKeyAvailable\] = useState\(\(\) => hasClientGeminiKey\(\)\)\n/, '');
code2 = code2.replace(/<button[^>]*onClick=\{\(\) => setKeyModalOpen\(true\)\}[^>]*>[\s\S]*?<\/button>/, '');
code2 = code2.replace(/<div className="text-\[11px\] text-amber-300\/85 flex items-center gap-2">[\s\S]*?<\/div>/, '');
code2 = code2.replace(/\{\!keyAvailable && \([\s\S]*?\}\)\}/, '');
code2 = code2.replace(/<GeminiApiKeyModal[\s\S]*?\/>/, '');
fs.writeFileSync(file2, code2, 'utf8');

console.log("Patched components");
