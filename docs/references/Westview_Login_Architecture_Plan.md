Westview Public Library — The Witches’ Road Login
Architecture and implementation plan, 4 November 2026

1. **Define the experience and its completion condition.**

    Build a browser puzzle game presented as an excessively elaborate library login. The player chooses a fictional borrowing alias, attempts to sign in, travels through five login-related trials, returns to the same cottage, and finally reaches a usable library account. The cottage, characters, and objects function as the controls. The Road connects those controls into a coherent story.

    The proposed library wrapper, the exact five-trial route, and a browser-local fictional account are implementation assumptions. The user’s established requirements are a mathematically and logically substantial login, eventual entry, Witches’ Road inspiration, many animations, references to the three shows, and the supplied cozy pixel-art direction.

    The canonical success condition is explicit. A stamped alias must exist, the five required trials must be solved, the final unbinding interaction must be complete, and the player must activate the cottage knocker. The resulting account lets the player renew A Short Introduction to Passwordless Authentication, examine collected discoveries, revisit completed rooms, and replay. An animation, hidden reference, timed action, sound cue, or optional puzzle can never become an undeclared requirement for this condition.

    Target an initial guided playthrough of approximately 25–45 minutes. Treat this as a playtest target. Offer a separate 8–12 minute showcase route with progressively explicit guidance for demonstrations. The complete content is shared between modes, while saves and completion records are separate.

    The introductory username card explicitly requests a fictional alias. The apparent password is a five-card ritual created during play. The initial text entry is a disposable “attempted spell” used for the password-dot theft gag, and is cleared after that interaction. The game keeps the alias, card IDs, puzzle state, and progress. It can run entirely as static files with local saves.

2. **Freeze one canonical route before adding detours.**

    | Stop | What the player does | Login function | Persistent outcome |
    |---|---|---|---|
    | Sunset cottage | Stamp an alias, try the door, witness Agatha steal the apparent password dots | Username and failed login | Alias, opening interaction seen |
    | Coven threshold | Seat the labeled coven tokens in their matching illustrated seats and open the trapdoor | Account recovery entrance | Road unlocked |
    | Jen’s kitchen | Measure exactly four cups using three-cup and five-cup jugs | Recovery eligibility | Kitchen solved, Track Four clue |
    | Alice’s studio | Intersect three rhythmic remainder clues and dial their common number | Verification code | Studio solved |
    | Agatha’s cabin | Set four spirit lamps to satisfy four parity statements | “I am not a robot” | Cabin solved |
    | Lilia’s tower | Deduce a five-card order using CUT and QUARREL, then confirm from the opposite seat | Set and confirm password | Tower solved, ritual card sequence |
    | Rio’s greenhouse | Draw a continuous signature through every vine clause exactly once | Terms acceptance | Greenhouse solved |
    | Cottage return | Recognize the props, perform the unbinding gesture, then use the knocker | Final sign-in | Fictional account open |
    | Library account | Renew the book and inspect the receipt | Successful authenticated-looking destination | Renewal recorded |

    The coven threshold is a short tutorial. The affinity labels and matching symbols supply every fact needed to seat the tokens. It introduces selection, placement, inspection, dialogue, and undo before a substantial puzzle begins. Sharon’s gardening token has the required leaf stamp and counts. The joke produces a valid match.

    There are five required trial completions. The eight-mushroom Remember me puzzle, Vision’s identity room, detective drawer, rabbit hunt, advertisements, TV channels, and discoveries are optional. A completed trial unlocks the next stop and remains available through the Road map. Revisiting never removes its completion. The map is a useful control drawn as a page in the borrowing ledger.

    Replace the earlier suggestion that Remember me becomes the final gate with one consistent behavior. It remains optional on arrival and return. Completing it enables a shortcut on the same browser after the first successful journey. On return its label can become “I remember you, too.” A player who skipped the garden can still sign in normally.

3. **Use a small browser stack with a separate rules engine.**

    | Part | Proposed technology | Responsibility |
    |---|---|---|
    | Application shell | React and TypeScript, built with Vite | Dialogues, journal, inventory, settings, accessible controls, account screen |
    | Illustrated scenes | PixiJS 8 | Layered sprites, camera, lighting, masks, particles, sprite animation |
    | Rules and progression | Plain TypeScript functions | Legal actions, puzzle evaluation, scene prerequisites, rewards |
    | Persistent state | IndexedDB, accessed through a small repository module | Run snapshots, previous checkpoint, preferences, save revision |
    | Audio | Web Audio API | Ambience, stems, effects, mute, crossfades |
    | DOM animation | CSS and Web Animations API | Dialogue reveal, panels, focus transitions |
    | Verification | Vitest and Playwright | Puzzle solvers, saved-state behavior, complete browser journeys |

    PixiJS supplies scene containers, an application ticker, and asset bundles. React owns all text that players must read and all semantic controls. Use the Pixi ticker for scene visuals and DOM animation for the interface. Keep frame-by-frame positions outside React state. Bundle assets locally and load each scene through an explicit manifest. Official technical references are listed at the end.

    ```mermaid
    flowchart TB
        I["DOM controls and dialogue choices"] --> C["Command processor"]
        C --> R["Puzzle rules and progression"]
        R --> S["Authoritative run state"]
        S --> P["Pixi scene and React interface"]
        S --> D["Save repository"]
        C --> E["Animation and audio cues"]
        D --> C
    ```

    The diagram describes ownership. The concrete action sequence is validation, next-state calculation, save attempt, publication, and cue playback. The command processor serializes these operations. A rendering callback cannot award a seal or change a puzzle answer.

    Use WebGL as the initial renderer target and catch initialization failures. A failed renderer offers an illustrated DOM view with the same legal controls, journal, and puzzle rules. A static background, objects, and text controls are enough for this fallback. It must be capable of reaching the account screen.

