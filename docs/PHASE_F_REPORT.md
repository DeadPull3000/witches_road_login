# Phase F — Vision and discoveries

The cottage television opens Vision’s diagnostic annex after Alice’s studio. The optional room has four working readers, the original borrowing receipt, the printed identity policy and the four dated maintenance records. A chosen reader stays selected through reload. The verified transfer table appears after the library accepts a reader, and the reward is a pale mechanical flower at the borrowing desk. The return door leads back to the same cottage television. [Reader bench](../src/world/VisionConsole.tsx) · [Transfer logic](../src/content/vision.ts)

The annex has separate landscape and portrait paintings. Its monochrome Westview materials and pale Vision sprite draw on the show’s black-and-white sitcom production and Phil Saunders’s character concept. The original synthesized annex score fades in through the game’s shared audio context. The existing sound entry, mute and independent volume controls cover the annex as well. [Marvel production feature](https://www.marvel.com/amp/articles/tv-shows/behind-the-scenes-wandavision-featurette-story) · [Production concept](https://philsaunders.artstation.com/projects/Qry5RB) · [Artwork and saved prompts](ASSET_PROVENANCE.md#phase-f-vision-and-optional-props)

## Optional encounters

- The television plays a replayable sponsor spot, a skippable test card and the library sign-off. Its apparent volume dial changes its own captions. The player’s large-text setting takes precedence.
- The cottage case drawer retrieves the current slot’s stamped alias. The covered card reveals the same alias after the tower. A later portrait inspection changes the picture. The solved cabin has a single animated pass of seven visitors with a still and caption for later readings.
- The rabbit travels from the garden stone to the kitchen cupboard and the open studio speaker cabinet. Each location checks the previous discovery in the same journey. The third discovery unlocks the cottage portrait with the clerk’s spectacles across browser-local slots.
- The borrowing desk carries the date stamp and an explicit **Expire session** control. Expiry places Rio’s red flower at the cottage. **Resume library session** uses the normal knocker and returns to the same borrowing record. The final TV slip requires renewal and turning off the powered set.

The sign-in gate uses the five seals and cottage unbinding. Vision, the rabbit, the television and the other optional encounters record independently. The notebook shows named clippings for found entries and anonymous blanks for the rest. Each recorded award has one stable ID, and the repository saves the run and the shared device collection in one transaction. Version-one saves load with fresh defaults for the new optional fields. [Catalogue and replay rules](DISCOVERY_BACKLOG.csv) · [Save transaction](../src/persistence/repository.ts)

## Verification

TypeScript, all 145 unit tests in 16 files and the production build passed. The rules suite earned all 34 discovery IDs through accepted gameplay commands. It checks the unique reader solution, repeat behavior, the sign-in gate, legacy save defaults and IndexedDB persistence.

The full Chromium run passed 124 of 130 cases in 20.4 minutes with one worker and zero retries. Three older scenarios still looked for raw discovery IDs as visible notebook text on both profiles. The assertions now check the named clippings, and all six passed on retest. Across both runs all 65 desktop and all 65 Pixel 7 emulation cases passed. [Full regression log](evidence/phase-f-check.log) · [Notebook retest](evidence/phase-f-notebook-retest.log)

The eight new browser cases passed in the full run. They cover keyboard selection, rejection and reload, return to the television, phone rotation, rabbit and portrait persistence across slots, TV captions, expiry and resume, and completion with missing art and reduced motion. A Firefox 157 smoke test loaded the annex, measured a nonzero audio signal from one audio context, rejected an incorrect selection, accepted the identity and returned to the television without page errors. [Firefox measurements](evidence/phase-f-firefox-validation.json)

Decoded comparisons confirmed identical visible pixels in the three lossless WebP exports, which total 4.27 MB compared with 7.44 MB for the source PNGs. Only the matching annex painting and sprite load together. Physical phone and Safari playback, hardware performance, and final release checks belong to Phase G. [Export verification](evidence/phase-f-export-verification.json)

## Screenshots

- Desktop views of the [annex](evidence/phase-f-vision-annex-desktop.png), [reader bench](evidence/phase-f-vision-records-desktop.png) and [cottage television](evidence/phase-f-tv-desktop.png).
- Phone emulation of the [annex](evidence/phase-f-vision-annex-phone.png), [reader bench](evidence/phase-f-vision-records-phone.png), [flower](evidence/phase-f-vision-reward-phone.png) and [art recovery](evidence/phase-f-fallback-phone.png).
- Phone emulation of the [cabin visitors](evidence/phase-f-cabin-visitors-phone.png), [case drawer](evidence/phase-f-case-drawer-phone.png), [notebook clippings](evidence/phase-f-notebook-phone.png) and [television stamp](evidence/phase-f-tv-stamp-phone.png).
