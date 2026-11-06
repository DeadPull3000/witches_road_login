# Generated asset provenance

Generation method: built-in `image_gen` tool, 4 November 2026. The CLI/API fallback was not used. Both selected outputs were copied into this repository; their generated originals remain in the Codex generated-images folder. User-supplied references were used as design guidance, and the show costume/set direction is recorded in [SHOW_DESIGN_REFERENCE.md](SHOW_DESIGN_REFERENCE.md).

| Runtime asset | Dimensions | Format / transparency | Source output |
|---|---|---|---|
| [Agatha Road sprite](../public/assets/cottage/agatha-road.png) | 1024 × 1536 | PNG RGBA, real alpha; inspected corner alpha 0 | `exec-659d6574-415c-4a5f-a12f-e6dfa93ca0cc.png` |
| [Cottage at dusk](../public/assets/cottage/cottage-dusk.png) | 1672 × 941 | Opaque PNG | `exec-f3864eff-e222-400e-9247-997070ed475f.png` |

The character is a single pose, with procedural idle motion and a separate pearl animation in the scene. It is not a completed multi-expression animation sheet. Additional poses and room illustrations remain part of the subsequent art passes. Pixi assets are separately loaded, reference-counted and released on scene disposal; HTML stills and semantic controls remain available when rendering fails.

Original PNGs total 5,591,863 bytes. These are the first art proofs. Runtime export/compression still needs to bring the complete first-interaction download within the approximately 5 MB release target; decoded texture use and real-device performance also remain Phase G measurements.

## Final prompt — Agatha

```text
Use case: stylized-concept. Asset type: single transparent pixel-art character sprite for a cozy browser puzzle adventure inspired by Agatha All Along. Subject: Agatha Harkness, recognizable Kathryn Hahn character translated into charming detailed 16-bit pixel art, full body, three-quarter view facing slightly left, wavy shoulder-length dark brown hair, raised sardonic eyebrow, tailored long navy/teal blue travel coat cinched at the waist over a white collared shirt with a small antique cameo brooch, vivid violet lining visible along the coat hems, dark blue trousers and ankle boots. One hand rests on her hip, the other palm holds three tiny violet magical pearls. Keep the Road costume silhouette recognizable and practical, no pointed hat. Crisp chunky pixel clusters, deep plum outlines, warm amber rim light from upper left, subtly mint shadow light. Full character fills most of frame with comfortable alpha margin; feet entirely visible. Genuinely transparent background, no ground or cast shadow, no text, no labels, no white backdrop, no watermark. One standalone sprite, no sprite sheet or grid. The existing user reference established blue clothes and purple magic; preserve that relationship.
```

Tool option: `transparent_background: true`.

## Final prompt — cottage

```text
Use case: stylized-concept. Asset type: landscape pixel-art background for an illustrated browser adventure, 16:9 wide composition. Primary request: a cozy forest cottage at the entrance to The Witches' Road, inspired by the show's tangible practical woodland set with knotted roots, twisting bare branches, violet fog, scattered glowing mushrooms and deep layers of foliage. A small ivy-covered slate-roof cottage sits on the left half, warm amber circular upper window, arched front door clearly visible near horizontal 40 percent and vertical 65 percent; a thin wisp of chimney smoke. Winding stone path runs from the cottage toward the lower right foreground. Open low foreground on right for a separate character sprite. Sunset coral at the horizon beneath a deep purple evening sky, tiny first stars, lush mint/blue magical glows near the roots. Detailed but coherent 16-bit pixel art, crisp pixel clusters, plum outlines, warm wood and mossy stone, cinematic warm-left lighting, enchanting and mildly uncanny rather than scary. Frame with tall twisting trees and ferns at the edges. Keep the center and path uncluttered so object hotspots remain visible. Scenery only, no characters, no interface, no lettering, no logos, no labels, no watermark. The final asset must be a complete wide background painting, not a game screenshot, concept collage or sprite sheet.
```

Tool option: `transparent_background: false`.

## Phase C additions

Generated with the built-in `image_gen` tool on 4 November 2026. The [complete prompt set](PHASE_C_ASSET_PROMPTS.json) includes each saved workspace path and its transparency option. Generated originals were retained.

| Runtime asset | Dimensions | Transparency | Bytes |
|---|---|---|---|
| [Jen sprite](../public/assets/kitchen/jen-road.png) | 1024 × 1536 | RGBA; corner alpha 0 | 2,067,595 |
| [Tide kitchen](../public/assets/kitchen/kitchen-tide.png) | 1672 × 941 | Opaque | 2,267,721 |
| [Alice sprite](../public/assets/studio/alice-road.png) | 1024 × 1536 | RGBA; corner alpha 0 | 1,907,859 |
| [Amber studio](../public/assets/studio/studio-amber.png) | 1672 × 941 | Opaque | 2,667,962 |