4. **Give each module one job.**

    | Proposed project path | Contents and boundary |
    |---|---|
    | `src/app/` | Shell, boot, loading, error boundaries, account view |
    | `src/game/state.ts` | Persisted types, defaults, validation |
    | `src/game/commands.ts` | Typed command definitions and serialized dispatch |
    | `src/game/progression.ts` | Required trial IDs, unlock rules, sign-in predicate |
    | `src/puzzles/` | One rules module per puzzle, with its solver and hint logic |
    | `src/scenes/` | Scene construction, prop placement, lifecycle, camera targets |
    | `src/content/` | Dialogue, clues, scene manifests, egg registry, authored puzzle instances |
    | `src/ui/` | Dialogue, object actions, notebook, inventory, settings, accessible scene controls |
    | `src/effects/` | Disposable animation and audio cues |
    | `src/persistence/` | IndexedDB repository, revisions, migrations, export and import |
    | `src/assets/` | Texture atlases, backgrounds, music, effects, fonts, source inventory |
    | `tests/` | Rules verification, progression, persistence, browser journeys |

    A scene controller creates and disposes its display objects and exposes inspection points. A puzzle module evaluates actions and supplies descriptions. The shell owns the current dialogue. Keep the first implementation explicit. Introduce another abstraction only when several concrete scenes need the same behavior.

5. **Make progression, visuals, and persistence agree.**

    A run snapshot needs the following shape. The field names are an implementation contract, while the individual puzzle types are defined by their rules modules.

    ```ts
    type RunState = {
      schemaVersion: number;
      contentVersion: string;
      runId: string;
      revision: number;
      seed: string;
      mode: "story" | "showcase";
      currentScene: SceneId;
      phase: "arrival" | "road" | "return" | "signedIn";
      alias: string | null;
      milestones: {
        thresholdOpened: boolean;
        unbindingCompleted: boolean;
        hasSignedInOnce: boolean;
        bookRenewed: boolean;
      };
      puzzles: {
        kitchen: KitchenState;
        studio: StudioState;
        cabin: CabinState;
        tower: TowerState;
        greenhouse: GreenhouseState;
        garden: GardenState;
        vision: VisionState;
      };
      journalEntries: ClueId[];
      inventory: ItemId[];
      discoveries: Partial<Record<EggId, DiscoveryState>>;
      statistics: RunStatistics;
    };
    ```

    Derive visible seals, available exits, and sign-in eligibility from this state. Each puzzle owns one authoritative solved flag. Avoid a second separately mutable list of earned seals. Device preferences such as font size, mute, and motion level live in a separate preferences record and survive starting a new run. A separate device collection keeps discovered egg IDs and cosmetic rewards across new journeys. Update that collection with the run in the same transaction when a discovery is awarded.

    Commands include `STAMP_ALIAS`, `START_RECOVERY`, `FILL_JUG`, `POUR_JUG`, `DIAL_CODE`, `TOGGLE_SPIRIT_LAMP`, `CUT_DECK`, `SWAP_FIRST_CARDS`, `SUBMIT_DECK`, `CONFIRM_DECK`, `TRACE_VINE`, `TOGGLE_MUSHROOM`, `INSPECT_PROP`, `REQUEST_HINT`, `ENTER_SCENE`, `UNDO_PUZZLE_MOVE`, `COMPLETE_UNBINDING`, `SIGN_IN`, and `RENEW_BOOK`.

    Every command checks its scene and phase prerequisites. Repeated `SIGN_IN` or `RENEW_BOOK` commands have the same final state as a single successful command. Awards use stable item and discovery IDs, so fast clicks and reloads cannot duplicate them.

    A single exported predicate computes sign-in eligibility from alias presence, all five required solved flags, and the unbinding milestone. Both the knocker’s appearance and its command handler call this predicate. An early click gives a precise in-world explanation of the next unmet condition.

    `SIGN_OUT` closes the in-world account and returns to the cottage with solved trials intact. `hasSignedInOnce` remains true. A remembered return offers a direct Continue to library action with a recognition animation, and uses the same eligibility predicate. `FORGET_ME` disables the garden’s remembered-return setting without deleting its solved record. New journey creates a fresh slot, while completed slots and the device collection remain available. The unbinding is a short, visibly offered finale gesture with an equivalent Unbind button, so it does not add an undeclared sixth puzzle.

    Transient UI state contains the currently open panel, selected prop, pending scene load, focus restoration target, and effect queue. Sprite coordinates, smoke particles, current audio nodes, and temporary password text are transient. They are reconstructed after reload.

