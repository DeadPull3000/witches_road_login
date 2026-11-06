# Presentation P2 — The required trial work surfaces

This pass applies the presentation brief to the coven threshold and the four remaining trial rooms. The small pieces in the room are projected with the painting’s camera. The workbench reuses their artwork and the existing puzzle commands. Small brass tags open the work surfaces. On wide screens the frame leaves space for each host’s existing full sprite. Narrow layouts use one scrolling surface with a fixed Back control. [Alice’s P1 proof and room atmosphere](PRESENTATION_P1_REPORT.md)

| Room | Room view and workbench | Reviewed frames |
|---|---|---|
| Coven threshold | Five stitched seats and the iron ring sit on a woven mat. The close-up has named keepsakes, the selected token, and the current seat occupants. | [Room](evidence/p2-threshold-room.png) · [Workbench](evidence/p2-threshold-desktop.png) |
| Jen’s kitchen | Two faceted glass jugs sit on the painted marble. The close-up adds a recipe card, brass tap and drain, capacity plates, and readings next to the Fill, Empty, and Pour tools. | [Room](evidence/p2-kitchen-room.png) · [Workbench](evidence/p2-kitchen-desktop.png) · [Phone](evidence/p2-kitchen-phone.png) |
| Agatha’s cabin | Four engraved lanterns and a wooden planchette sit on the painted table. The close-up groups the four unchanged statements under the lanterns. The flames and reflections follow the saved lamps. | [Room](evidence/p2-cabin-room.png) · [Workbench](evidence/p2-cabin-desktop.png) |
| Lilia’s tower | Five illustrated cards sit on the painted velvet. The close-up shows the brass nick and distinct chair emblems. The opposite seat starts with card backs and the original appointment slips are still readable from the fold. | [Room](evidence/p2-tower-room.png) · [First seat](evidence/p2-tower-desktop.png) · [Opposite seat](evidence/p2-tower-opposite.png) |
| Rio’s greenhouse | The five carved stones and seven vines sit on a shallow moss-edged bed. The raised crossing shares geometry with the stroke plane. Accepted edges are stitched, and the saved flower grows beside the bed. | [Room](evidence/p2-greenhouse-room.png) · [Workbench](evidence/p2-greenhouse-desktop.png) · [Phone](evidence/p2-greenhouse-phone.png) |

The five primary actions fit at 1280 × 720 in the initial workbench views. The opposite tarot seat also fits at that size. The extra geometry cases exercise 1440 × 900, short landscape, and narrow portrait, including keyboard focus returning to the small approach tag. At native 200% Chromium zoom, Rio’s close-up accepted a keyboard stone move, preserved the route, and returned focus to its tag when closed. [Native zoom result](evidence/p2-native-zoom.json)

The room art and workbench are drawn in SVG and CSS using the existing paintings and sprites. The compiled package occupies 41,597,463 bytes, 13,142 bytes more than P1. The 22 runtime WebPs match the baseline checksums. [Prop artwork](../src/world/TrialPropArt.tsx) · [Room projection](../src/world/TrialRoomProps.tsx) · [Vine plane](../src/ui/VineBedArt.tsx)

## Verification

`npm run check` passed TypeScript, 153 unit tests, the production build, and all 142 Chromium browser cases in 20.5 minutes with zero retries. The four new browser cases cover the five work surfaces on both profiles, keyboard focus and viewport changes, the shared saved visuals, both tarot seats, the stitched vine path, and a reload with the bloom already saved. Preflight corrected a test that pressed the next tarot key before its preceding save cleared. It now checks each accepted card order before pressing the next key. The full run also exercised the existing pointer and keyboard journeys, optional discoveries, audio start and retry, and renderer and storage recovery. [Full regression log](evidence/p2-check.log)

All nine production cases passed. The opening measured 58.7 draws per second on the Windows desktop GPU and 29.4 in Pixel 7 emulation, compared with 58.7 and 29.5 in P1. The opening transferred 3.97 MB and 4.03 MB respectively. Firefox completed the keyboard journey with reduced motion. Windows WebKit verified retry and save export when AudioContext was unavailable. [Production run](evidence/p2-production.log) · [Desktop metrics](evidence/p2-production-chrome.json) · [Phone emulation metrics](evidence/p2-production-pixel.json)

The next pass covers the other character docks and reactions, the garden and optional encounters, and the cottage and borrowing desk. Physical phone and Safari playback remain device checks.
