export type WordRound = { words: string[]; wordIndex: number; running: boolean; timeLeft: number; teams: { name: string; score: number }[]; activeTeam: number }

/** Consume once; reaching the end ends the round instead of repeating answers. */
export function advanceWord<T extends WordRound>(state: T, awardPoint: boolean): T {
  if (!state.running || state.wordIndex >= state.words.length || state.timeLeft <= 0) return state
  const wordIndex = state.wordIndex + 1
  return {
    ...state, wordIndex,
    running: wordIndex < state.words.length,
    teams: state.teams.map((team, i) => awardPoint && i === state.activeTeam ? { ...team, score: team.score + 1 } : team),
  }
}
