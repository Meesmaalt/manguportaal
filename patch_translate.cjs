const fs = require('fs');
let file = 'frontend/src/pages/EditPack.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("alert('Tõlge lisatud! Vaata tulemus üle ja vajuta all \"Salvesta muudatused\".')", "alert('Tõlge lisatud! Vaata tulemus üle ja vajuta all \"Salvesta muudatused\".')\n      setTranslateModalOpen(false)");
code = code.replace(/} catch \(e: any\) \{\n\s*setError\(e\.message \|\| 'Tõlkimine ebaõnnestus'\)\n\s*\} finally \{/, "} catch (e: any) {\n      setError(e.message || 'Tõlkimine ebaõnnestus')\n      setTranslateModalOpen(false)\n    } finally {");

fs.writeFileSync(file, code, 'utf8');
console.log("Patched translation modal");
