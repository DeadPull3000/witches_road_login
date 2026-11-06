# I2 — shared world interface

Completed 4 November 2026. The final regression gate passed.

This is the historical I2 checkpoint. See [I3's coven and instrument report](IMMERSIVE_I3_REPORT.md) for the subsequent physical-room interactions.

Every location now uses the full-viewport world and the same traveller's kit. The permanent website header, journey ledger, separate audio banner, footer and document-length puzzle layout have been removed from the application shell. Required sound entry opens over the current scenery, including when a journey resumes in a room beyond the cottage.

## Shared surfaces and travel

- A folded Road map shows all nine locations, the current place, locked paths and the five accepted seals. Native buttons follow the existing `canEnter` policy. The library remains gated by the cottage knocker and the existing sign-in rules.
- Ready exits appear as labelled wooden doorway plaques. Their commands come from the existing completion/unbinding state; viewing the map, closing a menu or finishing an animation never grants progress.
- The notebook opens as two paper pages for journey notes and discoveries. The journeys folio uses stamped borrowing cards, with story/showcase mode, seal count and a current-card mark. Card buttons describe their mode/progress for assistive technology.
- Settings, four audio levels, mute, motion/text choices, import/export and retained recovery exports use the shared paper surface. The saved action-list preference now selects the room-object page on arrival. The complete object page remains available in every room.
- Modal menus bound Tab and Shift+Tab, support Escape and restore focus. Travel or a successful import returns focus to the arriving room surface. Background controls become inert while a menu is open. Closing menus preserves the typed alias or spell.
- The borrowing card and room notes remain mounted when closed. Covered props become inert. Feedback, unsaved/export controls and renderer recovery move into an opened surface so they stay readable without covering its close button. Only surfaces scroll; the world does not scroll the document.

## Persistent rendering and accepted state

`WorldGame` is mounted once. A single Pixi application survives room travel, cottage view changes, new/resumed/imported journeys, menus and resizing. `App` retains the audio engine for the visit. A browser reload or explicit renderer recovery creates a new application as expected.

The former scene renderer's drawing functions now form a shared graphics layer. Existing vessels, mixer/record, lamps, cards, graph, cottage embroidery and receipt continue to reflect accepted state. The active painting and character are leased through a generation-guarded resource switch. A slow obsolete destination cannot replace the current room; its lease is released when it settles. The previous active bundle is released after replacement installation, and disposal releases pending results. Requests can finish in the shared asset loader after they become obsolete; this is cancellation of their installation rather than a claim that every network request is aborted.

Both the artwork and semantic targets use the world layout. Raster art scales uniformly. Cropped legacy props do not receive misleading on-screen hit areas: their complete actions remain on the room-object page. Character layers are independently framed. Portrait room compositions and final direct instrument/prop layouts are part of I3–I5.

Framebuffers retain the approximately two-million-pixel budget and density cap of 1.5. Portrait views and scenes behind opened surfaces cap animation at 30 frames per second; unobscured landscape views cap at 45. Reduced motion and hidden tabs stop the ticker, while accepted state can still draw a still frame. These are configured budgets, not measured real-device frame rates.

The harmless oven timer waits for successful sound entry and pauses while shared menus are open, preserving its remaining active-play time. A stable command callback prevents display updates from restarting it. Loading another tab's winning save clears transient local action commands, so foreign progress does not replay an old local animation or action sound. Save formats and puzzle rules are unchanged.

## Verification

The final **`npm run check` passed TypeScript, all 104 unit tests in 12 files, the production build and all 84 browser checks**: 42 desktop Chromium and 42 portrait-phone Chromium emulation checks. The browser gate took 20.9 minutes with one worker and zero retries. No checks were skipped, marked expected-to-fail or weakened. Existing puzzle, save and audio assertions remain; navigation helpers and dialog selectors now follow the shared interface. [Validation record](evidence/i2-validation.json) · [Gate output](evidence/i2-check.log).

New unit coverage checks map access at every checkpoint, guarded exits, unchanged state when deriving navigation, uniform room coverage, cropped-prop behavior, lease replacement/disposal, stale successes and failures, installation failure and cue guards. A persistence case verifies that conflict recovery clears an older local cue command while retaining the unsaved branch export.

New browser cases check the map's locked/current locations and keyboard loop; card text through menus; saved progress/preferences through new and resumed slots; one canvas and one audio context through all locations; guarded library entry; an intentionally delayed obsolete room load; sound/menu-paused active-play time; saved-card listing recovery; oversized imports; file-read failure and retrying the same file. Existing room tests now use the map and object-page workflows with their original puzzle/save/audio assertions.

Testing caught an unbounded modal focus boundary, a large-text phone style that moved feedback over an object-page action, and a renderer-recovery banner that covered the phone card's close button. The explicit focus loop and surface-scoped feedback/recovery placement correct those defects. A covered card prop is now inert; inspecting Agatha directly opens its paper surface. Existing tests were updated to assert that behavior. The context-loss regression also verifies travel while using the still view and a renderer retry without losing a garden move. Timer tests wait for the menu-close event to commit before advancing simulated active-play time.

Reviewed browser evidence: [map desktop](evidence/i2-map-desktop.png), [map phone](evidence/i2-map-phone.png), [notebook desktop](evidence/i2-notebook-desktop.png), [notebook phone](evidence/i2-notebook-phone.png), [saved-card folio desktop](evidence/i2-saved-cards-desktop.png), [saved-card folio phone](evidence/i2-saved-cards-phone.png), [settings desktop](evidence/i2-settings-desktop.png), [settings phone with large text](evidence/i2-settings-phone.png), [kitchen world desktop](evidence/i2-kitchen-world-desktop.png), [kitchen world phone](evidence/i2-kitchen-world-phone.png).

## Art, scope and remaining work

No new raster assets or dependencies were needed. Map trails, seals and material surfaces use code-native SVG/CSS and the existing Road emblems. Existing Agatha, Jen, Alice, Lilia and Rio sprites retain their recorded show-inspired designs. The [asset provenance](ASSET_PROVENANCE.md) distinguishes those references from the fictional game locations.

I2 completes the shared interface and renderer migration. Room puzzles currently open on readable notes/card surfaces over their full-screen scenery. I3 moves the coven tokens, jugs, studio equipment and lamps onto their instruments; I4 handles the tarot/graph/garden, and I5 finishes the cottage return and library desk. Those passes also refine room-specific framing and portrait art. I6 and the release review retain real-device audio/performance/memory, zoom/accessibility and Firefox/WebKit verification. No deployment or remote repository changes were made.