6. **Specify and verify the six small mathematical systems.**

    Each module provides an initial state, a legal-move function, an evaluator, an undo strategy, a text description, and three hint levels. A solver is useful for validating authored content and generating the next legal hint. The browser game can ship a fixed set of curated instances.

    **Jen’s kitchen uses integer state transitions.** Represent the two jug volumes as `(small, large)`, bounded by `(3, 5)`. Legal operations fill a jug to capacity, empty it, or pour into the other jug until the source empties or the destination fills. A solution has exactly four cups in the larger jug. Partial pouring is outside the control vocabulary.

    | Move | Operation | Result `(small, large)` |
    |---|---|---|
    | Start | Both empty | `(0, 0)` |
    | 1 | Fill large | `(0, 5)` |
    | 2 | Large into small | `(3, 2)` |
    | 3 | Empty small | `(0, 2)` |
    | 4 | Large into small | `(2, 0)` |
    | 5 | Fill large | `(2, 5)` |
    | 6 | Large into small | `(3, 4)` |

    Breadth-first search confirms a six-move solution and no shorter one under these rules. Animate the pour from the accepted integer transition, and show the new measured quantities in the journal. The waterline makes the room feel urgent. If the timer rings, an oven mitt switches it off. State and available actions remain intact. Reaching the target reveals Track Four and creates the recovery seal.

    **Alice’s studio uses modular arithmetic.** The three printed lyric strips say the two-digit recording number leaves remainder 2 when divided by 3, remainder 3 when divided by 5, and remainder 2 when divided by 7. The allowed domain is explicitly 00–99.

    The constraints are `n mod 3 = 2`, `n mod 5 = 3`, and `n mod 7 = 2`. Enumerating the domain gives the unique answer 23. The combined repeat interval is 105 because 3, 5, and 7 are pairwise coprime, so the restricted domain contains at most one answer. A mixer channel reveals its candidate numbers on the studio’s illuminated number board. Multiple channels show the intersection. A rotary phone accepts the result, with equivalent digit buttons for keyboard and touch input.

    Track Four is a story clue that selects the correct recording. The code then comes from the recording’s constraints. It does not expire in real time. Playing the record backward is optional and reveals a separate voice line and discovery.

    **Agatha’s cabin uses parity logic.** There are four lamps, `A, B, C, D`. A lit lamp is 1 and an unlit lamp is 0. The board supplies all four rules in words, with a symbol view available in the journal.

    | Spirit statement | Exact rule |
    |---|---|
    | Exactly one of A and B burns | `A XOR B = 1` |
    | Exactly one of B and C burns | `B XOR C = 1` |
    | C and D agree | `C XOR D = 0` |
    | An odd number of A, C, and D burn | `A XOR C XOR D = 1` |

    The unique solution is `(1, 0, 1, 1)`. Exhaustive checking covers all 16 possible assignments. Every statement is part of one consistent system. The planchette points to a selected rule and its associated lamps so the player can inspect a contradiction. Four lamp buttons and a Check control are sufficient. An optional dimmed silhouette may possess Agatha during a wrong attempt, then retreat. The player retains all work.

    **Lilia’s tower combines constraint satisfaction and permutations.** The five cards are Cup, Moon, Tower, Key, and Door. The four memories specify that Tower follows Moon immediately, exactly two cards separate Moon and Door, Cup precedes Key, and Key precedes Door. All 120 permutations were enumerated. Exactly one satisfies the memories, `Cup, Moon, Tower, Key, Door`.

    CUT moves the first card to the last position. QUARREL swaps the first two. Enumerating the move graph reaches all 120 orders, so every arrangement is recoverable. Undo reverses the latest accepted move. A shuffle or authored initial order is saved and stays stable across refreshes.

    After the first submission, the opposite chair slides out. A seat marker and a nick beside one end of the table establish orientation. The confirmation view asks for the sequence from the other seat, `Door, Key, Tower, Moon, Cup`. Define one explicit view-to-canonical transformation and apply it once at submission. Each card’s art and label stay upright when their positions exchange. Both setting and confirming are required to mark this trial solved.

    Lilia’s memories appear in a deliberately different narrative order from the physical events they describe. Model them as authored fragments with event IDs and revealed flags. This supplies the effect of nonlinear time without rewinding the run snapshot. A later memory can add context to a clue already recorded.

    **Rio’s greenhouse uses an Euler trail.** Five garden stones are connected by seven undirected vines. The nodes are A Memory, B Breath, C Seed, D Bloom, and E Earth. The edges are AB, BC, CA, AD, DE, EA, and CD. The instruction is to begin at Seed, end at Bloom, and traverse every vine exactly once, in one continuous signature.

    Only C and D have odd degree. The graph is connected. A valid trail is `C → B → A → C → D → E → A → D`. Accept every route that meets the edge-use and endpoint conditions. The diagram can place nodes freely while keeping crossings clearly bridged. Drawing is optional. Players can select an adjacent stone with buttons, undo an edge, and reset the current route. The seven clauses are short fictional library terms displayed beside the vines. Completion grows a flower and produces the final required seal.

    **The optional garden uses binary linear algebra.** Eight mushrooms form a ring, numbered clockwise with the top cap as 1. Initially only 1 and 5 are lit. Touching cap i toggles i and its two neighbors, with wraparound. Light every cap to enable Remember me.

    Clicking caps 3 and 7 solves this authored state. Exhaustive checking of all 256 click-parity vectors gives exactly this solution. The 256 vectors also produce 256 distinct effects for an eight-node ring, which makes every initial lighting pattern solvable. Each cap gets a number, a shape cue, and a lit/unlit description. Hover, focus, or the Inspect action previews the three affected caps. A non-hover touch interface exposes the same preview before activation.

