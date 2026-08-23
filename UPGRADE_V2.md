# Õhtu Mängud — V2 upgrade

## What changed

### Game-show presentation
- Added reusable `GameShowFrame` with live indicator, cinematic background glow and fullscreen control.
- Applied the presentation layer to Kuldvillak, Rooside Sõda and generic host games.
- Added responsive TV/desktop/mobile presentation styling.

### Kuldvillak
- Added progress indicator showing played cards and percentage.
- Added animated card hover/reveal treatment.
- Added question reveal animation.
- Added score-change pulse animation.
- Added game-complete winner screen with replay action.
- Added lightweight WebAudio effects for reveal, correct and wrong outcomes.
- Added host keyboard shortcuts: `M` music, `R` reset, `Esc` close question.
- Added fullscreen control through the shared game-show frame.

### Playlist
- Playlist persists in browser localStorage.
- Games can be moved up/down.
- Playlist can be cleared.
- Added basic duration/persistence information.

### Project
- Bumped frontend version to `2.0.0`.
- Kept the existing PocketBase/session architecture and local-session fallback.
- No new backend collections are required for this V2 presentation upgrade.

## Verification

The TypeScript parser reports no syntax-level TSX errors in the modified source. A full production build could not be executed in the sandbox because the project's npm dependencies are not installed and external npm installation timed out in this environment. Run `npm install` followed by `npm run build` in `frontend/` on the deployment/build machine.
