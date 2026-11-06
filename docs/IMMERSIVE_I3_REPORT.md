# I3 — coven and instrument rooms

Completed 4 November 2026. The final regression gate passed.

The threshold, kitchen, studio and cabin now have working object close-ups in the full-viewport world. The coven's keepsakes sit around a chalk floor circle; Jen's vessels stand on pale marble; Alice's faders, record, cabinets and telephone form a walnut recording desk; Agatha's lamps and spirit slips share a violet-lit séance table. Closing a close-up reveals a smaller, stateful object in its room. Its labelled approach action brings the same working surface forward again.

## Working objects

| Room | Delivered interaction |
|---|---|
| Coven threshold | Select a named keepsake, then a labelled floor seat. Moving an already seated token clears its old seat through the existing command. A selected token can be lifted back out. All five specialties remain printed; Sharon's leaf stamp remains inspectable. The central wooden trapdoor submits the match, and opens the existing kitchen exit only after acceptance. |
| Jen's kitchen | Select the 3- or 5-cup vessel. Tap, drain and pour tools belong to that source. Graduations, liquid and native quantity readouts show accepted volumes. No-op operations and sealed puzzles are disabled. The oven owns its active-play clock and mitt; the pumpkin follows accepted pouring history. Undo/reset remain available before completion. |
| Alice's studio | Three two-position mixer switches carry the printed remainder strips. The record changes direction; cabinet doors change the saved playback state. The brass telephone accepts the two-digit recording number. Its draft survives closing, the object page, menus and resizing; submitted attempts survive reload. Channel switches and playback remain usable after the seal, as the existing rules allow. |
| Agatha's cabin | Four labelled brass lamps operate directly on the table. All four statements remain printed on spirit slips; taller views keep the lamp row in reach while the table scrolls. Short landscapes use ordinary scrolling so the planchette stays reachable. The planchette submits Check. A failed check retains the lamps; undo/reset preserve the existing rules, and the accepted seal protects completed lamps. |

Every required action uses native buttons or an input, with keyboard and tap operation. Selection is presentation state; puzzle changes still travel through the serialized `GameSession` commands. Audio remains required at entry, and the original score, channel synchronization, mute and bus-volume controls continue through the App-owned engine. Hints, suggested moves and answer boards remain removed.

## Geometry, motion and recovery

`src/world/instruments.ts` declares the four instrument identities, viewport frames, five floor-seat positions and the shared vessel rectangles. The vessel SVG, transparent native selection targets and pour stream consume the same coordinate plane. Vessels scale uniformly. Wide layouts put the source tools beside the glass; phones place them below it. Short landscapes lift approach plaques above the traveller's kit. Portrait idle objects leave the character's face clear.

`InstrumentStage` keeps the working component mounted through closing and object-page visits. The close button and Escape restore focus to the originating object or its approach action. Shared menus retain their modal keyboard boundaries. Only the close-up's interior scrolls; the scenery, renderer and document stay fixed. Large text, keyboard-sized viewports and reduced motion continue through the shared shell.

The four old `PuzzlePanel` branches and their separate Pixi working drawings were removed. Idle previews are noninteractive drawings of accepted state; the approached surface is the working puzzle. The object page supplies the existing inspect/playback/lamp commands and a labelled return to the relevant instrument. It does not introduce another working puzzle. Feedback, export/save recovery and renderer retry occupy the active surface once, with no duplicate hidden feedback node.

Liquid updates follow the accepted snapshot. A short pour cue is derived only from a newly accepted transfer in the same run and room, with its actual transferred amount. Loading, importing, rejected moves and another tab's winning save cannot start it. Reduced motion, visibility changes and leaving the room resolve it to the accepted quantities. CSS record, meter and flame motion pauses while hidden and respects reduced motion. The cabin shadow uses Agatha's current world anchor in portrait and landscape views.

Renderer failure still leaves native SVG objects and semantic controls usable. The Pixi application, resource leases and audio engine retain the I2 lifecycle. Save schema, content version, pure puzzle rules and rewards are unchanged; animation never awards progress.

## Verification

The final **`npm run check` passed TypeScript, all 114 unit tests in 13 files, the production build and all 96 browser checks**: 48 desktop Chromium and 48 portrait-phone Chromium emulation checks. The browser gate took 24.5 minutes with one worker and zero retries. No checks were skipped or marked expected-to-fail. Existing puzzle/save/audio assertions remain; helpers now perform the physical token and source-vessel selections. [Validation record](evidence/i3-validation.json) · [Gate output](evidence/i3-check.log).

