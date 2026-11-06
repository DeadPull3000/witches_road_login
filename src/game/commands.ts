import { COVEN, SCENES, TRIALS, type SceneId, type Trial } from '../content/scenes';
import { cabinMatches, CARDS, confirmationMatches, cut, greenhouseMatches, JUG_MOVES, jugMove, quarrel, studioMatches, toggleMushroom, towerMatches, vineChoices, type Card, type JugMove, type Node } from '../puzzles/rules';
import { canEnter, canSignIn, runSchema, type RunState } from './state';
import { MEMORIES, type MemoryId } from '../content/memories';
import { ROOM_PROPS, type RoomPropId } from '../content/cottage';
import type { DiscoveryId } from '../content/discoveries';
import { TV_CHANNELS, TV_DIALS, encounterAvailable, type EncounterId, type TvChannel } from '../content/encounters';
import { VISION_STATIONS, visionIdentityMatches, type VisionStation } from '../content/vision';

export type Command =
  | { type: 'INSPECT_PROP'; prop: 'door' | 'ribbon' | 'visibilityEye' | 'sharon' | 'smallJug' | 'largeJug' | 'jen' | 'alice' | 'planchette' | 'agathaCabin' | 'lilia' | 'envelope' | 'rio' | 'roomRug' | 'loanLedger' | 'returnSlot' | RoomPropId }
  | { type: 'INSPECT_ENCOUNTER'; prop: EncounterId }
  | { type: 'TUNE_TELEVISION'; channel: TvChannel }
  | { type: 'SELECT_IDENTITY'; station: VisionStation }
  | { type: 'SET_COTTAGE_VIEW'; view: RunState['cottageView'] }
  | { type: 'REMEMBER_ME' }
  | { type: 'TRACE_VINE_PATH'; nodes: Node[]; revision: number }
  | { type: 'REVEAL_MEMORY'; memory: MemoryId }
  | { type: 'SET_CHANNEL'; index: number; enabled: boolean }
  | { type: 'STAMP_ALIAS'; alias: string }
  | { type: 'SUBMIT_ATTEMPTED_SPELL' | 'START_RECOVERY' | 'MATCH_COVEN' | 'CHECK_LAMPS' | 'SUBMIT_DECK' | 'CONFIRM_DECK' | 'CLEAR_CONFIRM' | 'UNDO' | 'RESET_PUZZLE' | 'UNBIND' | 'SIGN_IN' | 'SIGN_OUT' | 'EXPIRE_SESSION' | 'RENEW_BOOK' | 'FORGET_ME' | 'KITCHEN_TIMER' | 'TOGGLE_SPEAKERS' | 'REVERSE_RECORD' | 'TURN_TV_DIAL' | 'OPEN_VISION' | 'LEAVE_VISION' | 'SUBMIT_IDENTITY' }
  | { type: 'PLACE_TOKEN'; seat: number; token: string | null }
  | { type: 'ENTER_SCENE'; scene: SceneId }
  | { type: 'JUG'; move: JugMove }
  | { type: 'DIAL_CODE'; code: string }
  | { type: 'TOGGLE_LAMP'; index: number }
  | { type: 'MOVE_DECK'; move: 'cut' | 'quarrel' }
  | { type: 'PICK_CONFIRM'; card: Card }
  | { type: 'TRACE_VINE'; node: Node }
  | { type: 'TOGGLE_MUSHROOM'; index: number };

export class RuleError extends Error {}
const requireRule: (condition: unknown, message: string) => asserts condition = (condition, message) => { if (!condition) throw new RuleError(message); };
const history = <T,>(items: T[], current: T): T[] => [...items.slice(-99), structuredClone(current)];
const addJournal = (state: RunState, text: string) => { if (!state.journalEntries.includes(text)) state.journalEntries.push(text); };
const discover = (state: RunState, id: DiscoveryId) => { if (!state.discoveries.includes(id)) state.discoveries.push(id); };

