# I4 — card table, vine bed and remembering garden

Completed 5 November 2026.

Lilia's tower, Rio's greenhouse and the optional garden now have working objects inside the full-viewport world. Each object has an idle view that reflects saved progress. Approaching it opens the native working surface. The seven trial rooms now share this pattern.

| Room | Working object |
|---|---|
| Lilia's tower | The wood-and-felt table holds five illustrated cards, four printed memories and a permanent edge nick. CUT and QUARREL use the existing deck rules. The opposite chair submits the arrangement. Once accepted, the nick moves to the right and the player builds a confirmation sequence from five backs. The working and idle views show only the player's choices from that seat. The appointment envelope and memory album remain accessible. |
| Rio's greenhouse | The vine drawing and five named stone buttons share one coordinate plane. Draw from the current stone or activate an adjacent stone by tap or keyboard. The bridge stays a crossing. The saved route, fictional clauses, undo, reset, red flower and cottage exit use the same working bed. |
| Remembering garden | Eight numbered caps form a clockwise ring. Focus describes the existing neighbor rule, including wraparound. The optional ring supports undo, reset, recognition controls and a return to the cottage. |

The trials use printed rules, visible state and native keyboard controls. Sound starts with the required entrance gesture. The same Pixi application and audio context handle travel, reframing and menus. Lilia and Rio use their established show-inspired sprites. [Show design reference](SHOW_DESIGN_REFERENCE.md)

## Input and recovery

A vine stroke captures the working plane and retains its starting save revision and SVG transform. Release submits one validated path, including the final point. Resize, scroll, visibility changes, menus, closing the bed, capture loss and changes to saved state discard the draft. The saved route stays playable by drawing or native buttons after cancellation.

The table and ring display accepted save state. The tower orbit and Rio's petals span the viewport while controls stay upright. Reduced motion and Skip resolve presentation to the accepted state. Native interactions, save export and renderer retry are available through a still view when textures or the canvas fail.

## Garden art

Two separate built-in ImageGen calls produced the wide and portrait paintings. The supplied garden reference and existing Road palette informed the pond, roots, woodland depth, distant amber cottage and mint light. The native cap ring sits on the clear foreground of each composition. [Exact prompts and saved paths](assets/i4-garden-prompt.json)

| Profile | Preserved source | Runtime | Dimensions | Runtime bytes |
|---|---|---|---|---:|
| Wide | [PNG](../public/assets/garden/garden-moonrise-wide.png) | [WebP](../public/assets/garden/garden-moonrise-wide.webp) | 1672 × 941 | 2,324,142 |
| Portrait | [PNG](../public/assets/garden/garden-moonrise-tall.png) | [WebP](../public/assets/garden/garden-moonrise-tall.webp) | 941 × 1672 | 2,280,014 |

FFmpeg lossless export preserved every decoded pixel. The two WebP files save 1,979,303 bytes, about 30% of the combined source size. The table, chairs, cards, vine bed, flower and caps use SVG and CSS with live labels. [Pixel verification and hashes](evidence/i4-garden-exports.json) · [Asset provenance](ASSET_PROVENANCE.md)

## Verification

**`npm run check` passed TypeScript, all 125 unit tests in 14 files, the production build and all 108 browser checks.** The browser gate ran for 33.0 minutes with one worker and zero retries. It covered 54 desktop Chromium and 54 Pixel 7 emulation checks. [Validation record](evidence/i4-validation.json) · [Gate output](evidence/i4-check.log)

Eleven new unit cases check the opposite-seat display and unique card choices, all eight cap operations across 256 ring states, six garden viewport layouts and the packaged art files. Six new browser workflows run in each project. They exercise legal and rejected arrangements, partial confirmation and reload, shared vine geometry, interrupted strokes, keyboard operation after drawing, cap undo and recognition, four viewport configurations, large text and missing textures. The gate also covers complete journeys, audio, save conflicts, failed writes and renderer recovery.

Focused testing found a Windows filename collision between the card component and its model. Distinct filenames and a restart of the local preview cleared the stale import. The missing-texture test now loads an unfinished tower before checking CUT. The multi-reload studio test exceeded its original 30-second limit after the seal was visible. Its workflow budget is 60 seconds, and the restarted gate passed in both projects with all of its audio and persistence assertions. [Interrupted-run log](evidence/i4-preflight.log) · [Studio timeout context](evidence/i4-preflight-studio-context.md)

## Screenshots

Sixteen captures come from the passing gate. Four detail captures use isolated journeys imported through the same game UI. [Detail capture script](../scripts/capture-i4-details.mjs)

| Room | Idle world | Working object | Earned result |
|---|---|---|---|
| Tower | [Desktop](evidence/i4-tower-world-desktop.png) · [Phone](evidence/i4-tower-world-phone.png) | [Desktop](evidence/i4-tower-working-desktop.png) · [Phone](evidence/i4-tower-working-phone.png) | [Desktop](evidence/i4-tower-seal-desktop.png) · [Phone](evidence/i4-tower-seal-phone.png) |
| Greenhouse | [Desktop](evidence/i4-greenhouse-world-desktop.png) · [Phone](evidence/i4-greenhouse-world-phone.png) | [Desktop](evidence/i4-greenhouse-working-desktop.png) · [Phone](evidence/i4-greenhouse-working-phone.png) | [Desktop](evidence/i4-flower-detail-desktop.png) · [Phone](evidence/i4-flower-detail-phone.png) |
| Garden | [Desktop](evidence/i4-garden-world-desktop.png) · [Phone](evidence/i4-garden-world-phone.png) | [Desktop](evidence/i4-garden-working-desktop.png) · [Phone](evidence/i4-garden-working-phone.png) | [Desktop](evidence/i4-garden-lit-desktop.png) · [Phone](evidence/i4-garden-lit-phone.png) |

Completed vine signature. [Desktop](evidence/i4-greenhouse-signed-desktop.png) · [Phone](evidence/i4-greenhouse-signed-phone.png)

I5 covers the cottage return, the rug and door stitching, the borrowing desk, renewal and the receipt. I6 covers further portrait scenery, animation and mix review, 200% zoom, real-device measurements and Firefox/WebKit. [Immersive presentation plan](IMMERSIVE_PRESENTATION_PLAN.md)