Jen's pink Road-inspired silhouette and Alice's dark jacket/red-streaked hair complement the supplied pixel-art medium. The kitchen adapts the beach-mansion trial and the studio adapts the retro recording-room design; these are game interpretations. Measuring vessels, liquid, pumpkin, mitt, record response, meters and speaker overlays are separate procedural scene objects. Character reactions currently combine the single-pose sprites, small motion, reward glints and dialogue/captions; these are not completed frame-by-frame character sheets.

Each room loads only its own image bundle. A shared resource pool serializes unloading and re-acquisition so revisits do not receive destroyed textures. PNG optimization and real-device texture-memory measurements remain release work.

Audio is an original, deterministic eight-beat score synthesized in Web Audio, with three equal-length six-second stems, a separate ambience bus and short interaction tones. No show soundtrack or recorded dialogue is included. All stem buffers are prepared before a common scheduled start time. Playback uses the scheduling and looping behavior documented by [MDN AudioBufferSourceNode.start](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/start) and [loop](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/loop); gesture recovery uses [AudioContext.resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume).

## Phase D additions

Generated with **built-in ImageGen**, 4 November 2026. The [complete final prompt set](PHASE_D_ASSET_PROMPTS.json) records each absolute workspace path, source output and transparency option. Generated originals remain in the Codex generated-images folder.

| Runtime asset | Dimensions | Transparency | Bytes |
|---|---|---|---|
| [Séance cabin](../public/assets/cabin/cabin-violet.png) | 1672 × 941 | Opaque PNG | 2,710,799 |
| [Divination tower](../public/assets/tower/tower-divination.png) | 1672 × 941 | Opaque PNG | 3,083,118 |
| [Lilia Road sprite](../public/assets/tower/lilia-road.png) | 1024 × 1536 | PNG RGBA; sampled corner/edge alpha 0 | 1,991,309 |

The cabin reuses the existing Agatha Road sprite. Lilia's mustard dress, blue sleeves, indigo wrap, layered pendants and silver-blonde hair follow the show costume direction. The two interiors translate the cabin and divination-trial motifs into readable game compositions; they are original game adaptations. The [design brief](SHOW_DESIGN_REFERENCE.md) distinguishes primary references from the game's additions. Lilia remains a single full-body pose with procedural idle motion and captions; additional drawn expressions and animation sheets remain production work.

Four lamp states, a shadow, the planchette, flat card backs, envelope and reward glints are separate scene graphics. The enlarged tarot interface uses code-native SVG symbols with distinct Cup/Moon/Tower/Key/Door silhouettes. Its fixed table-edge nick and chair labels express the seat change; card labels remain upright and confirmation never automatically displays the reversed answer.

Required audio now covers the whole route: Road, studio, cabin, tower and earth/garden moods have distinct original note sequences. The music, ambience and effect buses retain independent levels and master mute. A successful explicit audio start opens play; browser failures have a five-second timeout, retry and save-export path. No show recordings, soundtrack or voice recordings are used. Raw room PNGs still need export optimization and real-device measurements in Phase G.

## Phase E additions

Generated on 4 November 2026 with **built-in ImageGen**. The [final prompt set](PHASE_E_ASSET_PROMPTS.json) records all absolute workspace paths, source outputs, prompts and transparency options. Generated originals were retained.

| Runtime asset | Dimensions | Transparency | Bytes |
|---|---|---|---|
| [Rio Road sprite](../public/assets/greenhouse/rio-road.png) | 1024 × 1536 | PNG RGBA; sampled corner/edge alpha 0 | 1,980,642 |
| [Earth greenhouse](../public/assets/greenhouse/greenhouse-earth.png) | 1672 × 941 | Opaque PNG | 3,074,480 |
| [Cottage room](../public/assets/cottage/cottage-room.png) | 1672 × 941 | Opaque PNG | 2,616,529 |
| [After-hours library](../public/assets/library/library-afterhours.png) | 1672 × 941 | Opaque PNG | 2,598,416 |
| [Coven cellar](../public/assets/threshold/coven-cellar.png) | 1672 × 941 | Opaque PNG | 2,851,031 |

Rio's long dark hair, green eye makeup, botanical leaf layers and red flower follow the supplied `death.jpeg` portrait and the show's Green Witch identity. The greenhouse is a game-specific botanical extension. The cottage bedroom/study and public library are fictional game locations. The coven cellar translates the show's stone-basement/woodland-threshold motifs. [Design interpretation and primary references](SHOW_DESIGN_REFERENCE.md)

