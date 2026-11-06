# Immersive I6 — whole-game presentation

The cottage interior and after-hours library have dedicated portrait paintings. The cottage's writing desk, rug and knocker sit over their painted locations. In the library, the ledger and brass return slot lead to the same working borrowing desk. The other trial interiors use camera centers chosen for three aspect ranges. For example, the narrow threshold holds the violet passage in view and the studio frames Alice’s recording equipment. [Scene framing](../src/world/layout.ts) · [Asset prompts and provenance](ASSET_PROVENANCE.md#immersive-i6-portrait-interiors-and-runtime-exports)

The cottage props and embroidery are part of the still layer, with Agatha in front of the floor detail. This preserves those objects during renderer recovery. The browser composites the paintings and existing show-inspired sprites at display resolution. The shared Pixi canvas draws only the animated light, mist, fireflies and action effects, with a 500,000-pixel target for its framebuffer. Scene changes retire decoded image leases after the latest destination finishes loading. The retained frame measurements count presented draw calls and sampled intervals. The image-byte estimates use decoded width × height × 4 and cover the active lease only. [Renderer](../src/world/renderer.ts) · [Cottage details](../src/scenes/CottageDetails.tsx)

The thirteen previously used PNG inputs total 31.83 MB. Their runtime WebP equivalents total 21.88 MB, a 31.3% reduction. The two new portrait WebPs total 4.28 MB. All fifteen source and runtime pairs match in dimensions and visible decoded RGBA pixels. Vite's public copy includes the original art, so the transfer savings apply to the images the game requests during play. [Decoded pixel comparisons](evidence/i6-export-verification.json)

## Controls and sound

- Room objects places the existing instructions, lyric strips, spirit statements and tarot memories before the live actions in reading order. The writing desk gathers its six inspections on phones where individual 44-pixel targets would overlap. An accepted action keeps its control focused through saving, and Escape returns to the control that opened the page. [Shared room instructions](../src/world/RoomRules.tsx)
- Focused text stays in view when the browser's visual viewport shrinks. A native Chromium 200% page-zoom check changed the CSS viewport from 1280 × 800 to 640 × 400 and the DPR from 1 to 2. The existing focused field retained and accepted the 24-character alias. The test used a disposable Chromium context and a loopback-only test extension. [Zoom evidence](evidence/i6-zoom-validation.json) · [Playwright extension setup](https://playwright.dev/docs/chrome-extensions) · [Chrome tab zoom API](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-setZoom)
- The score fades out across the next room's shared stem start time. Studio mix and mood changes install one synchronized bank in the existing context. A hidden tab suspends audio and stops new draws. Entry requires playing audio, with mute and independent volume controls available after entry. [Audio engine](../src/audio/engine.ts)

## Browser coverage

The final `npm run check` passed TypeScript, **136 unit tests in 15 files**, the production build and **122 Chromium browser checks**. The browser run covered 61 desktop and 61 Pixel 7 emulation cases in 16.5 minutes with one worker and zero retries. The full journey passed with a pointer, with a keyboard, with WebGL unavailable and with the room images unavailable. The new tests cover focus through saved actions, portrait prop access, a simulated keyboard-sized visual viewport and hidden-tab audio and rendering. [Full gate log](evidence/i6-check.log) · [I6 browser scenarios](../tests/e2e/immersiveI6.spec.ts)

The supplemental checks run against the local Vite preview with `node scripts/verify-immersive-i6.mjs`. The Chromium and Firefox runs verified a nonzero Web Audio output signal, exactly one audio context, and accepted library renewal. The Windows WebKit build exposed no `AudioContext`. Its actual launch verified the required-audio gate, visible Retry, and a downloaded journey export. [Chromium evidence](evidence/i6-chromium-validation.json) · [Firefox evidence](evidence/i6-firefox-validation.json) · [WebKit evidence](evidence/i6-webkit-validation.json)

Phone and keyboard layouts use browser emulation. The Windows WebKit result covers the required-audio failure path. Playback and frame cadence on physical phones and Safari are release checks.

## Rendering measurements

Playwright Chromium 156.0.8078.4 ran headless on the Windows host with an Intel Core Ultra 5 125H. WebGL reported ANGLE with SwiftShader. The following 2.5-second samples describe that software renderer. A wider display or different renderer can produce different results. [Rendering samples and travel records](evidence/i6-rendering-validation.json)

| View | Effects framebuffer | Draws per second | 95th percentile draw interval |
|---|---|---:|---:|
| Desktop idle, 1280 × 800 | 894 × 559 | 59.2 | 16.8 ms |
| Desktop borrowing card, 1280 × 800 | 894 × 559 | 29.7 | 33.4 ms |
| Desktop settings, 1280 × 800 | 894 × 559 | 16.2 | 83.3 ms |
| Tablet-sized, 1024 × 768 | 816 × 612 | 59.1 | 16.8 ms |
| Desktop, 2560 × 1440 | 943 × 530 | 42.7 | 33.4 ms |
| Ultrawide, 2560 × 1080 | 1089 × 459 | 54.7 | 33.3 ms |
| Short landscape, 844 × 390 | 844 × 390 | 59.0 | 16.8 ms |
| Phone idle, 390 × 844 | 481 × 1040 | 29.8 | 33.4 ms |
| Cottage interior, 390 × 844 | 481 × 1040 | 29.4 | 33.4 ms |
| Cottage interior, 360 × 640 | 530 × 943 | 29.8 | 33.4 ms |
| Reduced motion | 894 × 559 | 0 | — |

The initial run drew 25.2 frames per second with the desktop borrowing card open and 12.3 in Settings. The final samples reached 29.7 and 16.2 in the same views. The largest viewport and the Settings backdrop remained slower than the standard idle view. Phase G retains the hardware performance check. [Initial rendering samples](evidence/i6-baseline.json)

Two circuits across eight Road destinations retained one canvas. After each of the 16 arrivals, the image pool held one or two active leases, with no retiring images. The two-image lease represents about 12.6 MB of decoded RGBA. Browser caches, compositing allocations and total process memory are outside that estimate. [Travel measurements](evidence/i6-rendering-validation.json)

## Screenshots

- [Portrait cottage interior](evidence/i6-cottage-portrait.png) and [portrait library](evidence/i6-library-portrait.png)
- [Desktop field notes](evidence/i6-cabin-field-notes-desktop.png) and [phone field notes](evidence/i6-cabin-field-notes-phone.png)
- [Desktop renewal in Chromium](evidence/i6-chromium-library.png), [desktop renewal in Firefox](evidence/i6-firefox-library.png) and [phone receipt](evidence/i6-phone-library-receipt.png)
- [Native 200% page zoom](evidence/i6-native-200-percent-zoom.png), [simulated keyboard viewport](evidence/i6-phone-visual-viewport.png) and [WebKit required-audio recovery](evidence/i6-webkit-required-audio-recovery.png)

Phase F covers the optional Vision annex and remaining catalogue interactions.
