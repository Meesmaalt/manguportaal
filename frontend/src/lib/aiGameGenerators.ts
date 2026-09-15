/**
 * Comprehensive AI generation helper for all party games:
 * - Miljonär (15 escalating tiers + host notes)
 * - Kuldvillak (Jeopardy 5x5 categories + Final Jeopardy)
 * - Rooside Sõda (Family Feud 4 rounds of survey questions)
 * - Blitz / Kahoot (Custom interactive questions)
 * - Sõnaseletus (Alias word lists)
 * - Ma ei ole kunagi (Never Have I Ever statements)
 * - Viimane püsti (Stand-up party statements)
 * - Tõde või tegu (Truth or Dare cards)
 */
import { callGeminiDirectly, hasClientGeminiKey } from './geminiClient'

function cleanJson(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim()
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim()
  return cleaned
}

/**
 * Generate Kuldvillak pack (5 categories x 5 questions + 1 final jeopardy)
 */
export async function generateKuldvillakAi(topic: string) {
  const chosenTopic = topic || 'Üldteadmised, filmid, Eesti ja meelelahutus'
  const seed = Math.floor(Math.random() * 1000000)
  const prompt = `Loo telesaate "Kuldvillak" (Jeopardy) stiilis mälumängu pakett eesti keeles teemal: "${chosenTopic}".
Unikaalsuse kood: ${seed}. Mõtle välja täiesti unikaalsed kategooriad ja küsimused!

Paketis peab olema TÄPSELT 5 kategooriat.
Igas kategoorias peab olema TÄPSELT 5 küsimust kasvava raskusastmega (punktid 100, 200, 300, 400, 500).
Lisaks 1 Finaalküsimus ("finalJeopardy").

Vasta AINULT kehtiva JSON objektina:
{
  "categories": [
    {
      "name": "KATEGOORIA NIMI 1",
      "questions": [
        { "points": 100, "q": "Lihtne vihje...", "a": "Mis on vastus?" },
        { "points": 200, "q": "Veidi raskem...", "a": "Kes on ...?" },
        { "points": 300, "q": "Keskmine...", "a": "Mida tähendab ...?" },
        { "points": 400, "q": "Keeruline...", "a": "Kus asub ...?" },
        { "points": 500, "q": "Väga raske...", "a": "Millal toimus ...?" }
      ]
    },
    ... (veel 4 kategooriat)
  ],
  "finalJeopardy": {
    "q": "Väga raske ja otsustav finaalküsimus...",
    "a": "Mis või kes on see?",
    "hostNote": "Saatejuhile väike vihje või huvitav fakt selle kohta"
  }
}`
  const raw = await callGeminiDirectly(prompt, { temperature: 0.9 })
  const parsed = JSON.parse(cleanJson(raw))
  if (!parsed.categories || parsed.categories.length < 5) {
    throw new Error('Kuldvillaku vastus ei sisalda 5 kategooriat.')
  }
  return parsed
}

/**
 * Generate Rooside Sõda (Family Feud) pack (5 survey rounds + Final)
 */
export async function generateRoosidesodaAi(topic: string) {
  const chosenTopic = topic || 'Igapäevaelu, Eesti kombed, suhted ja seltskond'
  const seed = Math.floor(Math.random() * 1000000)
  const prompt = `Loo telesaate "Rooside Sõda" (Family Feud) stiilis 5-vooruline põhimäng ja Suur Finaal (5 kiirküsimust) eesti keeles teemal: "${chosenTopic}".
Unikaalsuse kood: ${seed}. Mõtle välja täiesti uued ja originaalsed küsitlused 100 inimese seas!

PÕHIMÄNG:
5 vooru. Igas voorus 1 küsimus ja 5-6 kõige populaarsemat vastust (summa ~80-100).
Voor 1 (1x punktid), Voor 2 (1x), Voor 3 (2x), Voor 4 (3x), Voor 5 (4x).

SUUR FINAAL (Fast Money):
Täpselt 5 kiirküsimust, millele saab vastata ühe-kahe sõnaga.
Igal küsimusel pakkuda 3-5 kõige populaarsemat vastust (punktide summa ~90-100 iga küsimuse kohta).

Vasta AINULT kehtiva JSON objektina, ilma Markdownita:
{
  "rounds": [
    {
      "title": "VOOR 1",
      "multiplier": 1,
      "question": "Nimetage...",
      "answers": [ { "text": "Vastus 1", "points": 34 } ]
    }
  ],
  "finalRound": [
    {
      "question": "Kiirküsimus 1...",
      "answers": [ { "text": "Parim vastus", "points": 45 }, { "text": "Teine vastus", "points": 20 } ]
    }
  ]
}`
  const raw = await callGeminiDirectly(prompt, { temperature: 0.9 })
  const parsed = JSON.parse(cleanJson(raw))
  if (!parsed.rounds || !Array.isArray(parsed.rounds)) {
    throw new Error('Rooside sõja vastus ei sisalda voorusid.')
  }
  return parsed
}