7. **Give Vision’s optional room a precise identity problem.**

    The cottage television opens a monochrome diagnostic annex after the studio. Two terminals each claim to be the user’s original library-card reader. Both can recite the copied alias and borrowing history. The player finds an external physical receipt with a fixed terminal stamp and a sequence of repairs.

    Use a finite matching puzzle with four terminal positions, four labeled casings, and four numbered memory modules. Four dated maintenance slips state the initial inventory, two casing swaps, and one memory-module swap. Exchanging a casing leaves a station’s memory module in place. Exchanging modules leaves its casing in place. The player reconstructs the present locations of the original module and casing.

    | Slip | Recorded maintenance |
    |---|---|
    | 1 | North starts with Brass and M1, East with Ivory and M2, South with Glass and M3, West with Ebony and M4 |
    | 2 | Exchange the North and East casings |
    | 3 | Exchange the East and South casings |
    | 4 | Exchange the North and West memory modules |

    A physical borrowing receipt identifies the original reader as Brass with M1. At the end, the Brass casing is at South, while M1 is at West. The card’s printed policy explicitly recognizes continuity of the memory module as the account identity rule, so West is the accepted answer. This authored instance can be checked by directly simulating the three swaps.

    The resolution can acknowledge that both terminals have a reasonable philosophical claim. Only the fictional policy determines the accepted answer. Do not make a philosophical opinion an unannounced correctness test. Keep all components and movements visible in a table. The implementation validates the authored transfer log by simulating it and checking the resulting mapping.

    Solving unlocks the optional caption “At least one of us is a robot,” the diagnostic TV channel, and a pale mechanical flower in the account room. JARVIS, FRIDAY, EDITH, and Ultron can appear as clearly labeled channel personalities supplying flavor dialogue. The full puzzle remains solvable using the receipts and rules in the room.

