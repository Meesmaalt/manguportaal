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


## V2.1 display/game-show upgrade

- Removed the Kuldvillak progress bar.
- Added display-only zoom controls (− / reset / +), up to 220%, persisted per browser.
- Fullscreen controls are localized.
- Display routes for non-Kuldvillak games now use the same game-show frame and zoom controls.
- Added localization for visible game controls and status text across the main games.
- Frontend version bumped to 2.1.0.

Note: the existing official question/word pack content remains authored in its original language. The localization system is ready for pack-level translated content, but the full question-bank translation is not included in this build.
