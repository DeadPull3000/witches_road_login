# Asset direction and production plan

Companion to the [implementation plan](../IMPLEMENTATION_PLAN.md). The seven supplied images are design references, not finished room layers or animation sheets. Dimensions below describe the originals; proposed runtime dimensions and palette are production decisions.

Presentation revision, 4 November 2026: the [immersive presentation plan](IMMERSIVE_PRESENTATION_PLAN.md) now governs full-viewport compositions, portrait variants, world-integrated controls and close-ups. Its guidance supersedes the fitted/letterboxed 640 × 360 output and separate detail-panel directions below. Keep the existing authoring coordinates and assets as the migration baseline, then add responsive room layouts and extended art.

[I1 is complete](IMMERSIVE_I1_REPORT.md): the cottage exterior has a portrait composition, lossless runtime exports and shared layout anchors for Agatha, the door, card and atmosphere. The [exact ImageGen prompt and saved source paths](assets/i1-portrait-prompt.json) record the new art. [I2](IMMERSIVE_I2_REPORT.md) reuses the existing show-inspired characters and paintings across one full-viewport world, with code-native map/notebook/folio materials. Direct room instruments, room-specific portrait compositions and final presentation review continue in I3–I6.

[I3's instrument pass](IMMERSIVE_I3_REPORT.md) adds the coven's chalk floor, glass measuring vessels, walnut/brass recording hardware and violet-lit lamp table as native SVG/CSS objects. The existing sprites and paintings supply their established show-inspired costumes and sets. Responsive foreground compositions keep the working targets readable and leave portrait character faces clear in the idle view. Further scenery variants, poses and the remaining instrument conversions continue in I4–I6.

## Reference mapping

| Reference | Original dimensions | Production use |
|---|---|---|
| [witch4.jpg](references/images/witch4.jpg) | 672 × 384 | Primary cottage composition: steep ivy roof, round upper window, amber entrance, chimney, coral dusk and mushroom foreground |
| [witch3.jpg](references/images/witch3.jpg) | 672 × 384 | Secondary cottage reference: tree silhouettes, blue shadows, layered forest and pink sky; retain the primary cottage architecture |
| [witch5.jpg](references/images/witch5.jpg) | 512 × 480 | Consistent shallow isometric interior staging, readable clusters of furniture, cauldron and potion props |
| [witch2.png](references/images/witch2.png) | 1404 × 1104 | Purple interior, warm floor, shelves, hanging herbs and rug motifs; recompose them in the common interior perspective |
| [witch.png](references/images/witch.png) | 315 × 250 | Moonlit garden paths, mint mushroom light and small magical accents; simplify clutter around working controls |
| [agatha.jpg](references/images/agatha.jpg) | 1080 × 1080 | Blue outfit, purple cloak, brown hair, clear character silhouette and ribbon magic; separate roaming sprite from portrait |
| [death.jpeg](references/images/death.jpeg) | 335 × 597 | Portrait framing, dark curls, emerald accents and red flower gesture; use separately authored sprite proportions |

The white backgrounds, incidental marks and title lettering in character references are not production elements. Record supplied files as `reference-only`, with creator/source provenance unspecified until known. Keep future editable sources and runtime exports linked through asset IDs.

## Shared visual system

Use side-view exteriors and one shallow isometric interior projection across rooms. Do not mix the bedroom reference's projection with the potion room's furniture angles in the same scene. Tie both exterior and interior views together through dark plum outlines, warm upper-left light, wooden materials, ivy, consistent character scale and restrained magical highlights.

The cottage stays recognizably the same building on return. Author the rug route and opening trial props from the start; the reveal changes what the player understands and the inspection text, rather than adding previously absent evidence. Lilia's close-up table is a separate interaction view with a nick and explicit seat markers. Rotate/recompose the art presentation while keeping all readable interface labels upright.

| Palette token | Starting swatch | Intended role |
|---|---|---|
| Deep plum | `#24172F` | Outlines and deepest shadows |
| Forest | `#173F3E` | Foliage, Rio accents and cool interiors |
| Wood | `#81502E` | Floor and furniture midtone |
| Amber | `#FFC46B` | Windows, candles and welcoming lights |
| Cloak purple | `#7448B8` | Agatha, magical fabric and room accents |
| Magic mint | `#79DAC7` | Garden glow and helpful state cues |
| Coral dusk | `#E58C88` | Exterior sky and warm reflected light |
| Paper | `#F1DEB9` | Cards, journal and interface surfaces |

These are proposed swatches, not exact samples or validated text-color pairs. Check contrast on the final interface. States also need labels, shapes or patterns: colored light alone cannot communicate a puzzle answer.

## Scale, layers and exports

| Asset kind | Proposed native size / convention |
|---|---|
| Scene composition | Shared 640 × 360 logical coordinates; fit and letterbox without distorting aspect ratio |
| Background/architecture layers | Typically 640 × 360 transparent or opaque layers; split very large empty regions where useful |
| Roaming characters | Begin around 48 × 80; common foot anchor and perceived height; magic effects use separate bounds |
| Portrait expressions | Begin around 96 × 128; consistent crop and eye line; independent of roaming sprite frames |
| Ordinary props | Typically 16–64 pixels across; anchor and logical footprint declared individually |
| Puzzle detail art | Separate composition within the detail panel; semantic controls and clue text remain DOM |
| Sprite frames | Native grid; consistent frame bounds; time in milliseconds; one final still for every important action |
| Runtime textures | PNG or measured lossless alternatives; JSON atlases with padding/edge extrusion; nearest sampling |
| UI type and ornament | Readable DOM font for instructions; pixel-style accent font only where legible; ornament does not contain required wording |

Use integer display scaling where it fits; constrained phones may need fractional scaling for the overview. The detail panel preserves usable puzzle controls. Pixel consistency and readability take precedence over preserving the reference files' differing resolutions.

Layer order: sky/distant forest → room shell/architecture → furniture → interactive props → characters → foreground → lighting/effects. Assign explicit layer IDs and prop occlusion rules; foreground foliage cannot hide an active clue. Hotspot position comes from the scene prop record, not a second handwritten coordinate set in React.

## Production bundles

| Bundle | Required art and detail views | Character / motion needs | Phase |
|---|---|---|---|
| Shared UI and effects | Ledger/map, borrowing card, notebook, dialogue frame, settings ornaments, focus/selection markers, seal symbols | Generic highlight, stamp, dialogue expressions | A/B |
| Cottage exterior and interior | Primary cottage layers, door/knocker, windows, chimney, trial props, bedroom rug, card desk, TV cabinet, recovery opening | Agatha idle/skeptical/theft, password pearls and purple ribbon; return smoke still | B/E |
| Coven threshold | Seat cutaway, token cards, affinity symbols, trapdoor | Token placement and opening response; Sharon gardening stamp | A/B |
| Garden | 8 numbered caps with lit/unlit/pattern states, ring layout, stone and rabbit hiding place | Toggle glow, recognition pose, rabbit relocate | B/F |
| Kitchen | Warm room, 3- and 5-cup vessels with readable silhouettes, work surface, liquid masks, oven/timer, mitt, pumpkin, cupboard | Pour/empty/fill, pumpkin gaze, mitt timer cue; Jen portrait/sprite | C |
| Studio | Record player, Track Four sleeve, mixer, printed lyric strips, phone, speaker cabinet | Dial/record responses, speaker doors, reverse-play flourish; Alice portrait/sprite | C |
| Cabin | Four labeled lamps, spirit board/planchette, window and optional shadow silhouettes | Lamp feedback, possession still, seven visitors; Agatha expressions | D/F |
| Tower | Room/table, five distinct tarot illustrations, CUT/QUARREL controls' ornaments, nick/seat markers, memory envelope | Card moves, opposite chair, two perspective compositions; Lilia portrait/sprite | D |
| Greenhouse | Five labeled stones, seven distinguishable vines/clauses, route overlays, bloom and earth/leaf props | Edge highlight, flower bloom, Rio flower offer; Rio portrait/sprite | E |
| Vision annex | Monochrome room, four station casings, four memory modules, maintenance slips, receipt/intercom frames | Subtle diagnostic response, mechanical flower; optional channel portraits | F |
| Library account / optional encounters | Account desk/ornaments, book and long receipt, noir drawer, TV/test/ad frames, rabbit glasses | Renewal receipt, final stamp, TV transitions, cosmetic rabbit | E/F |

Share furniture/material components and effects without making every room visually identical. The account is primarily a usable DOM interface; the book title, renewal state and receipt text must stay readable.

## Asset and prop metadata

An asset manifest record needs `assetId`, source reference IDs, provenance, production status, scene/bundle, layer, export path, width/height, native pixel scale, anchor, alpha, atlas membership, frame count, frame durations, terminal pose and reduced-motion still. Mark still assets explicitly; do not invent animation metadata where none exists.

A separate prop record owns `propId`, `assetId`, scene position, hotspot, accessible name, inspection description, availability, reading order and command. Asset art does not own game rules. Dialogue portrait IDs and expressions are separate from prop sprites.

Use stable IDs such as `cottage.door`, `agatha.theft`, `garden.cap.1` and `tower.card.moon`. Use predictable export names such as `cottage-door-idle.png` and `agatha-theft-atlas.json`; source IDs should survive an art replacement. Scene manifests reference IDs, and asset validation resolves them to content-versioned runtime URLs.

Maintain a production inventory with these states: planned → blockout → style-reviewed → exported → integrated → verified. The seven originals remain reference-only. A task is not finished at exported: verify its anchor, scale, hotspot alignment, alpha edges, frame timing and reduced-motion still inside the game.

## Animation and sound priorities

1. **State feedback:** vessel levels, lamp states, card moves, vine edges, cap toggles and available door.
2. **Opening identity:** dot theft, Agatha expressions, chimney smoke and window light.
3. **Trial rewards and return:** resolved studio motif, flower bloom, opposite-seat view, unbinding and renewal receipt.
4. **Atmosphere and optional catalogue:** fireflies, cauldron loops, window silhouettes, rabbit chain and TV flourishes.

Begin with a few clear frames and add in-betweens after the silhouette works at actual size. Keep idle/blink loops small, separate ribbon/smoke/glow effects from body sprites, and avoid full-scene video textures. Every important cue has a declared duration, terminal pose, Skip behavior and reduced-motion presentation. Use the source's initial timing ranges from the main plan, then tune through playtests.

Sound is required presentation. The inventory includes music/ambience throughout the Road, short prop responses, stamp/paper/door effects, three phase-aligned studio stems and original motifs/dialogue for catalogue encounters. Each record includes bus, loop points, caption and blocked-playback behavior. Entry verifies a running audio context, with bounded Retry and save export on failure. Players retain mute and volume controls; text or symbols preserve every clue.

## Review gates

| Gate | Review in actual game context before proceeding |
|---|---|
| Style proof | One cottage, one interior, Agatha scene/portrait scale and a tower detail panel agree in palette, light, outlines and density |
| Opening bundle | Alias card, door, theft and garden remain readable on desktop and portrait phone; optional glow does not obscure targets |
| Trial bundle | Required clues stay live text; controls fit detail panels; sprite state matches accepted rule state; no decorative occlusion |
| Animation batch | All frames have stable anchors; atlases do not bleed; Skip/reduced motion/refresh produce coherent final poses |
| Release art/audio | Every manifest reference exists; optional missing art has a still substitute; downloads, decoded texture memory and real-device frame rate are measured |

Original art and music production must be estimated from approved proofs and actual frame counts. The main plan's 18–26 focused engineering days assumes usable assets; it does not include a promise to create this entire inventory within that range.