8. **Build Easter eggs as authored, testable content.**

    Each discovery record has a stable ID, eligible scenes, prerequisite predicate, trigger, threshold if relevant, effect cue, optional journal reward, and replay policy. Discoveries consume accepted game events such as an inspection or a solved puzzle. They never intercept puzzle commands or rewrite a valid answer.

    Use one row per feature in the content registry. The following catalogue covers the proposed references and small jokes.

    | ID | Trigger | Visible or audible payoff | Progress rule |
    |---|---|---|---|
    | `agatha.passwordPearls` | Submit a disposable attempted spell at arrival | Dots fly to Agatha’s necklace, then she pockets it | Opening gag records once per run, text is discarded |
    | `agatha.visibilityEye` | Activate Show password | Eye looks at player and admits it can see | Eye restores the usable control after its brief line |
    | `agatha.ribbonTrail` | Inspect a stolen dot | Purple ribbon traces the route to her pocket | Optional clue about the theft |
    | `agatha.unbinding` | Return with five seals and select the rune stitch | Player stitches replace the clerk’s, door becomes available | Required final interaction, also available as a text action |
    | `agnes.caseDrawer` | Select Forgot username | Noir drawer, card photograph, red-string case | Correctly reveals the saved alias |
    | `teen.sigil` | Inspect the covered borrowing card after the tower | Name sigil briefly resolves, matching the player’s card | Optional identification payoff |
    | `sharon.greenThumb` | Inspect the coven gardening token | Ordinary gardening qualification receives a solemn magical stamp | Tutorial’s leaf match remains valid |
    | `jen.timerMitt` | Kitchen pressure timer reaches its authored cue | Oven mitt turns the timer off | No progress loss, cannot repeatedly farm the discovery |
    | `jen.pumpkinWitness` | Pour three times | Pumpkin follows stream, then looks toward the record | Flavor and pointing cue |
    | `alice.backwardRecord` | Select reverse playback on Track Four | Original reversed phrase and a flame briefly leaning backward | Separate from the required code |
    | `alice.protectionRefrain` | Complete the OTP | Room hum resolves into an original protective motif | Completion atmosphere, captions describe it |
    | `evanora.possession` | Submit a wrong lamp pattern once | Shadow briefly moves against Agatha’s pose | Short, skippable, zero lost actions |
    | `lilia.futureNote` | Inspect the sealed appointment envelope | “You will have already asked me this.” | Same clue available in the journal |
    | `lilia.towerInversion` | Confirm the card password | Diorama seems to invert around the table | Reduced motion shows two still perspectives |
    | `salem.windowVisitors` | Cabin solved and window inspected | Seven silhouettes pass behind the glass | One optional encounter, no pursuit timer |
    | `rio.sessionFlower` | Return after a deliberate break or select Expire session in the account | Red flower, Death’s session-expired line | Resume keeps all completed trials |
    | `rio.gardenRecognition` | Revisit after completing Remember me and sign-in | Caps turn toward player, door recognizes alias | Same-browser convenience after first success |
    | `rabbit.first` | Find rabbit behind a garden stone | Rabbit relocates | Records first distinct hiding place |
    | `rabbit.second` | Find it by the kitchen cupboard | Rabbit leaves a muddy print | Requires first discovery |
    | `rabbit.third` | Find it behind the studio speaker | Paw stamp on card | Requires second, unlocks portrait reward |
    | `rabbit.clerkGlasses` | Replay after the third rabbit discovery | Rabbit wears the clerk’s glasses | Appearance reward, no new puzzle gate |
    | `wanda.toasterAd` | Tune cottage TV to its sponsor channel | Original “two-factor toast” advert, red pilot light | Optional channel, replayable |
    | `wanda.recast` | Revisit the portrait after its first scene | Portrait’s actor changes but clerk insists nothing happened | Appearance only, clues retain wording |
    | `wanda.standBy` | Change between TV channels | Brief test card with a hexagonal motif | Skippable transition |
    | `vision.identityAnnex` | Select the diagnostic TV channel after studio | Optional identity puzzle room | Completion never required by the knocker |
    | `vision.aiArgument` | Inspect the annex intercom | Four AI personalities dispute one family subscription | Short authored exchanges with captions |
    | `volume.badKnob` | Turn the TV’s apparently obvious volume dial | Subtitle size changes | Real audio controls remain available in settings |
    | `volume.speakerDoors` | Open or close the cabinet speaker doors | In-world gain changes | Master mute always takes precedence |
    | `road.rugMap` | Inspect bedroom rug before and after return | Same embroidery becomes recognizable as the Road map | No earlier pixels or symbols need to change |
    | `road.propsAlreadyHere` | Inspect opening props after completing their rooms | New descriptions connect cup, key, cards, record, and flower | Journal records the structural reveal |
    | `road.returnSmoke` | Return to cottage | Chimney curls retrace into chimney | Optional visual cue, reduced motion gives descriptive caption |
    | `road.borrowingDate` | Inspect return-date stamp | Date 1693 and librarian’s irritated annotation | Flavor only |
    | `library.longReceipt` | Renew the book for the first time | Receipt unrolls down a tiny depiction of the Road | Renewal records before animation starts |
    | `library.finalStamp` | Turn off the completed cottage TV | Picture dot, final stamp, paper slip | Also runs silently with a text equivalent |

    Keep a discovery notebook with silhouettes for unfound items and readable descriptions for found ones. Avoid listing every hidden name on first arrival. After completing the main route, offer gentle room-level clues for remaining discoveries. References reward recognition, while the local instructions supply all puzzle knowledge.

9. **Translate the supplied art into consistent game assets.**

    | Supplied file | Design role |
    |---|---|
    | `witch4.jpg`, `witch3.jpg` | Cottage silhouette, dusk palette, circular windows, ivy, chimney smoke, layered forest |
    | `witch.png` | Garden paths, blue-green mushroom light, moonlit optional night variant |
    | `witch5.jpg` | Isometric cutaway layout, readable prop clusters, compact potion-room staging |
    | `witch2.png` | Wooden floors, purple room, bookshelves, woven-rug reveal, cozy furniture |
    | `agatha.jpg` | Small character silhouette, blue outfit, purple cloak, ribbon magic |
    | `death.jpeg` | Dialogue portrait scale, green accents, intimate framing, small flower |

    Treat the generated cottage concept as a composition reference. Build separate scenery layers, object sprites, character sprites, and interface elements. Required clues and working controls are live text or crisp symbols. A background painting can carry atmosphere, while its incidental lettering is decorative.

    Start with a shared 640 × 360 scene coordinate system. Rooms may use exterior side views or interior isometric staging, but controls share one hotspot mapping convention. Maintain deep plum shadows, warm wooden midtones, amber lights, mint magical highlights, and coral dusk. Each trial can shift one accent without changing the materials or outline language.

    Create scene layers for distant sky, forest, room shell, furniture, interactive props, characters, foreground, and lighting. A sprite definition includes its anchor, logical bounding box, animation names, frames, frame durations, and reduced-motion still. An object definition includes its stable ID, hotspot, inspection action, accessible name, and prerequisites.

    Keep painterly scene detail and small chunky character pixels compatible by matching outline darkness, light direction, and scale. Export readable silhouettes and test them at actual viewing size. A sprite atlas should have padding and edge extrusion to avoid neighboring-frame bleed.

