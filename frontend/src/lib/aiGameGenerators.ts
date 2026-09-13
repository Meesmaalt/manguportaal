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
  const prompt = `Loo telesaate "Kuldvillak" (Jeopardy) stiilis täismäng eesti keeles teemal: "${chosenTopic}".
Koosta täpselt 5 teemakategooriat, millest igaühes on täpselt 5 küsimust punktidega 100, 200, 300, 400, 500 (kasvavas raskusastmes).
Lisaks koosta 1 Finaalküsimus (finalJeopardy).

Vasta AINULT kehtiva JSON objektina:
{
  "categories": [
    {
      "name": "Kategooria nimi",
      "questions": [
        { "points": 100, "q": "Küsimuse tekst (100)", "a": "Õige vastus", "hostNote": "Lühike lisainfo saatejuhile" },
        { "points": 200, "q": "Küsimuse tekst (200)", "a": "Õige vastus", "hostNote": "" },
        { "points": 300, "q": "Küsimuse tekst (300)", "a": "Õige vastus", "hostNote": "" },
        { "points": 400, "q": "Küsimuse tekst (400)", "a": "Õige vastus", "hostNote": "" },
        { "points": 500, "q": "Küsimuse tekst (500)", "a": "Õige vastus", "hostNote": "" }
      ]
    }
  ],
  "finalJeopardy": {
    "q": "Põnev finaalküsimus",
    "a": "Finaali vastus",
    "hostNote": "Selgitus saatejuhile"
  }
}`

  const raw = await callGeminiDirectly(prompt)
  const parsed = JSON.parse(cleanJson(raw))
  if (!parsed.categories || !Array.isArray(parsed.categories)) {
    throw new Error('Kuldvillaku vastus ei sisalda kategooriaid.')
  }
  return parsed
}

/**
 * Generate Rooside Sõda (Family Feud) pack (4 survey rounds)
 */
export async function generateRoosidesodaAi(topic: string) {
  const chosenTopic = topic || 'Igapäevaelu, Eesti kombed, suhted ja seltskond'
  const prompt = `Loo telesaate "Rooside Sõda" (Family Feud) stiilis 4-vooruline mäng eesti keeles teemal või suunal: "${chosenTopic}".
Küsitluse tulemused 100 eestlase seas.
Igas voorus on 1 küsimus ja 5-6 kõige populaarsemat vastust koos punktidega (punktide summa voorus peaks olema ~85-100).
Voorud 1 (x1 punktid), Voor 2 (x1 punktid), Voor 3 (x2 topeltpunktid), Voor 4 (x3 kolmekordsed punktid).

Vasta AINULT kehtiva JSON objektina:
{
  "rounds": [
    {
      "title": "VOOR 1",
      "multiplier": 1,
      "question": "Nimetage midagi, mida inimesed teevad hommikul esimese asjana",
      "answers": [
        { "text": "Joovad kohvi", "points": 34 },
        { "text": "Pesevad hambaid", "points": 25 },
        { "text": "Vaatavad telefoni", "points": 18 },
        { "text": "Käivad duši all", "points": 12 },
        { "text": "Venitavad / ärkavad", "points": 6 }
      ]
    },
    {
      "title": "VOOR 2",
      "multiplier": 1,
      "question": "Küsimus 2...",
      "answers": [...]
    },
    {
      "title": "VOOR 3 (TOPELT)",
      "multiplier": 2,
      "question": "Küsimus 3...",
      "answers": [...]
    },
    {
      "title": "FINAALVOOR (KOLMEKORDNE)",
      "multiplier": 3,
      "question": "Küsimus 4...",
      "answers": [...]
    }
  ]
}`

  const raw = await callGeminiDirectly(prompt)
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