The cottage uses the same room background, prop positions and embroidery on both visits; completion changes descriptions and recognition. Small props, rug motifs, threshold seats, greenhouse graph/stone states, flower bloom, thread and receipt are code-native graphics layered over the generated art. The enlarged graph, rug, rune stitching and receipt emblems use SVG interface illustrations for readable controls. The greenhouse's bridged crossing is decorative and never a graph node.

The character sprites remain single full-body poses with procedural motion and caption reactions. Phase E adds an original library musical mood plus bloom, unbinding and receipt tones. Each tone's envelope follows its own scheduled start. No downloaded soundtrack or recorded dialogue is included.

New source PNGs total **13,121,098 bytes** before runtime export optimization. Only the active scene bundle is requested, with shared Agatha textures reference-counted. Compression, decoded-memory/frame-rate measurements, real-phone audio and Firefox/WebKit review remain Phase G work.

## Immersive I1 additions

The cottage exterior now has a **940 × 1672 portrait composition**, generated with built-in ImageGen from the inspected existing cottage. It preserves the fictional game's architecture and supplied cottage-reference palette. Agatha continues to use her existing show-inspired Road design. The [exact prompt/source record](assets/i1-portrait-prompt.json) and [I1 implementation report](IMMERSIVE_I1_REPORT.md) list the saved source, runtime paths and generation/encoding methods.

| File | Dimensions | Bytes |
|---|---|---|
| [Preserved portrait source](../public/assets/cottage/cottage-dusk-portrait.png) | 940 × 1672 | 3,518,407 |
| [Landscape runtime WebP](../public/assets/world/cottage-dusk.webp) | 1672 × 941 | 2,656,808 |
| [Portrait runtime WebP](../public/assets/world/cottage-dusk-portrait.webp) | 940 × 1672 | 2,714,694 |
| [Agatha runtime WebP with alpha](../public/assets/world/agatha-road.webp) | 1024 × 1536 | 1,000,794 |

The WebP files are lossless FFmpeg production exports; original PNGs remain. [Pixel verification](evidence/i1-export-verification.json) confirms every visible RGBA pixel is unchanged. The active painting plus Agatha totals 3.66 MB in landscape or 3.72 MB in portrait, approximately one-third less than the matching source pairs. The other painting loads only when a composition change needs it. The traveller's kit icons and paper/control materials are code-native interface elements. Fireflies, window light, mist and action cues are separate graphics using the world layout; no required text is baked into generated scenery.

## Immersive I2 interface and reuse

I2 reuses the existing generated paintings and show-inspired character sprites. No raster artwork was generated or edited. The folded map trail, current-location pins, earned-seal emblems, notebook spreads, borrowing-card folio, wooden exit plaques and brass/plum kit use code-native SVG/CSS and live semantic text. Existing [Road emblems](../src/ui/RoadEmblem.tsx) connect the map, cottage embroidery and renewal receipt.

The shared renderer loads the active room bundle and releases its previous lease after replacement; obsolete results are discarded and released when they settle. Its DOM still and character layers use the same world layout as the renderer and object targets. Existing landscape paintings provide full-viewport scenery while room-specific portrait art and direct instrument compositions are refined in I3–I5. [I2 implementation, evidence and limits](IMMERSIVE_I2_REPORT.md)

## Immersive I3 working objects

The coven circle, measuring counter, recording desk and spirit table are authored SVG/CSS in [InstrumentStage](../src/world/InstrumentStage.tsx), [instrument geometry](../src/world/instruments.ts) and [material styling](../src/world/instruments.css). Their labels and puzzle statements are live text, and their native targets use the same instrument plane as the drawings. Idle previews reflect the accepted run; the working controls appear when the player approaches.

Materials follow the existing art: chalk and basement stone, pale marble and glass, walnut/brass recording hardware, and plum cloth with brass lamps and spirit slips. Existing Agatha, Jen and Alice sprites retain their recorded show-inspired costumes. The floor seats, marked vessels, logical lamps and telephone puzzle are game-specific instruments composed for those rooms. Their new motion uses accepted quantities, saved channel/record state and accepted lamp states.

No raster artwork was generated or edited, no image-generation prompt was used, and no dependency was added for I3. Existing paintings are uniformly covered behind responsive foreground objects and independently framed characters. Further portrait scenery and drawn poses remain in the presentation/release plan. [I3 implementation, screenshots and verification](IMMERSIVE_I3_REPORT.md)

## Immersive I4 garden and working trials

Two separate built-in ImageGen calls produced original wide and portrait moonlit garden paintings. Both use the user's garden reference and the established cottage palette: twisting roots, violet woodland depth, pond, winding path, distant amber cottage and mint light. The portrait is an authored composition. The native eight-cap puzzle is rendered separately, so the paintings do not contain a second puzzle ring. This is an original game garden inspired by the Road's visual language.