10. **Schedule animation without making it the rules engine.**

    | Animation layer | Examples | Scheduling |
    |---|---|---|
    | Ambient | Smoke, candlelight, fireflies, gently bubbling cauldron | Seeded visual phase, pause when hidden |
    | Object response | Mushroom toggle, jug tilt, card quarrel | Short cue from an accepted action |
    | Character | Blink, skeptical look, theft, flower offer | Named sprite animation with a declared fallback still |
    | Puzzle reward | Music resolves, door opens, flower blooms | State commits before the cue begins |
    | Scene transition | Cottage wall opens, table perspective changes | Preload target assets, then one coordinated transition |
    | Optional encounter | Silhouettes, commercial, final stamp | Registry prerequisite and one-shot or replay policy |

    Use one active scene ticker. Timeline descriptions contain start state, duration, end state, cancellation behavior, affected props, and any audio cue. Scene destruction cancels its timers and audio nodes. A skipped timeline immediately presents its terminal pose. Logical completion is available even if the tab closes, audio fails, reduced motion is enabled, or the animation completion callback never runs.

    Keep simple object responses around 150–350 ms, character jokes around 1–2 seconds, and first-view scene changes around 0.8–1.5 seconds. These are starting design targets. Dialogue advancement and Skip remain available. Long jokes do not monopolize puzzle controls. Input during a required transition is explicitly gated, while ambient motion leaves interactions responsive.

    Essential animation describes a state change through motion and another cue. A lit mushroom changes its pattern and textual state. The backwards table gets an explicit seat label. A completed pour updates the volume readout. Fog and foreground leaves must not conceal the active clue or controls.

11. **Use sound as atmosphere and a second expression of clues.**

    Start or resume the audio context after the player’s first explicit interaction. If playback is blocked, the experience continues with captions and visual rhythm. Use master gain with separate ambience, music, and effect gains. The speaker doors adjust an additional in-world music gain, so global mute continues to work.

    Each scene has an ambient loop and a few interaction sounds. Alice’s mixer has three synchronized original stems, all scheduled from the same audio clock. Muting or seeking a stem cannot alter the code’s rules. The printed lyric strips and candidate board carry the full information. Preserve stems’ phase alignment on pause, tab hiding, and resume.

    Store sounds locally, expose captions for meaningful noises, and give every volume setting a clear text label. The fake TV knob changes only its own subtitle presentation, within a readable range. The app’s general text-size preference has precedence over the gag. Use an original musical motif for the prototype’s protection refrain and original written commercial dialogue.

12. **Map the illustrated room to reliable controls on every screen.**

    Render readable text, form inputs, buttons, focus indicators, dialogue choices, and journal content in the DOM. The canvas draws the scene. Required scene interactions use positioned semantic buttons over the corresponding illustrated objects. All input methods call the same command processor.

    On desktop, the scene occupies the main stage and dialogue sits below it. An optional notebook rail can open alongside it. On portrait phones, preserve the whole-room overview and open selected puzzles in a large detail panel. Move their real controls into that panel, with touch targets of approximately 44 CSS pixels or greater. Fit and letterbox the scene at a shared scale. Derive sprite display positions and hotspot positions from the same viewport transform.

    A scene action list provides the same objects in reading order. Both this list and overlay buttons derive from the same object definitions. In action-list mode, hide the redundant overlay controls from the focus sequence. Restore focus to the activating object when a dialogue or detail panel closes, and move it to the new scene’s title description after travel. Escape closes inspection or opens pause. Enter or Space activates buttons. Puzzle-specific arrow navigation is documented alongside the controls.

    Preferences cover motion level, text size, dialogue reveal speed, captions, master mute, and high-contrast object outlines. Start from the system’s reduced-motion preference and allow an override. Its effect must reach both CSS animations and the Pixi scene. Complete text appears immediately to assistive technology even while a visual typewriter effect plays. Meaningful controls stay fully legible when scenes shake, invert, or turn monochrome.

