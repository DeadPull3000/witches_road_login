# Phase G — Release verification

The release files are in [dist](../dist/). The entry document and content-fingerprinted JavaScript, CSS and WebP assets work from a static host root or subdirectory. Vite emits the 22 runtime WebPs from the existing artwork and resolves the same URLs for the scenery, sprite, portrait and renderer recovery. Original PNGs are preserved with the project sources. [Build configuration](../vite.config.ts) · [Build inventory and checksums](evidence/phase-g-build-inventory.json)

The production directory fell from 99.90 MB to 41.56 MB. Every fingerprinted WebP matches its runtime source bytes. A fresh temporary directory installed the lockfile with `npm ci --offline` on Node 20.14.0 and npm 10.7.0. Its build matched all 35 release files byte for byte. The npm registry audit reported zero vulnerabilities for the pinned dependencies. [Clean build log](evidence/phase-g-clean-build.log) · [npm audit result](evidence/phase-g-npm-audit.json)

## Regression checks

The full `npm run check` passed TypeScript, 145 unit tests, the production build and 130 browser cases before the final image cleanup. After that change, TypeScript, all 145 unit tests and the production build passed again. The focused retest passed all 54 browser cases in 7.2 minutes with zero retries. It covered both Chromium profiles through the complete journey, room and menu transitions, Vision and other encounters, saved progress, missing textures, canvas loss and GPU recovery. [Full regression log](evidence/phase-g-check.log) · [Final build log](evidence/phase-g-final-build.log) · [Focused retest](evidence/phase-g-renderer-retest.log)

## Production browser checks

| Browser | Verification |
|---|---|
| Installed Chrome on Windows | Fresh story through renewal, reload during confirmation, remembered return, and the full story with every image request blocked. Stale-tab conflict handling, quota failure with JSON export, and corrupt-save checkpoint recovery passed. |
| Firefox on Windows | All required actions completed by keyboard with reduced motion, including the reload and renewal. Focus returned to Settings when the dialog closed. |
| Windows WebKit with an iPhone viewport | The illustration rendered. This WebKit build exposed no AudioContext. The game held the required sound gate and offered audio retry and a working JSON export. |

The final `npm run test:release` passed all nine cases with one worker and zero retries. Preflight corrected the performance harness to step back from the auto-open cottage door and use the painted return door's accessible label. [Production run log](evidence/phase-g-production.log) · [WebKit result](evidence/phase-g-webkit-result.json)

## Performance and audio

The measurements used a Windows system with an Intel Core Ultra 5 125H. Installed Chrome 156.0.8078.81 used the Intel Arc GPU through ANGLE Direct3D 11. The Pixel 7 profile used bundled Chromium 156.0.8078.4 and SwiftShader on the same host. Frame rates count draws during 2.3-second samples. Transfer totals come from a fresh local browser session and include the page and resources requested through the sound gate.

| Measurement | Desktop Chrome, 1280 × 720 | Pixel 7 emulation, 412 × 839 |
|---|---:|---:|
| Opening transfer | 3.96 MB | 4.02 MB |
| Cottage draws per second | 58.5 | 29.5 |
| Annex draws per second | 58.3 | 29.8 |
| Cottage / annex 95th percentile draw interval | 16.9 / 17.3 ms | 33.4 / 33.4 ms |
| Sound-entry action to playing indicator | 748 ms | 1,324 ms |
| Renew action to saved feedback | 157 ms | 222 ms |

The opening requested exactly the matching cottage painting and the Agatha sprite, and both profiles met the 5 MB target. The tower and greenhouse each transferred about 3.37 MB of art on first visit. The other first visits in the circuit were at or below 2.97 MB, and later circuits reused the cached artwork. Room travel measurements include opening the map, writing the save and waiting for the artwork to be ready. [Desktop metrics](evidence/phase-g-chrome-metrics.json) · [Phone emulation metrics](evidence/phase-g-pixel-metrics.json)

Each profile retained one canvas through 24 room changes. The renderer settled to one or two active image leases with zero retiring images. The maximum active decoded RGBA estimate was 12.58 MB. That estimate covers the active artwork, while the browser's post-collection JavaScript heap sample ended at 9.21 MB on desktop and 9.19 MB in phone emulation. Full browser and GPU memory depend on the device.

An untraced six-circuit check exposed a Chromium retention issue in the preloader. Clearing the source of a released offscreen image left a detached node behind. The renderer now drops the reference and lets the browser collect it. In the same six circuits, the browser's DOM node counter rose from 454 to 874 before the fix and stayed at 358 after it. The corrected run retained two detached images with sources for the currently leased artwork. Both compiled Chromium profiles check for released preloads after repeated travel. [Renderer cleanup](../src/world/renderer.ts) · [Before](evidence/phase-g-memory-followup.json) · [After](evidence/phase-g-memory-after.json)

Both profiles measured a signal at the master output in the cottage and annex. Mute took the measured peak to zero and unmute restored playback. Each profile created one AudioContext after the explicit gesture. These are browser output measurements. Playback through Safari and physical phone touch, audio and memory measurements remain open because the Windows host had no attached test phone. [Desktop annex](evidence/phase-g-chrome-annex.png) · [Desktop receipt](evidence/phase-g-chrome-receipt.png) · [Phone annex](evidence/phase-g-pixel-annex.png) · [Phone receipt](evidence/phase-g-pixel-receipt.png) · [WebKit recovery](evidence/phase-g-webkit-recovery.png)

## Build and run

```powershell
npm ci
npm run build
npm run preview
```

Serve the contents of `dist/` over HTTP. Revalidate `index.html` and cache the fingerprinted `assets/` with a long immutable lifetime. Serve the directory URL with a trailing slash when hosting under a subdirectory. The game uses internal room state for navigation.

The preview runs on a separate origin from the development server on port 5187. Saves and the discovery collection use IndexedDB on the current browser origin. Use **Export this journey** in Settings and import the JSON at the new address to move a journey between origins or browsers. Start the score with **Enter the Road with sound**. The alias and attempted spell belong to the fictional library.

## Re-run the checks

With Chrome installed, install the browser binaries for the remaining test projects. Run the development regression first, then the production matrix.

```powershell
npx playwright install chromium firefox webkit
npm run check
npm run test:release
```

The production matrix serves the compiled build at `/release/witches-road/` on local port 5188. It exercises the required journey, the still-art route, save recovery, and the compiled renderer and sound. [Production test configuration](../playwright.release.config.ts)