/**
 * Generate Sõnaseletus (Alias) word list
 */
export async function generateSonaseletusAi(topic: string, count = 40) {
  const prompt = `Loo täpselt ${count} põnevat, seltskondlikku ja mitmekesist eesti keelset sõna või fraasi Sõnaseletuse (Aliase) mängu jaoks teemal: "${topic || 'Eesti elu, meelelahutus, argipäev ja huumor'}".
Iga sõna peaks olema seletatav, sisaldades nii lihtsaid esemeid kui ka tuntud tegelasi või naljakaid situatsioone.
Vasta AINULT JSON massiivina (stringide massiiv):
["Sõna 1", "Sõna 2", "Sõna 3", ...]`
  const raw = await callGeminiDirectly(prompt)
  const parsed = JSON.parse(cleanJson(raw))
  if (!Array.isArray(parsed)) throw new Error('Vastus ei ole massiiv.')
  return parsed as string[]
}

/**
 * Generate "Ma ei ole kunagi" (Never Have I Ever) statements
 */
export async function generateMaEiOleKunagiAi(topic: string, count = 30) {
  const prompt = `Loo täpselt ${count} lõbusat, vürtsikat või humoorikat "Ma ei ole kunagi..." väidet eesti keeles peo- ja seltskonnamängu jaoks teemal/suunal: "${topic || 'Peod, reisimine, piinlikud lood ja igapäevaelu'}".
Vasta AINULT JSON massiivina (stringide massiiv):
["Ma ei ole kunagi valetanud oma vanuse kohta", "Ma ei ole kunagi magama jäänud kinos", ...]`
  const raw = await callGeminiDirectly(prompt)
  const parsed = JSON.parse(cleanJson(raw))
  if (!Array.isArray(parsed)) throw new Error('Vastus ei ole massiiv.')
  return parsed as string[]
}

/**
 * Generate "Viimane püsti" (Last Man Standing) statements
 */
export async function generateViimanePustiAi(topic: string, count = 30) {
  const prompt = `Loo täpselt ${count} seltskondlikku ja kaasahaaravat väidet mängule "Viimane püsti / Istu maha kui..." eesti keeles teemal: "${topic || 'Igapäevaelu, harjumused, reisimine ja kogemused'}".
Iga lause peaks algama sobivalt või olema selge tingimus (nt "Istu maha, kui oled täna hommikul kohvi joonud", "Istu maha, kui sul on koduloom").
Vasta AINULT JSON massiivina (stringide massiiv):
["Istu maha, kui sul on seljas midagi sinist", "Istu maha, kui oled käinud sel aastal välismaal", ...]`
  const raw = await callGeminiDirectly(prompt)
  const parsed = JSON.parse(cleanJson(raw))
  if (!Array.isArray(parsed)) throw new Error('Vastus ei ole massiiv.')
  return parsed as string[]
}

/**
 * Generate "Tõde või tegu" (Truth or Dare) cards
 */
export async function generateTodeVoiTeguAi(topic: string, count = 20) {
  const prompt = `Loo seltskonnamängule "Tõde või tegu" ${count} head küsimust (tõed) ja ${count} lõbusat ülesannet (teod) eesti keeles teemal/stiilis: "${topic || 'Sõprade õhtu, lõbus ja seltskondlik ilma ohtlike tegudeta'}".
Vasta AINULT kehtiva JSON objektina:
{
  "truths": [
    "Mis on sinu kõige piinlikum kohtingulugu?",
    ...
  ],
  "dares": [
    "Räägi järgmised 2 minutit ilma naeratamata",
    ...
  ]
}`
  const raw = await callGeminiDirectly(prompt)
  const parsed = JSON.parse(cleanJson(raw))
  if (!parsed.truths || !parsed.dares) throw new Error('Vastus ei sisalda tõdesid ja tegusid.')
  return parsed as { truths: string[]; dares: string[] }
}