13. **Save stable decisions and handle interruptions explicitly.**

    Save after every accepted puzzle move, acquired clue, recorded discovery, scene entry, and milestone. Small alias drafts and frame-by-frame visuals do not trigger saves. Serialize commands in one tab. The repository stores the current run and previous checkpoint in a transaction, increments the revision, and reports completion or failure. Request stricter durability for major checkpoints where supported, while treating browser retention and disk behavior as platform limits.

    Wait for a successful save attempt before presenting a major reward or entering the account. If persistence fails, preserve the current in-memory run, display a clear saving status, and offer an export. Continued play remains possible with that status visible. A browser-local save cannot promise cross-device continuity or survival after browser data is cleared.

    On boot, validate schema version, content version, instance IDs, and bounded puzzle values. Migrate supported older saves through explicit version steps. For an unreadable save, retain the original for export and try the previous valid checkpoint. Starting over is a separate choice. Never interpret a missing object as a solved trial.

    Keep the authored puzzle instance and seed stable through a run. A new content release can keep the old small instance definitions for existing saves. If a version is unsupported, explain that the saved journey needs the previous content version and offer export and a new slot.

    Compare the save revision inside the same read/write transaction used to store the next snapshot. A stale second tab reloads the latest state and asks the player to repeat its intended action. It must not silently replay a now-invalid pour, card move, or egg trigger. BroadcastChannel can notify other tabs quickly, while the transactional revision check remains authoritative.

    Scene travel first loads the target scene’s required bundle. Until it is ready, retain the current room and show retryable loading. Track a request ID to ignore stale asset responses. Commit the new current scene only after it can be shown. A scene with a missing optional flourish can use its still substitute. A missing clue texture must still have a text representation.

    Treat inactivity as a story cue. Hidden tabs pause optional clocks and the active-play statistic. A “session expired” flower can appear on return, with Resume, and all puzzle progress stays valid. The showcase can expose an explicit Expire session action so the joke is demonstrable without a wait.

14. **Make the hint system part of the fiction.**

    The green desk lamp is a dependable helper. One pull gives an observation, the second points to a relation, and the third demonstrates the next legal move. In the kitchen the lamp can identify the useful remainder. In the cabin it can highlight a violated statement. In the tower it can suggest a legal CUT or QUARREL from the current arrangement. In the greenhouse it can undo to a viable prefix if the current partial trail is a dead end, explaining the reversal before doing it.

    Hints operate on current puzzle state. A solve performed by the player, through hints, or through showcase guidance earns the same narrative reward. Record assistance for private run statistics if desired. The account and Easter eggs remain available. A journal entry always distinguishes a discovered clue from a deduction supplied by a hint.

    All clues remain reviewable. Wrong answers give specific, inspectable feedback. Undo operates within the current unsolved puzzle and cannot revoke cross-scene seals. A completed puzzle can open as a separate practice copy. Reset practice, current puzzle, current run, and all saved data are different actions with clear scopes.

15. **Load only what is needed and set measurable budgets.**

    The first bundle contains the cottage, dialogue UI, essential fonts, Agatha’s opening frames, and the garden’s light sprites. Load the coven and kitchen in the background after arrival. Each later bundle contains one scene’s textures, characters, puzzle props, and audio. Load the next room while the current reward is being inspected.

    Initial targets are a compressed first-interaction download below about 5 MB, later room bundles around 1–3 MB before optional audio, and responsive controls even when effects are reduced. These are budgets to measure on the actual assets and target network. A 2048 × 2048 RGBA atlas occupies about 16 MiB before additional GPU overhead, so compressed download size alone is insufficient. Keep only the current room and a small shared atlas resident, and cap renderer resolution on dense phone screens.

    Favor a handful of small looping sprites over large continuously animated video textures. Limit particles and transparent full-scene layers. Pause on visibility changes, dispose listeners and sprites on scene exit, and test repeated room changes for memory growth. Retain an asset reference count so unloading one scene cannot break a shared character texture. Prefer nearest-neighbor texture sampling for the pixel art, while allowing smooth DOM text at a comfortable size.

    Static hosting serves the entry point, versioned code bundles, textures, audio, and content. The app can use one document route and an internal scene ID, avoiding server routing requirements for the prototype. Cache fingerprinted assets aggressively and keep the entry manifest revalidatable. Add a service worker only if offline support becomes an explicit deliverable, with an update policy that keeps each saved run’s content version available.

16. **Give content authors explicit contracts.**

    | Content kind | Required fields |
    |---|---|
    | Scene | ID, bundle ID, background layers, object IDs, entry description, accessible object order, exit rules |
    | Prop | ID, sprite or still, scene position, hotspot, accessible label, inspection text, command, availability rule |
    | Dialogue | Node ID, speaker, text, portrait expression, choices, journal additions, stable follow-up IDs |
    | Puzzle instance | ID, rules version, initial state, parameter bounds, clues, accepted completion predicate, solver check |
    | Animation | ID, affected props, initial pose, duration, terminal pose, cancellation, reduced-motion equivalent |
    | Discovery | ID, prerequisites, trigger, one-shot or replay policy, cue, notebook entry |
    | Audio | ID, file, bus, loop points if relevant, caption, fallback behavior |

    Store story text and numerical puzzle parameters together in the instance definition or derive the text from those parameters. This prevents an author changing a remainder in the interface while leaving the evaluator unchanged. Build validation checks all referenced IDs, bundles, exits, dialogue links, discovery prerequisites, and required-trial registrations.

    Use an asset inventory with source, intended role, dimensions, pixel scale, alpha requirements, atlas membership, and animation frame counts. The supplied seven reference images start this inventory. Separate portraits from roaming character sprites, so a large expression does not become an unreadable tiny face in the room.

