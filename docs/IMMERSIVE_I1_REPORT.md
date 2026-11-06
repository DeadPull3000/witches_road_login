# I1 — full-viewport cottage proof

Completed 4 November 2026. The final regression gate passed.

This is the historical I1 checkpoint. See the [I2 shared world interface report](IMMERSIVE_I2_REPORT.md) for subsequent map/travel, all-room renderer and shared-surface work.

The cottage clearing now fills the browser content viewport. Its scenery, Agatha sprite, light, fireflies, mist and action cues share a resizing Pixi world. The fitted scene, website header, ledger, audio banner, separate puzzle section and footer are absent from this view. The required sound-entry gesture opens over the clearing.

The borrowing card is a physical paper surface opened from a card on the path. It carries the existing native alias/spell forms and commands. Closing it restores focus to its originating object; Escape works, text survives closing and resizing, and only the paper scrolls. The spell remains transient and is cleared on submission. The theft uses a measured input anchor and Agatha's projected position, rather than the old fixed scene coordinates. A small leather/plum traveller's kit holds labelled notebook, object-page, journey, settings and sound controls. These are the cottage proof of the shared interface; I2 will complete its map/travel behavior and adoption across locations.

## Geometry and lifecycle

- `src/world/layout.ts` owns uniform cover projection, its inverse, the portrait/landscape camera, physical prop bounds and CSS-pixel hit areas. Portrait art is selected below an aspect ratio of 1.1; intermediate tablet views use that composition with a wider clearing.
- Pixi sprites and native buttons consume those same rectangles. The door stays aligned to the painted door, and essential hit areas remain at least 44 CSS pixels. Artwork is never stretched independently along an axis.
- `WorldCottage` follows the visual viewport, including resize, orientation and keyboard-height changes. Its renderer stays mounted through reframing, card/menu visits and preference changes. The audio engine remains owned by `App`.
- Only the active painting and Agatha download on entry. An alternate painting loads when its composition is first needed and stays leased for subsequent rotations. Hidden tabs and reduced motion stop the animation ticker; accepted state changes can still render a still frame. Framebuffers are bounded to two million pixels, with density capped at 1.5.
- Missing art, unavailable WebGL, context loss and thrown GPU draw calls retain native controls and saved progress. Retry recreates only the renderer. Cleanup retains the existing protection against clearing Pixi's global pools.

## Art and runtime exports

The established Agatha sprite retains her show-inspired navy/violet Road outfit, dark hair and pendant. The cottage is the documented fictional game location, rather than a claim to reproduce a show set. A new vertical composition preserves its roof, warm round window, arched entrance, ivy, dusk forest and mushrooms.

The portrait was made with **built-in ImageGen**, using the inspected existing cottage as the edit reference. The exact prompt, generated source and project paths are in [the prompt record](assets/i1-portrait-prompt.json). The generated original remains at `C:/Users/User/.codex/generated_images/01a1a452-4f1c-7172-ba1e-78ffa4504b70/exec-63939ed5-5c51-4e64-bdda-e4a795a8b97d.png`.

All files below are inside `C:/Users/User/Desktop/Projects (Coding)/The Witches' Road/`:

| File | Purpose | Dimensions | Bytes |
|---|---|---|---|
| [public/assets/cottage/cottage-dusk-portrait.png](../public/assets/cottage/cottage-dusk-portrait.png) | Preserved ImageGen portrait source | 940 × 1672 | 3,518,407 |
| [public/assets/world/cottage-dusk.webp](../public/assets/world/cottage-dusk.webp) | Landscape runtime painting | 1672 × 941 | 2,656,808 |
| [public/assets/world/cottage-dusk-portrait.webp](../public/assets/world/cottage-dusk-portrait.webp) | Portrait runtime painting | 940 × 1672 | 2,714,694 |
| [public/assets/world/agatha-road.webp](../public/assets/world/agatha-road.webp) | Existing sprite, runtime export with alpha | 1024 × 1536 | 1,000,794 |

The three WebP files are lossless production encodings made with FFmpeg, not replacement artwork. All source PNGs remain. [Decoded export verification](evidence/i1-export-verification.json) compared every visible RGBA pixel; only RGB beneath fully transparent pixels is ignored. Run it again with `node scripts/verify-world-exports.mjs` on a machine with FFmpeg available.

Initial art is **3,657,602 bytes** in landscape and **3,715,488 bytes** in portrait: about **34.6% and 32.8% smaller** than the matching source-PNG pairs. The two active textures contain about 12 MiB of decoded RGBA pixels; visiting both compositions adds another roughly 6 MiB, before framebuffer/driver/browser costs. These are asset arithmetic, not a measurement of total device memory. No audio files are downloaded for the original synthesized score.

## Verification and scope

Final **`npm run check` passed** TypeScript, all **88 unit/state/persistence/audio/asset tests**, the production build and all **72 browser checks** (36 desktop Chromium and 36 phone-emulation Chromium), with one worker and zero retries. The final browser suite completed in 13.1 minutes. No assertions were skipped, marked expected-to-fail or relaxed. The independent decoded-pixel export verification also passed for all three runtime assets.

New coverage checks uniform painting coverage and door alignment at 360 × 640, 390 × 844, 844 × 390, 768 × 1024, 1024 × 768, 1280 × 800, 1920 × 1080 and 2560 × 1080. Browser resizing keeps the original canvas instance, bounds its physical pixels, preserves a typed alias, and leaves the document unscrolled. Other cases cover a keyboard-sized visual viewport, persistent spell text through menus, a single audio context, reduced-motion ticker stopping, focus restoration and theft cancellation.

The regression work caught two presentation defects before completion: Skip left a delayed card-opening callback, and disabling the entire card during persistence could drop a quick keyboard action. Skip now clears its timer. Card controls remain focusable while the existing game-session queue serializes commands. A deliberately delayed IndexedDB completion test verifies unbinding followed immediately by sign-in, without weakening progression guards or waiting for an animation.

Reviewed evidence: [desktop clearing](evidence/i1-cottage-desktop.png), [portrait clearing](evidence/i1-cottage-portrait.png), [phone emulation](evidence/i1-cottage-phone.png), [portrait borrowing card](evidence/i1-borrowing-card-portrait.png). The portrait garden sign stays above the caption/kit area. These are browser screenshots; actual phone/browser-device verification remains below.

The preceding combined run passed 71 of 72 browser cases, with a desktop two-tab wall-clock timeout, slow context teardown and a truncated trace archive. Continuous filmstrip recording of the animated viewport was removed from test tracing; action/network/DOM traces, source snapshots, explicit visual evidence and failure screenshots remain. Assertions, the existing time limits, one worker and zero retries are retained. The two-tab cases then passed in 16.2 seconds on desktop and 15.2 seconds on phone in the final, fully passing run. This is a test-recording change, not a claim to have measured real-device game performance.

I1 converts the **cottage exterior proof**. Its interior and other rooms retain the previous working presentation during migration. A single world application across every room, the folded Road map, final room-specific controls/close-ups and richer character poses belong to I2–I5. I6 and the final release review retain real-device audio/frame-rate/memory measurements and Firefox/WebKit coverage. No new dependencies, authentication service, remote repository change or hosting deployment were needed.