- Sources: `public/assets/garden/garden-moonrise-wide.png` (1672 × 941) and `public/assets/garden/garden-moonrise-tall.png` (941 × 1672).
- Runtime: matching `.webp` files in the same folder, 2,324,142 and 2,280,014 bytes. FFmpeg lossless export preserved every decoded visible pixel, with no crop or resize; combined savings are 1,979,303 bytes, about 30%.
- [Exact prompts, generation method, reference roles and generated/workspace paths](assets/i4-garden-prompt.json); [decoded-pixel verification and hashes](evidence/i4-garden-exports.json).

Lilia and Rio retain their existing show-inspired sprites and documented costumes. The two chairs, wood/felt table, card symbols, vine bed/stones, red flower and mushroom caps are code-native SVG/CSS with live labels. Their geometry and accepted-state previews belong to the same instrument as their native controls. No new dependency was required. [I4 implementation and evidence](IMMERSIVE_I4_REPORT.md).

## Immersive I5 cottage and library props

Both cottage visits share the original cottage-room painting and its prop positions. The library uses the existing after-hours painting. The embroidery, stitched door, brass knocker, renewal stamp and receipt use SVG and CSS with live labels. Their wood, cloth, brass and paper draw on the room palettes and Agatha's established look. [I5 implementation and screenshots](IMMERSIVE_I5_REPORT.md) · [Show design reference](SHOW_DESIGN_REFERENCE.md)

## Immersive I6 portrait interiors and runtime exports

Two built-in ImageGen calls composed portrait views of the existing game interiors. The cottage keeps its round twilight window, six-object writing table, arched door and burgundy rug in one composition. The library places the green lamp, curved lunar-carved desk and brass return slot together. Both inherit the ivy, amber practical light, plum shadows and pixel texture of the wide paintings. The existing wide paintings were the visual references. [Prompts and source files](assets/i6-interior-prompts.json)

| Room | Source | Runtime |
|---|---|---|
| Cottage interior, 981 × 1602 | [PNG](../public/assets/cottage/cottage-room-portrait.png) | [WebP](../public/assets/cottage/cottage-room-portrait.webp) |
| After-hours library, 941 × 1672 | [PNG](../public/assets/library/library-afterhours-portrait.png) | [WebP](../public/assets/library/library-afterhours-portrait.webp) |

The portrait coordinates place live controls over the painted landmarks. The desk props and embroidered motifs use the same drawings on both cottage visits. The trials use room-specific camera centers at three aspect ranges. Their existing Agatha, Jen, Alice, Lilia and Rio sprites use lossless runtime exports. [Scene framing and anchors](../src/world/layout.ts) · [Show references](SHOW_DESIGN_REFERENCE.md)

FFmpeg exported the fourteen I6 painting and sprite files to lossless WebP. The fifteen verification pairs include the earlier Agatha export now shared by the interior scenes. Every source and runtime file matched in dimensions and visible RGBA pixels. [Verification](evidence/i6-export-verification.json)

## Phase F Vision and optional props

Built-in ImageGen produced two compositions of the monochrome diagnostic room and a pale Vision sprite. The wood panelling, lace curtains, domestic fireplace and mid-century television silhouettes carry the black-and-white Westview sitcom treatment into the repair annex. Vision’s angular face, pale segmented suit, cape and forehead circuitry draw on Phil Saunders’s production concept. The four-reader workshop, its controls and its paperwork belong to the game. [Marvel’s production feature](https://www.marvel.com/amp/articles/tv-shows/behind-the-scenes-wandavision-featurette-story) · [Production concept](https://philsaunders.artstation.com/projects/Qry5RB) · [Exact prompts](assets/phase-f-vision-prompts.json)

| Asset | Dimensions | Source | Runtime |
|---|---|---|---|
| Diagnostic annex, landscape | 1672 × 941 | [PNG](../public/assets/vision/vision-annex-wide.png) | [WebP](../public/assets/vision/vision-annex-wide.webp) |
| Diagnostic annex, portrait | 941 × 1672 | [PNG](../public/assets/vision/vision-annex-portrait.png) | [WebP](../public/assets/vision/vision-annex-portrait.webp) |
| Pale Vision | 1024 × 1536 | [RGBA PNG](../public/assets/vision/vision-pale.png) | [Alpha WebP](../public/assets/vision/vision-pale.webp) |

The television cabinet, ad and test card, evidence drawer, recast frame, window silhouettes, rabbit, stamp and mechanical flower use native SVG and CSS. Their captions and controls use live text. The annex has an original synthesized score played by the shared audio engine. [Encounter art](../src/world/EncounterStage.tsx) · [Bench and flower](../src/world/VisionConsole.tsx) · [Pixel verification](evidence/phase-f-export-verification.json)
