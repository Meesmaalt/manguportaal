#!/usr/bin/env node
/**
 * Skript PocketBase packs ja game_sessions kollektsioonide game_type väärtuste uuendamiseks.
 * Kasutamine:
 *   node scripts/sync-pb-schema.cjs <PB_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>
 * Või keskkonnamuutujatega:
 *   PB_URL=https://... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node scripts/sync-pb-schema.cjs
 */

const PocketBase = require('pocketbase')

const pbUrl = process.argv[2] || process.env.PB_URL || process.env.VITE_PB_URL || 'http://127.0.0.1:8090'
const email = process.argv[3] || process.env.PB_ADMIN_EMAIL || 'admin@ohtu.local'
const password = process.argv[4] || process.env.PB_ADMIN_PASSWORD

if (!password) {
  console.log('Kasutamine: node scripts/sync-pb-schema.cjs <PB_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>')
  console.log('Näide: node scripts/sync-pb-schema.cjs https://tools.thormen.com:8090 admin@ohtu.local MinuParool123')
  process.exit(1)
}

const REQUIRED_GAME_TYPES = [
  'kuldvillak',
  'roosidesoda',
  'sonaseletus',
  'ma_ei_ole_kunagi',
  'viimane_pusti',
  'tode_voi_tegu',
  'kinnistu_deal',
  'blitz',
  'miljonar'
]

async function run() {
  console.log(`Ühendun PocketBase serveriga: ${pbUrl}`)
  const pb = new PocketBase(pbUrl)

  // Auth superuser / admin
  try {
    await pb.collection('_superusers').authWithPassword(email, password)
    console.log(`✓ Autenditud superuserina (_superusers): ${email}`)
  } catch (e1) {
    try {
      await pb.collection('superusers').authWithPassword(email, password)
      console.log(`✓ Autenditud superuserina (superusers): ${email}`)
    } catch (e2) {
      try {
        await pb.admins.authWithPassword(email, password)
        console.log(`✓ Autenditud adminina (admins): ${email}`)
      } catch (e3) {
        console.error('❌ Superuser sisselogimine ebaõnnestus:', e3.message || e3)
        process.exit(1)
      }
    }
  }

  for (const colName of ['packs', 'game_sessions']) {
    try {
      const col = await pb.collections.getOne(colName)
      let modified = false

      // PocketBase >= 0.23: fields massiiv
      if (Array.isArray(col.fields)) {
        const field = col.fields.find(f => f.name === 'game_type')
        if (field) {
          const current = Array.isArray(field.values) ? field.values : []
          const missing = REQUIRED_GAME_TYPES.filter(g => !current.includes(g))
          if (missing.length > 0) {
            field.values = Array.from(new Set([...current, ...REQUIRED_GAME_TYPES]))
            modified = true
            console.log(`[${colName}] Lisatakse puuduvad mängutüübid: ${missing.join(', ')}`)
          } else {
            console.log(`[${colName}] Kõik vajalikud mängutüübid on juba olemas.`)
          }
        }
      }

      // PocketBase < 0.23: schema massiiv
      if (Array.isArray(col.schema)) {
        const field = col.schema.find(f => f.name === 'game_type')
        if (field) {
          let current = (field.options && field.options.values) || field.values || []
          const missing = REQUIRED_GAME_TYPES.filter(g => !current.includes(g))
          if (missing.length > 0) {
            const next = Array.from(new Set([...current, ...REQUIRED_GAME_TYPES]))
            if (field.options) field.options.values = next
            field.values = next
            modified = true
            console.log(`[${colName}] Lisatakse puuduvad mängutüübid: ${missing.join(', ')}`)
          } else {
            console.log(`[${colName}] Kõik vajalikud mängutüübid on juba olemas.`)
          }
        }
      }

      if (modified) {
        await pb.collections.update(col.id, col)
        console.log(`✓ [${colName}] Kollektsioon edukalt salvestatud!`)
      }
    } catch (err) {
      console.error(`❌ Viga kollektsiooni [${colName}] uuendamisel:`, err.message || err)
    }
  }

  console.log('\nValmis! Nüüd saad Blitzi ja teisi mänge salvestada ilma validation_invalid_value veata.')
}

run()
