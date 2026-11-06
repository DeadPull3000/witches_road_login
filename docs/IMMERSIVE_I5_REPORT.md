# I5 — cottage return and borrowing desk

Completed 5 November 2026.

The cottage return and the library use the same approach and close-up pattern as the seven trial rooms. The arrival card carries the fictional alias and attempted spell. Later interactions have their own physical objects.

| Place | Working interaction |
|---|---|
| Cottage interior | The rug opens from its floor marker or the room objects page. The first and return visits share the same painting, prop positions and five embroidered motifs. The return caption describes what the player recognizes. The discovery appears in the notebook. |
| Cottage door | The door carries the borrowing nameplate, earned seals, marked stitches and brass knocker. Drawing or the native unbind button sends the existing command. The knocker uses the same sign-in rule from the close-up or the room. A remembered borrower gets the recognition mark and Continue to library after first sign-in. |
| Library | The ledger, book, renewal stamp and brass return slot share a walnut counter. Accepted renewal feeds paper into the tray. The stamp becomes a read action that focuses and scrolls to the receipt. Sign-out is on the exit plaque, which is also reachable from the desk header. |

## Layout and input

The approach plaques use the same projection as the scenery. When an essential prop is cropped, its plaque stays at the nearest usable edge above the traveller's kit. The rug fits its contents up to the close-up's available height. The desk and receipt scroll internally. Closing returns keyboard focus to the original control or the object's approach plaque. The room objects page can return to the rug, door or desk.

The stitch and vine bed share the geometry cancellation helpers. A draft ends on resize, scroll, viewport or transform changes, menu entry, visibility changes, capture loss or saved-state changes. A valid release includes its final point. Both forms of unbinding use the serialized save path. Keyboard users can focus the knocker and queue sign-in while unbinding saves.

Accepted state drives the finished stitch, the recognition plate and the receipt. The receipt is readable while its decorative paper strip moves, and Skip sits away from the working controls. The required sound entrance precedes play. The game shares one renderer and audio context across locations. [Immersive presentation plan](IMMERSIVE_PRESENTATION_PLAN.md)

The cottage and library use the existing painted scenes and established Agatha sprite. The timber, brass, seals and paper use SVG and CSS with live labels. [Asset provenance](ASSET_PROVENANCE.md) · [Show design reference](SHOW_DESIGN_REFERENCE.md)

## Verification

**`npm run check` passed TypeScript, 131 unit tests in 15 files, the production build, and all 116 browser checks.** The 26.8-minute browser gate covered 58 desktop Chromium checks and 58 Pixel 7 emulation checks with one worker and zero retries. Twelve focused browser checks also passed before the full gate. [Validation record](evidence/i5-validation.json) · [Gate output](evidence/i5-check.log)

Six new unit cases check shared cottage geometry, the painted door projection and four viewport sizes. Four new browser workflows run in each project. They check rug identity and focus, interrupted and valid stitching, held writes for unbinding and renewal, receipt reading and re-entry, and large-text controls with missing textures. The full gate includes the first and remembered journeys, existing saves, required audio and renderer recovery.

Focused testing found Agatha's transparent inspection target intercepting the desktop door plaque. The plaque now has priority over the sprite target. Testing also found a short-screen retry notice covering the knocker and a cottage-view button behind a phone close-up. The retry notice and view control now occupy their own spaces. Both fallback layouts pass through actual clicks on the knocker, retry action and library exit.

## Screenshots

All sixteen captures come from the passing browser gate.

| View | Desktop | Phone |
|---|---|---|
| Cottage interior | [Desktop](evidence/i5-cottage-idle-desktop.png) | [Phone](evidence/i5-cottage-idle-phone.png) |
| Rug on first visit | [Desktop](evidence/i5-rug-first-desktop.png) | [Phone](evidence/i5-rug-first-phone.png) |
| Rug on return | [Desktop](evidence/i5-rug-return-desktop.png) | [Phone](evidence/i5-rug-return-phone.png) |
| Bound door | [Desktop](evidence/i5-door-bound-desktop.png) | [Phone](evidence/i5-door-bound-phone.png) |
| Stitched door and knocker | [Desktop](evidence/i5-door-ready-desktop.png) | [Phone](evidence/i5-door-ready-phone.png) |
| Library in the room | [Desktop](evidence/i5-library-idle-desktop.png) | [Phone](evidence/i5-library-idle-phone.png) |
| Ledger and renewal stamp | [Desktop](evidence/i5-desk-working-desktop.png) | [Phone](evidence/i5-desk-working-phone.png) |
| Renewal receipt | [Desktop](evidence/i5-receipt-desktop.png) | [Phone](evidence/i5-receipt-phone.png) |

I6 covers the whole game presentation review, further responsive artwork, 200% zoom, physical-device measurements and browser coverage beyond Chromium. [Immersive presentation plan](IMMERSIVE_PRESENTATION_PLAN.md)