Ten new unit cases cover six viewport geometries, minimum vessel targets, the four-room boundary, unique seat anchors, legal source operations at every bounded jug quantity, actual accepted transfer amounts and cue replay guards. The existing domain/save/audio suites remain in the gate.

Six new browser workflows run on both desktop Chromium and portrait-phone Chromium emulation. They exercise token relocation and reload, wrong-match gating, vessel projection/source selection, disabled no-op/sealed operations, interrupted motion, telephone draft retention, saved mixer/playback state, keyboard lamps, all printed spirit statements, failure without reward, eight room/size combinations, single renderer/audio context, one feedback surface and deliberately held save completion. Existing routes now place physical tokens and select source vessels. The full-route time budget is 90 seconds to include those additional player actions; ordinary instrument workflows retain the 30-second limit, and the multi-room reframing workflow uses 90 seconds. Retries remain disabled.

Browser and visual review corrected decorative text changing jug action names, oversized wide-screen vessels, short-screen approach placement, idle objects covering portrait character faces and split kit labels. The phone token tray and spirit slips were recomposed for readability. Target measurements are batched per room to avoid unnecessary browser round trips while keeping every size assertion.

The legacy studio audio workflow exposed a real menu-dismissal race: the native dialog could disappear before its asynchronous close event cleared the world's `inert` state. A fast telephone fill was then lost and native required-field validation prevented submission. Close and Escape now dismiss through the same React update that reactivates the world. A regression checks reactivation after the dismissal microtask, immediate input after Close/Escape and retained draft text.

The oven regression captures the countdown when Settings has opened and checks that 80 simulated seconds leave that exact value unchanged. Clicking the kit remains active play; its real duration is not assumed to be zero. The test still checks the initial 40 seconds, the first 20 seconds of active time and expiry after resuming, so opening the menu cannot restart or advance the timer.

## Reviewed evidence

Twenty captures from the final passing gate are retained below. The telephone detail uses a 390 × 640 viewport with large text in both test projects; the mixer captures show each project's initial desktop or phone layout.

| Room | Working desktop | Working phone | Idle desktop | Idle phone |
|---|---|---|---|---|
| Coven | [Floor circle](evidence/i3-coven-desktop.png) | [Floor circle](evidence/i3-coven-phone.png) | [Cellar](evidence/i3-threshold-world-desktop.png) | [Cellar](evidence/i3-threshold-world-phone.png) |
| Kitchen | [Accepted pour](evidence/i3-kitchen-pour-desktop.png) | [Accepted pour](evidence/i3-kitchen-pour-phone.png) | [Kitchen](evidence/i3-kitchen-world-desktop.png) | [Kitchen](evidence/i3-kitchen-world-phone.png) |
| Studio | [Mixer](evidence/i3-studio-mixer-desktop.png) | [Mixer](evidence/i3-studio-mixer-phone.png) | [Studio](evidence/i3-studio-world-desktop.png) | [Studio](evidence/i3-studio-world-phone.png) |
| Cabin | [Lamp table](evidence/i3-cabin-desktop.png) | [Lamp table](evidence/i3-cabin-phone.png) | [Cabin](evidence/i3-cabin-world-desktop.png) | [Cabin](evidence/i3-cabin-world-phone.png) |

Additional evidence: [telephone desktop test at phone size](evidence/i3-studio-telephone-desktop.png), [telephone phone with large text](evidence/i3-studio-telephone-phone.png), [kitchen seal desktop](evidence/i3-kitchen-seal-desktop.png), [kitchen seal phone](evidence/i3-kitchen-seal-phone.png).

## Art and remaining scope

The existing show-inspired character sprites and room paintings provide the visual setting. The new interactive props are authored SVG/CSS with live text. Their stone, pale marble, walnut/brass and plum-cloth materials follow the established [show design interpretation](SHOW_DESIGN_REFERENCE.md). These are the game's puzzle instruments. No raster assets, ImageGen prompts or dependencies were added; [asset provenance](ASSET_PROVENANCE.md) records that reuse.

I4 is next for Lilia's card table, Rio's vine bed and the garden caps. I5 covers the cottage return and borrowing desk. Existing landscape paintings still provide the covered backgrounds in these four rooms; foreground instruments and characters now have responsive compositions, while further portrait scenery, drawn poses, final animation/mix work and 200% browser-zoom/accessibility review remain in I6/release work. Phone emulation does not establish real-device audio, frame rate or memory results, and Firefox/WebKit remain pending. No deployment or remote repository changes were made.
