import { test } from 'node:test'
import assert from 'node:assert/strict'
import { advanceWord } from '../frontend/src/games/sonaseletus/round.ts'
import { drawUnused } from '../frontend/src/games/shared/draw.ts'

const round = () => ({ words: ['Tartu', 'Tallinn'], wordIndex: 0, running: true, timeLeft: 15, activeTeam: 1, teams: [{ name: 'A', score: 0 }, { name: 'B', score: 0 }] })

test('only the active team scores, and the last word ends the round without repeating', () => {
  const initial = round()
  const next = advanceWord(initial, true)
  assert.deepEqual(next.teams.map(t => t.score), [0, 1])
  assert.equal(next.running, true)
  const finished = advanceWord(next, true)
  assert.equal(finished.wordIndex, 2)
  assert.equal(finished.running, false)
  assert.deepEqual(finished.teams.map(t => t.score), [0, 2])
  assert.strictEqual(advanceWord(finished, true), finished)
  assert.equal(initial.wordIndex, 0)
  assert.equal(initial.teams[1].score, 0)
})
test('skipping consumes a word without scoring; paused and timed-out rounds cannot score', () => {
  const initial = round()
  assert.deepEqual(advanceWord(initial, false).teams, initial.teams)
  const paused = { ...initial, running: false }
  const expired = { ...initial, timeLeft: 0 }
  assert.strictEqual(advanceWord(paused, true), paused)
  assert.strictEqual(advanceWord(expired, true), expired)
})
test('truth and dare draw history prevents repeats and handles empty or exhausted packs', () => {
  const pool = ['A', 'B', 'C']
  const used = []
  for (let i = 0; i < pool.length; i++) {
    const index = drawUnused(pool, used, () => 0.5)
    assert.equal(used.includes(index), false)
    used.push(index)
  }
  assert.equal(drawUnused(pool, used), null)
  assert.equal(drawUnused([], []), null)
  assert.equal(drawUnused(pool, [1, 1, 99], () => 0), 0)
})