const encounterPayoff: Partial<Record<EncounterId, { id: DiscoveryId; line: string }>> = {
  sigilCard: { id: 'teen.sigil', line: 'The sigil clears for a moment. The name is the one on your borrowing card.' },
  rabbitPortrait: { id: 'rabbit.clerkGlasses', line: 'Señor Scratchy has borrowed the clerk’s spectacles. His expression suggests a late fee.' },
  gardenStone: { id: 'rabbit.first', line: 'A rabbit slips out from behind the stone and into the shadows.' },
  kitchenCupboard: { id: 'rabbit.second', line: 'A muddy print on the cupboard. Jen politely refuses to put it on the ingredient list.' },
  studioSpeaker: { id: 'rabbit.third', line: 'Señor Scratchy pops out behind the speaker and leaves a paw stamp on your card.' },
  cabinWindow: { id: 'salem.windowVisitors', line: 'Seven figures pass behind the glass. Their footsteps fade into the woods.' },
  visionIntercom: { id: 'vision.aiArgument', line: 'Four voices share the intercom and apparently one subscription.' },
  returnDate: { id: 'road.borrowingDate', line: 'The old stamp reads 1693. The librarian has underlined “overdue” twice.' },
};

export function applyCommand(source: RunState, command: Command, collection: readonly string[] = []): { state: RunState; message: string } {
  const state = structuredClone(source);
  let message = '';
  const inScene = (scene: SceneId) => requireRule(state.currentScene === scene, `That action belongs in ${scene}.`);
  const unsolved = (trial: Trial | 'garden') => requireRule(!state.puzzles[trial].solved, 'This trial is complete. Its seal is safe.');
  switch (command.type) {
    case 'INSPECT_PROP':
      if (command.prop.startsWith('room')) {
        inScene('cottage'); requireRule(state.cottageView === 'inside', 'Look inside the cottage to inspect that object.');
        if (command.prop === 'roomRug') {
          message = state.puzzles.greenhouse.solved ? 'The rug has not changed. Cup, record, lamp, cards and flower: its five turns are the Road you just walked.' : 'Five small motifs are stitched into the rug: a cup, a record, a lamp, cards and a flower. The thread is old.';
          if (state.puzzles.greenhouse.solved) { discover(state, 'road.rugMap'); addJournal(state, message); }
        } else {
          const prop = ROOM_PROPS.find(item => item.id === command.prop); requireRule(prop, 'That cottage object is unavailable.');
          message = state.puzzles[prop.trial].solved ? prop.after : prop.before;
          if (state.puzzles.greenhouse.solved) { discover(state, 'road.propsAlreadyHere'); addJournal(state, message); }
        }
      } else if (command.prop === 'rio') {
        inScene('greenhouse'); message = state.puzzles.greenhouse.solved ? 'Rio offers the flower. “There. Something to take home.”' : 'Rio turns the flower between two fingers. “Everything returns. Even library books.”';
      } else if (command.prop === 'loanLedger' || command.prop === 'returnSlot') {
        inScene('account'); message = command.prop === 'returnSlot' ? 'A brass slot for returns. For today, your book can stay with you.' : state.milestones.bookRenewed ? 'Your borrowing ledger records another 28 fictional days. The receipt is yours.' : 'One book, due for renewal. The librarian has already found your page.';
      } else if (command.prop === 'smallJug' || command.prop === 'largeJug' || command.prop === 'jen') {
        inScene('kitchen');
        message = command.prop === 'jen' ? (state.puzzles.kitchen.solved ? 'Jen raises her cup. “Measured. Precisely. I approve.”' : 'Jen watches the marble worktop. “Those are measuring vessels, not suggestions.”') : `${command.prop === 'smallJug' ? 'The three-cup jug' : 'The five-cup jug'} currently holds ${state.puzzles.kitchen.volumes[command.prop === 'smallJug' ? 0 : 1]} cups.`;
      } else if (command.prop === 'alice') {
        inScene('studio'); message = state.puzzles.studio.solved ? 'Alice lets the last chord ring. “That one sounded like coming home.”' : 'Alice brushes a thumb over the record sleeve. “My mother always left something in the music.”';
      } else if (command.prop === 'planchette' || command.prop === 'agathaCabin') {
        inScene('cabin'); message = command.prop === 'planchette' ? 'The planchette rests between four lamp sockets. It answers only when asked; nothing here counts down.' : state.puzzles.cabin.solved ? 'Agatha studies the lamps. “Apparently human. How disappointing.”' : 'Agatha folds her arms. “I prefer a spirit with a little conviction.”';
      } else if (command.prop === 'lilia' || command.prop === 'envelope') {
        inScene('tower');
        if (command.prop === 'envelope') { discover(state, 'lilia.futureNote'); message = 'Lilia’s sealed appointment envelope: “You will have already asked me this.”'; addJournal(state, message); }
        else message = state.puzzles.tower.solved ? 'Lilia holds the door. “I liked this part. I think I always did.”' : 'Lilia touches the edge of the table. “My life comes to me out of order. These moments are mine.”';
      } else if (command.prop === 'sharon') {
        inScene('threshold'); discover(state, 'sharon.greenThumb'); message = 'Sharon presents a perfectly ordinary gardening certificate. The leaf stamp is valid.';
      } else {
        inScene('cottage');
        if (command.prop === 'door') message = canSignIn(state) ? 'The brass knocker is ready. Use it to enter your library account.' : missingSignIn(state);
        else if (command.prop === 'visibilityEye') { discover(state, 'agatha.visibilityEye'); message = 'The little eye looks back. “Yes, I can see you, too.”'; }
        else if (command.prop === 'ribbon') {
          if (state.arrival.theftRecorded) { discover(state, 'agatha.ribbonTrail'); message = 'A violet thread curls from the missing dots to Agatha’s pocket. “Coincidence.”'; }
          else message = 'Agatha adjusts the violet lining of her blue coat. She is watching your borrowing card rather closely.';
        } else throw new RuleError('That prop is not available.');
      }
      break;
    case 'INSPECT_ENCOUNTER': {
      const { prop } = command;
      requireRule(encounterAvailable(state, prop, collection), 'That object is unavailable here.');
      if (prop === 'television') message = 'The old set warms up when you turn its channel selector.';
      else if (prop === 'caseDrawer') {
        discover(state, 'agnes.caseDrawer');
        message = 'Detective Agnes opens the drawer and finds your stamped borrowing card.';
      } else if (prop === 'portrait') {
        if (state.encounters.portraitSeen) discover(state, 'wanda.recast');
        state.encounters.portraitSeen = true;
        message = state.discoveries.includes('wanda.recast') ? 'The face is different. Agatha blames the light.' : 'The clerk looks out from the old picture frame.';
      } else {
        const payoff = encounterPayoff[prop];
        requireRule(payoff, 'That object is unavailable here.');
        discover(state, payoff.id);
        message = payoff.line;
      }
      break;
    }
    case 'TUNE_TELEVISION': {
      requireRule(encounterAvailable(state, 'television'), 'The television is inside the cottage.');
      const { channel } = command, previous = state.encounters.tvChannel;
      requireRule(TV_CHANNELS.includes(channel), 'Choose a television channel.');
      requireRule(channel !== 'diagnostic' || state.puzzles.studio.solved, 'The diagnostic channel needs Alice’s completed recording.');
      state.encounters.tvChannel = channel;
      if (previous !== 'off' && channel !== 'off' && previous !== channel) discover(state, 'wanda.standBy');
      if (channel === 'sponsor') discover(state, 'wanda.toasterAd');
      if (channel === 'off') {
        if (previous !== 'off' && state.milestones.bookRenewed) discover(state, 'library.finalStamp');
        message = state.discoveries.includes('library.finalStamp') ? 'The picture contracts to a dot. One last stamped slip slides out.' : 'The picture contracts to a dot. The set goes dark.';
      } else message = `Now showing ${TV_DIALS[channel]}.`;
      break;
    }
    case 'TURN_TV_DIAL':
      requireRule(encounterAvailable(state, 'television') && state.encounters.tvChannel !== 'off', 'Turn the television on first.');
      state.encounters.tvLargeCaptions = !state.encounters.tvLargeCaptions; discover(state, 'volume.badKnob');
      message = 'The dial changes the television captions. The room’s sound stays where you set it.'; break;
    case 'OPEN_VISION':
      requireRule(encounterAvailable(state, 'television') && state.encounters.tvChannel === 'diagnostic' && state.puzzles.studio.solved, 'Tune the cottage television to diagnostics after completing the studio.');
      discover(state, 'vision.identityAnnex'); state.currentScene = 'vision';
      message = 'The diagnostic screen opens onto a room of four readers.'; break;
    case 'LEAVE_VISION':
      inScene('vision'); state.currentScene = 'cottage'; state.cottageView = 'inside';
      message = 'You are back beside the cottage television. The Road keeps your place.'; break;
    case 'SELECT_IDENTITY':
      inScene('vision'); requireRule(!state.puzzles.vision.solved, 'The original reader has already been verified.');
      requireRule(VISION_STATIONS.includes(command.station), 'Choose a labeled reader.');
      state.puzzles.vision.selection = command.station; message = `${command.station} reader selected.`; break;
    case 'SUBMIT_IDENTITY': {
      inScene('vision');
      const vision = state.puzzles.vision;
      requireRule(vision.selection, 'Select a reader before filing the receipt.');
      requireRule(visionIdentityMatches(vision.selection), 'The library cannot recognize that reader under the printed policy.');
      vision.solved = true;
      addJournal(state, 'Vision verified the original reader under the library’s continuity policy. A pale mechanical flower is waiting at the library desk.');
      message = 'Original reader verified. Vision considers the paperwork. “At least one of us is a robot.”'; break;
    }
    case 'SET_COTTAGE_VIEW':
      inScene('cottage'); requireRule(command.view === 'inside' || command.view === 'outside', 'Choose the inside or outside of the cottage.');
      state.cottageView = command.view; message = command.view === 'inside' ? 'A familiar little room. Everything is exactly where it was.' : 'The same cottage, at the edge of the Road.'; break;
    case 'STAMP_ALIAS': {
      inScene('cottage'); requireRule(!state.arrival.theftRecorded, 'Your card is already stamped.');
      const alias = command.alias.trim();
      requireRule(alias.length > 0 && alias.length <= 24 && !/[\x00-\x1F\x7F]/.test(alias), 'Choose a fictional alias of 1–24 characters, without control characters.');
      state.alias = alias; state.arrival.aliasStamped = true; message = `Borrowing card stamped for ${alias}.`; break;
    }
    case 'SUBMIT_ATTEMPTED_SPELL':
      inScene('cottage'); requireRule(state.arrival.aliasStamped, 'Stamp your borrowing alias first.');
      if (!state.arrival.theftRecorded) { state.arrival.theftRecorded = true; discover(state, 'agatha.passwordPearls'); }
      message = 'Agatha pockets the password dots. “Oh dear. You’ll need account recovery.”'; break;
    case 'START_RECOVERY':
      inScene('cottage'); requireRule(state.arrival.theftRecorded, 'Try the cottage door first.'); state.currentScene = 'threshold'; message = 'Seat the coven using the matching symbols and labels.'; break;
    case 'PLACE_TOKEN': {
      inScene('threshold'); requireRule(!state.threshold.opened, 'The coven is already seated.');
      requireRule(Number.isInteger(command.seat) && command.seat >= 0 && command.seat < COVEN.length, 'Choose a valid seat.');
      requireRule(command.token === null || COVEN.some(t => t.id === command.token), 'Choose a coven token.');
      state.threshold.placements = state.threshold.placements.map(token => token === command.token ? null : token);
      state.threshold.placements[command.seat] = command.token as RunState['threshold']['placements'][number]; message = 'Token placed. Match each specialty to its seat.'; break;
    }
    case 'MATCH_COVEN':
      inScene('threshold'); requireRule(COVEN.every((t, i) => state.threshold.placements[i] === t.id), 'A specialty is in the wrong seat. Read the token and seat labels.');
      state.threshold.opened = true; state.phase = state.puzzles.greenhouse.solved ? 'return' : 'road';
      addJournal(state, 'The coven opened the Road. Sharon’s gardening stamp was entirely valid.'); message = 'The trapdoor opens. The Road is waiting.'; break;
    case 'ENTER_SCENE':
      requireRule(SCENES.includes(command.scene) && canEnter(state, command.scene), 'That room is not available yet. Follow the next open path.');
      requireRule(command.scene !== 'account' || state.phase === 'signedIn', 'Use the cottage knocker to sign in.');
      state.currentScene = command.scene;
      if (command.scene !== 'account' && state.phase === 'signedIn') state.phase = 'return';
      if (command.scene === 'cottage' && source.currentScene === 'vision') state.cottageView = 'inside';
      else if (command.scene === 'cottage' && state.puzzles.greenhouse.solved) { state.phase = 'return'; state.cottageView = 'outside'; discover(state, 'road.returnSmoke'); }
      if (['cottage', 'garden'].includes(command.scene) && state.rememberEnabled && state.milestones.hasSignedInOnce) discover(state, 'rio.gardenRecognition');
      message = 'Your place on the Road is saved.'; break;
    case 'JUG': {
      inScene('kitchen'); unsolved('kitchen'); requireRule(JUG_MOVES.includes(command.move), 'Unknown jug operation.');
      const p = state.puzzles.kitchen, next = jugMove(p.volumes, command.move);
      requireRule(next.some((n, i) => n !== p.volumes[i]), 'That would leave both quantities unchanged.');
      p.history = history(p.history, p.volumes); p.volumes = next; p.solved = next[1] === 4;
      if (command.move.startsWith('pour')) { p.pours++; if (p.pours >= 3) discover(state, 'jen.pumpkinWitness'); }
      message = `${next[0]} cups in the small jug; ${next[1]} in the large jug.`;
      if (p.solved) { addJournal(state, 'Jen’s recovery seal. Four cups measured; listen to Track Four in Alice’s studio.'); message += ' Exactly four. Recovery seal earned; take Track Four.'; } break;
    }
    case 'DIAL_CODE':
      inScene('studio'); unsolved('studio'); requireRule(/^\d{2}$/.test(command.code), 'Dial exactly two digits, from 00 to 99.');
      state.puzzles.studio.attempt = command.code;
      if (studioMatches(Number(command.code))) { state.puzzles.studio.solved = true; discover(state, 'alice.protectionRefrain'); addJournal(state, 'Alice’s verification seal. The recording number satisfies all three remainders.'); message = 'The recording resolves. Verification seal earned.'; }
      else message = 'That number misses a rhythm. Check the printed remainder strips.'; break;
    case 'SET_CHANNEL':
      inScene('studio'); requireRule(Number.isInteger(command.index) && command.index >= 0 && command.index < 3 && typeof command.enabled === 'boolean', 'Choose one of the three mixer channels.');
      state.puzzles.studio.channels[command.index] = command.enabled; message = `Channel ${command.index + 1} ${command.enabled ? 'open' : 'closed'}. The printed lyric strip remains available.`; break;
    case 'TOGGLE_SPEAKERS':
      inScene('studio'); state.puzzles.studio.speakersOpen = !state.puzzles.studio.speakersOpen; discover(state, 'volume.speakerDoors');
      message = state.puzzles.studio.speakersOpen ? 'The cabinet speakers open. Master mute still has the last word.' : 'The speaker doors close; the in-room music softens.'; break;
    case 'REVERSE_RECORD':
      inScene('studio'); state.puzzles.studio.reversed = !state.puzzles.studio.reversed;
      if (state.puzzles.studio.reversed) discover(state, 'alice.backwardRecord');
      message = state.puzzles.studio.reversed ? 'The groove runs backwards. An orange spark leans against the music.' : 'The record turns forward again.'; break;
    case 'KITCHEN_TIMER':
      inScene('kitchen'); state.puzzles.kitchen.timerDismissed = true; discover(state, 'jen.timerMitt');
      message = 'The oven timer rings. An oven mitt switches it off. Jen: “We are not doing deadlines today.” Your quantities are unchanged.'; break;
    case 'TOGGLE_LAMP': {
      inScene('cabin'); unsolved('cabin'); requireRule(Number.isInteger(command.index) && command.index >= 0 && command.index < 4, 'Choose lamp A, B, C or D.');
      const p = state.puzzles.cabin; p.history = history(p.history, p.lamps); p.lamps[command.index] ^= 1; message = `Lamp ${'ABCD'[command.index]} is ${p.lamps[command.index] ? 'lit' : 'unlit'}.`; break;
    }
    case 'CHECK_LAMPS':
      inScene('cabin'); unsolved('cabin');
      if (cabinMatches(state.puzzles.cabin.lamps)) { state.puzzles.cabin.solved = true; addJournal(state, 'The spirits agree. Human verification seal earned.'); message = 'All four statements hold. The spirits reluctantly accept you.'; }
      else { state.puzzles.cabin.shadowSeen = true; discover(state, 'evanora.possession'); message = 'The spirits disagree. A shadow lifts its hand while Agatha keeps hers folded. Your lamps stay as you set them.'; } break;
    case 'REVEAL_MEMORY': {
      inScene('tower'); const memory = MEMORIES.find(item => item.id === command.memory); requireRule(memory, 'Choose one of Lilia’s four memories.');
      if (!state.puzzles.tower.memories.includes(memory.id)) state.puzzles.tower.memories.push(memory.id);
      message = `${memory.time} · ${memory.text}`; addJournal(state, message); break;
    }
    case 'MOVE_DECK': {
      inScene('tower'); unsolved('tower'); const p = state.puzzles.tower;
      requireRule(p.stage === 'arranging' && ['cut', 'quarrel'].includes(command.move), 'The first arrangement is already set. Confirm from the opposite seat.');
      p.history = history(p.history, p.deck); p.deck = command.move === 'cut' ? cut(p.deck) : quarrel(p.deck); message = command.move === 'cut' ? 'First card moved to the end.' : 'The first two cards have had a quarrel.'; break;
    }
    case 'SUBMIT_DECK':
      inScene('tower'); unsolved('tower'); requireRule(state.puzzles.tower.stage === 'arranging', 'Confirm from the other seat.');
      requireRule(towerMatches(state.puzzles.tower.deck), 'This arrangement does not satisfy all four memories. Your cards stay in place.');
      state.puzzles.tower.stage = 'confirming';
      message = 'The opposite chair slides out. Confirm the sequence as seen from that seat. The table nick marks the same physical end.'; break;
    case 'PICK_CONFIRM': {
      inScene('tower'); unsolved('tower'); const p = state.puzzles.tower;
      requireRule(p.stage === 'confirming' && CARDS.includes(command.card) && !p.confirmation.includes(command.card), 'Choose an unused card from the opposite seat.');
      p.confirmation.push(command.card); message = `${p.confirmation.length} of 5 confirmation cards selected.`; break;
    }
    case 'CLEAR_CONFIRM': inScene('tower'); unsolved('tower'); state.puzzles.tower.confirmation = []; message = 'Confirmation cleared; the first arrangement is preserved.'; break;
    case 'CONFIRM_DECK': {
      inScene('tower'); unsolved('tower'); const p = state.puzzles.tower;
      requireRule(p.stage === 'confirming' && confirmationMatches(p.confirmation, p.deck), 'That is not the order from the opposite seat. Clear the confirmation and look from the other end.');
      p.solved = true; discover(state, 'lilia.towerInversion'); addJournal(state, 'Lilia’s ritual password set and confirmed from the opposite seat.'); message = 'The tower seems to turn around its still table. You remember both perspectives. Password seal earned.'; break;
    }
    case 'TRACE_VINE':
    case 'TRACE_VINE_PATH': {
      inScene('greenhouse'); unsolved('greenhouse'); const p = state.puzzles.greenhouse;
      const nodes = command.type === 'TRACE_VINE' ? [command.node] : command.nodes;
      if (command.type === 'TRACE_VINE_PATH') requireRule(command.revision === source.revision, 'The route changed while you were drawing. Begin a new stroke from the current stone.');
      requireRule(Array.isArray(nodes) && nodes.length > 0 && nodes.length <= 7, 'Trace at least one and at most seven vines.');
      for (const node of nodes) { requireRule(vineChoices(p.route).includes(node), 'Choose an adjacent stone along an unused vine.'); p.route.push(node); }
      p.solved = greenhouseMatches(p.route); message = `${p.route.length - 1} of 7 clauses signed.`;
      if (p.solved) { addJournal(state, 'Rio’s terms signed. Every vine once, Seed to Bloom. Five seals complete; return to the cottage.'); message = 'A flower opens. Terms seal earned. The cottage is waiting for you.'; } break;
    }
    case 'TOGGLE_MUSHROOM': {
      inScene('garden'); unsolved('garden'); requireRule(Number.isInteger(command.index) && command.index >= 0 && command.index < 8, 'Choose one of the eight caps.');
      const p = state.puzzles.garden; p.history = history(p.history, p.lights); p.lights = toggleMushroom(p.lights, command.index);
      p.solved = p.lights.every(Boolean); if (p.solved) state.rememberEnabled = true;
      message = p.solved ? 'The garden will remember this completed journey after your first sign-in.' : 'The cap and its two neighbors change. This garden is optional.'; break;
    }
    case 'UNDO': {
      const scene = state.currentScene;
      if (scene === 'kitchen') { unsolved(scene); const p = state.puzzles.kitchen; requireRule(p.history.length, 'No jug move to undo.'); p.volumes = p.history.pop()!; }
      else if (scene === 'cabin') { unsolved(scene); const p = state.puzzles.cabin; requireRule(p.history.length, 'No lamp move to undo.'); p.lamps = p.history.pop()!; }
      else if (scene === 'tower') { unsolved(scene); const p = state.puzzles.tower; requireRule(p.stage === 'arranging' && p.history.length, 'No arranging move to undo. The submitted deck stays set.'); p.deck = p.history.pop()!; }
      else if (scene === 'greenhouse') { unsolved(scene); requireRule(state.puzzles.greenhouse.route.length > 1, 'You are already at Seed.'); state.puzzles.greenhouse.route.pop(); }
      else if (scene === 'garden') { unsolved(scene); const p = state.puzzles.garden; requireRule(p.history.length, 'No cap move to undo.'); p.lights = p.history.pop()!; }
      else throw new RuleError('This room has no move to undo.');
      message = 'Last move undone. Previously earned seals remain safe.'; break;
    }
    case 'RESET_PUZZLE': {
      const scene = state.currentScene; requireRule([...TRIALS, 'garden'].includes(scene), 'Choose a puzzle first.'); unsolved(scene as Trial | 'garden');
      if (scene === 'kitchen') Object.assign(state.puzzles.kitchen, { volumes: [0, 0], history: [] });
      if (scene === 'studio') state.puzzles.studio.attempt = '';
      if (scene === 'cabin') Object.assign(state.puzzles.cabin, { lamps: [0, 0, 0, 0], history: [] });
      if (scene === 'tower') Object.assign(state.puzzles.tower, { deck: ['Key', 'Door', 'Cup', 'Tower', 'Moon'], stage: 'arranging', confirmation: [], history: [] });
      if (scene === 'greenhouse') state.puzzles.greenhouse.route = ['C'];
      if (scene === 'garden') Object.assign(state.puzzles.garden, { lights: [true, false, false, false, true, false, false, false], history: [] });
      message = 'Only this unsolved puzzle has been reset.'; break;
    }
    case 'UNBIND':
      inScene('cottage'); requireRule(TRIALS.every(id => state.puzzles[id].solved), 'Bring back all five trial seals first.');
      state.milestones.unbindingCompleted = true; discover(state, 'agatha.unbinding'); addJournal(state, 'Your five stitches replace Agatha’s thread. The cottage knocker is yours to use.'); message = 'The stitch loosens. The knocker is yours to use.'; break;
    case 'SIGN_IN':
      inScene('cottage'); requireRule(canSignIn(state), missingSignIn(state));
      state.currentScene = 'account'; state.phase = 'signedIn'; state.milestones.hasSignedInOnce = true; state.encounters.sessionExpired = false;
      message = source.encounters.sessionExpired ? 'Session resumed. Your seals and borrowing record are here.' : 'Signed in. Your library account is open.'; break;
    case 'SIGN_OUT':
    case 'EXPIRE_SESSION':
      inScene('account'); state.phase = 'return'; state.currentScene = 'cottage'; state.cottageView = 'outside';
      if (state.rememberEnabled) discover(state, 'rio.gardenRecognition');
      state.encounters.sessionExpired = command.type === 'EXPIRE_SESSION';
      if (state.encounters.sessionExpired) discover(state, 'rio.sessionFlower');
      message = state.encounters.sessionExpired ? 'Rio sets down a red flower. “Your session expired. Your progress is still here.”' : 'Signed out. Your completed trials remain saved.'; break;
    case 'RENEW_BOOK':
      inScene('account'); requireRule(state.phase === 'signedIn', 'Sign in first.'); state.milestones.bookRenewed = true; discover(state, 'library.longReceipt'); addJournal(state, 'Renewal accepted. The receipt retraces the five rooms of the Road. Another 28 fictional days.'); message = 'Renewed for another 28 fictional days. No late fees on the Road.'; break;
    case 'REMEMBER_ME':
      inScene('garden'); requireRule(state.puzzles.garden.solved, 'Light all eight caps first.'); state.rememberEnabled = true;
      if (state.milestones.hasSignedInOnce) discover(state, 'rio.gardenRecognition'); message = 'The garden remembers this journey again.'; break;
    case 'FORGET_ME': state.rememberEnabled = false; message = 'Recognition disabled. Your garden and completed trials remain saved.'; break;
    default: throw new RuleError('Unknown command.');
  }
  if (JSON.stringify(state) === JSON.stringify(source)) return { state: source, message };
  state.revision++; state.statistics.moves++;
  return { state: runSchema.parse(state), message };
}

export function missingSignIn(run: RunState): string {
  if (!run.arrival.aliasStamped) return 'Stamp a fictional borrowing alias first.';
  const missing = TRIALS.find(id => !run.puzzles[id].solved);
  if (missing) return `The ${missing} trial still needs its seal.`;
  return 'All five seals are here. Unbind the visible door stitch, then use the knocker.';
}