17. **Verify the risks that could prevent eventual entry.**

    | Verification | Passing condition |
    |---|---|
    | Kitchen solver | Authored target reachable, six-move reference path valid, capacities respected |
    | OTP enumerator | Exactly one accepted number in the declared range, printed remainders agree |
    | Spirit enumerator | Exactly one valid lamp assignment, each clue matches the evaluator |
    | Tarot constraint check | Exactly one logical order, every initial order can reach it through legal controls |
    | Opposite-seat confirmation | One coordinate transformation, expected reversed display accepted, original display rejected when appropriate |
    | Greenhouse validator | Every required edge used exactly once, specified endpoints, all valid trails accepted |
    | Garden enumerator | Every lighting pattern reachable, authored two-click solution valid |
    | Progression | Required route reaches sign-in, optional discoveries never enter its predicate |
    | Duplicate actions | Repeated solve, sign-in, or renewal produces one award and one recorded outcome |
    | Persistence | Refresh after each meaningful move restores valid state and clue context |
    | Interrupted cues | Refresh or Skip during a reward leaves the solved trial completed |
    | Multi-tab use | Stale revision is detected, no silent state overwrite |
    | Accessibility path | Keyboard, touch detail view, captions, action-list mode, reduced motion can reach success |
    | Asset or renderer failure | Retry or text/DOM fallback preserves the required interaction |
    | Discovery registry | Every item is triggerable under its documented prerequisites and replay policy |

    Browser journeys should cover the complete first run, the Remember me return visit, an assisted run, refresh mid-puzzle, refresh after a final trial, muted play, reduced motion, portrait touch layout, and optional-room return. Test a representative Chrome desktop, Firefox desktop, Safari/WebKit, and a real mobile device when available. Automated viewport emulation is useful but does not establish real-device performance.

    During this planning pass, small exhaustive checks verified the kitchen’s shortest reference solution, the OTP’s unique candidate, all 16 cabin assignments, all 120 tarot orders and move reachability, and all 256 garden click patterns. Direct checks verified the stated greenhouse trail and the optional Vision maintenance sequence. These checks validate the example mathematics. Browser interactions, performance budgets, save behavior, and visual layout remain implementation work to verify.

18. **Build in dependency order and finish each pass at a playable endpoint.**

    | Pass | Concrete output | Gate before continuing | Rough focused effort |
    |---|---|---|---|
    | A | Typed state, commands, save repository, text-only full route, functional account and renewal | All five trials can lead to sign-in and survive refresh | 2–3 days |
    | B | Cottage art pass, alias card, dot theft, garden, green hint lamp | Opening works with pointer, keyboard, touch, sound muted | 2–3 days |
    | C | Kitchen and studio with their journals and return paths | Verified rules match live controls, both rewards persist | 3–4 days |
    | D | Cabin and tower, orientation confirmation, nonlinear memories | Rules and transformed input checked, complete route remains playable | 3–4 days |
    | E | Greenhouse, cottage return, unbinding, rug and prop reveal, receipt | First-time and returning-player journeys complete | 2–3 days |
    | F | Vision annex and discovery registry with all catalogued optional interactions | Each trigger reachable and no optional action can block exit | 3–5 days |
    | G | Audio mix, responsive layouts, fallbacks, persistence failures, performance and device QA | Acceptance matrix passes, known limitations recorded | 3–4 days |

    These estimates assume intermediate frontend familiarity and usable art assets. They are planning ranges, with roughly 18–26 focused working days before substantial new art production. Creating every room, portrait, character frame, original music stem, and polished transition can add significant parallel work. Keep the first art pass small and replace placeholder assets after the route is complete.

    The highest-value first visual demonstration is the cottage, password-dot theft, garden ring, and Lilia’s card table, followed by a working account destination. The development harness may jump to those scenes in development builds. The shipped story route uses the canonical prerequisites.

    A complete handoff consists of the source project, pinned dependency lockfile, build command, asset inventory, authored content, puzzle validators, passing browser journeys, a deployment-ready static build, and a short explanation of save scope and known compatibility limits. This plan is the specification for those deliverables.

19. **Use the current platform references during implementation.**

    PixiJS 8 application, ticker, resize, and assets documentation supports the proposed renderer responsibilities and asset-loading approach. MDN documents autoplay behavior, reduced-motion detection, and IndexedDB transactions. Specific performance targets, architecture choices, story events, and puzzle rules above are design decisions.

    | Reference | Link |
    |---|---|
    | PixiJS application and initialization | https://pixijs.com/8.x/guides/components/application |
    | PixiJS asset bundles and loading | https://pixijs.com/8.x/guides/components/assets |
    | PixiJS ticker | https://pixijs.com/8.x/guides/components/ticker |
    | PixiJS resize behavior | https://pixijs.com/8.x/guides/components/application/resize-plugin |
    | Browser autoplay behavior | https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay |
    | Reduced-motion preference | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion |
    | IndexedDB transactions | https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction |
    | IndexedDB durability hints | https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability |
