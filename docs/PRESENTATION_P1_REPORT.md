# Presentation P1 — Alice’s desk and room atmosphere

The supplied presentation brief calls for an Alice proof before applying the treatment to the other work surfaces. The studio’s before and after frames come from the local game at 1280 × 720. The proof uses the existing studio painting and show-inspired Alice sprite with new SVG hardware, paper and walnut styling, and a physical approach tag. [Room before](evidence/p1-studio-before-room.png) · [Room after](evidence/p1-studio-after-room.png) · [Workbench before](evidence/p1-studio-before-workbench.png) · [Workbench after](evidence/p1-studio-after-workbench.png)

The record, tonearm, analog meters, faders, taped lyric slips and cream telephone share one console. The small record follows the same geometry on its painted cabinet, and the room meters reflect the live mixer state. The three printed remainder clues and the telephone’s Dial control are visible together in the desktop proof. The compact desk uses one scrollable surface with Back and a reserved speaker position above or beside it. [Recording stage](../src/world/RecordingStage.tsx) · [Phone](evidence/p1-studio-phone.png) · [Short landscape](evidence/p1-studio-short-landscape.png)

One Alice sprite moves between the painted room and her solving anchor. The wide layout shows her full figure and moving contact shadow. Compact and portrait layouts crop the same sprite beside the workbench or into its upper speaker row. Resizing snaps the geometry, and reduced motion goes directly to the current anchor. One dismissible paper bubble can accompany opening, a request to speak, or a newly accepted dial action. The saved-state event determines the dial reaction. Required status text stays in the workbench’s feedback area. [Reaction](evidence/p1-studio-reaction.png) · [Native 200% zoom](evidence/p1-studio-native-zoom.png) · [Zoom result](evidence/p1-studio-zoom.json)

## Ambient motion

| Scene | Ambient details |
|---|---|
| Cottage clearing | Chimney smoke, amber fireflies, falling leaves and low wind |
| Cottage interior | Warm motes and hearth-colored sparkles |
| Coven threshold | Cellar dust and a low draft |
| Jen’s kitchen | Steam from the sink and teal glints |
| Alice’s studio | Amber lamp dust and glints |
| Agatha’s cabin | Candle wisps and violet sparkles |
| Lilia’s tower | Pale drifting flecks and a high draft |
| Rio’s greenhouse | Pollen, leaves and wind |
| Remember me garden | Mint fireflies and drifting leaves |
| Vision’s annex | Cool dust, restrained scan lines and glints |
| Library | Lamplight dust and paper flecks |

The existing world ticker draws the effects from a fixed pool with at most 40 pieces in a room. Particle paths are independent of puzzle state. The ticker stops in hidden tabs and reduced motion keeps a still composition. The layers share the current canvas and effect pixel budget. [Atmosphere definitions](../src/world/atmosphere.ts) · [World renderer](../src/world/renderer.ts)

Composited captures changed between samples in the cottage clearing and greenhouse. Each pair of reduced-motion captures matched pixel for pixel. [Cottage smoke](evidence/p1-atmosphere-cottage-clearing.png) · [Greenhouse atmosphere](evidence/p1-atmosphere-greenhouse.png) · [Frame comparison](evidence/p1-atmosphere-motion.json)

## Checks

TypeScript and 152 unit tests passed in the focused run. Eight new browser cases passed across desktop and phone-emulation Chromium. They cover the responsive desk, single sprite and canvas, close/reopen and resize with an undialed draft, a deliberately held save, rejection and completion reactions, reload and travel, all 11 atmosphere profiles, hidden tabs, reduced motion and still-art fallback. Native Chromium tab zoom reached 200% with the focused input, its draft and the Dial action intact.

The full check passed TypeScript, 152 unit tests, the production build and 138 Chromium browser cases. All nine production browser checks passed. The Windows WebKit check verified sound retry and save export when AudioContext was unavailable. Physical phone and Safari playback still need device testing. [Full regression log](evidence/p1-check.log) · [Production run](evidence/p1-production.log)

The compiled package contains 35 files and totals 41,584,321 bytes, an increase of 20,301 bytes from Phase G. All 22 fingerprinted artwork files matched the Phase G checksums.

On the same Windows host as Phase G, the updated opening drew 58.7 times per second in desktop Chrome and 29.5 in Pixel 7 emulation. The annex drew 58.3 and 29.5 respectively. The opening transferred 3.97 MB on desktop and 4.03 MB in phone emulation. [Chrome measurements](evidence/p1-production-chrome.json) · [Phone emulation measurements](evidence/p1-production-pixel.json)

The other trial surfaces, broader pose set, optional-room details and copy review are the next passes in the presentation brief.
