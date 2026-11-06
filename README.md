# The Witches' Road

A cozy pixel-art browser puzzle game in which a cottage and a magical road become an elaborate login for the fictional Westview Public Library.

## Project documents

- [Implementation plan](IMPLEMENTATION_PLAN.md): player journey, rules, application architecture, delivery tasks, and acceptance checks.
- [Immersive presentation plan](docs/IMMERSIVE_PRESENTATION_PLAN.md): the requested full-viewport scenery, in-world controls, responsive camera, migration passes and validation gates.
- [I1 cottage implementation](docs/IMMERSIVE_I1_REPORT.md): full-screen exterior, portrait art, shared object projection, runtime exports and verification.
- [I2 shared world interface](docs/IMMERSIVE_I2_REPORT.md): folded map, notebook, saved-card folio, shared settings/recovery and one renderer across locations.
- [I3 coven and instruments](docs/IMMERSIVE_I3_REPORT.md): working floor seats, measuring vessels, recording desk and spirit lamps, with responsive close-ups and accepted-state motion.
- The card table, vine bed and remembering ring, with responsive garden art and regression results. [I4 report](docs/IMMERSIVE_I4_REPORT.md)
- The cottage rug, door and knocker, and the borrowing desk with its renewal stamp and receipt. [I5 report](docs/IMMERSIVE_I5_REPORT.md)
- The portrait cottage and library, room framing, field notes and score transitions. [I6 report](docs/IMMERSIVE_I6_REPORT.md)
- Vision's annex, television encounters and the 34-entry notebook. [Phase F report](docs/PHASE_F_REPORT.md)
- Alice’s redesigned recording desk, responsive character placement, and ambient motion in every room. [Presentation P1 report](docs/PRESENTATION_P1_REPORT.md)
- The coven mat, measuring counter, spirit table, tarot spread, and vine bed in the room and in close-up. [Presentation P2 report](docs/PRESENTATION_P2_REPORT.md)
- [Asset direction](docs/ASSET_DIRECTION.md): visual system, reference mapping, scene assets, and animation production.
- [Discovery backlog](docs/DISCOVERY_BACKLOG.csv): all 34 supplied interactions, with delivery phase and progression role.
- [Supplied reference material](docs/references/README.md): original planning documents and seven design references.
- [Phase reports](docs/PHASES.md): implementation progress, checks performed and remaining work.
- [Show design reference](docs/SHOW_DESIGN_REFERENCE.md): costume and location direction for the sprite/art production.
- [Phase C asset prompts](docs/PHASE_C_ASSET_PROMPTS.json): saved art paths and the complete built-in ImageGen prompts.
- [Phase D asset prompts](docs/PHASE_D_ASSET_PROMPTS.json): cabin, divination tower and Lilia sprite, with final prompts and saved paths.
- [Phase E asset prompts](docs/PHASE_E_ASSET_PROMPTS.json): Rio, greenhouse, cottage interior, library and threshold, with exact prompts and saved paths.
- [Generated asset provenance](docs/ASSET_PROVENANCE.md): saved asset paths, prompts and generation method.

## Run locally

Node 20.14 or a compatible newer release is required. The project pins Vite 6 for compatibility with the installed Node 20.14 runtime.

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5187/` and select **Enter the Road with sound** to start the room audio. Use a fictional alias and attempted spell. Progress is saved in this browser; export it from Settings before clearing browser data. Story and showcase journeys use separate slots.

Each of the five required trials starts a five-minute countdown on entry. The deadline continues through menus, side trips, and reloads. A timeout returns you to the opening cottage and resets the current journey. Your stamped alias, discovery collection, settings, and other saved journeys carry over.

Click the brass-edged plaque by an object to use it or open its close-up. Trial instructions live on labelled notes. The **Room objects** page also lists the objective and its available actions.

## Checks and production build

```powershell
npx playwright install chromium
npm run check
```

`npm run check` runs TypeScript checking, the rule/save/scene unit suite, a production build and desktop/mobile Chromium journeys. Individual commands are `npm test`, `npm run test:e2e` and `npm run build`. Production files are written to `dist/`.

The complete required route has illustrated scenes, including the coven threshold, Rio's greenhouse, cottage interior and library account. Draw the vine signature or use adjacent-stone buttons. Trace the final stitches or use the unbinding button. The familiar cottage objects, rug reveal and renewal receipt preserve progress across reloads. Both game modes use the same unguided puzzles.

A browser gesture starts the required audio before play. The supplied chant blends with the synthesized room score and fades down for Alice’s mixer. Music, ambience, and action sounds have separate volume controls. Sound failures offer retry and save export. [Audio provenance](docs/ASSET_PROVENANCE.md)

**The local release is available in `dist/`.** Serve it from a static host root or subdirectory. Run `npm run preview` to try the compiled files and `npm run test:release` to verify them with the production browser matrix. The release report records the Phase G baseline, save transfer instructions and physical device checks. [Phase G release report](docs/PHASE_G_REPORT.md)
