import type { RunState } from '../game/state';
import { CARDS, type Card } from '../puzzles/rules';

export const TAROT_MEMORIES = ['Tower immediately follows Moon.', 'Exactly two cards separate Moon and Door.', 'Cup precedes Key.', 'Key precedes Door.'] as const;
export const CAP_POSITIONS = Array.from({length:8},(_,index)=>{
  const angle=index*Math.PI/4-Math.PI/2;
  return {x:50+Math.cos(angle)*37,y:50+Math.sin(angle)*35};
});
export function capNeighbours(index:number){return[(index+7)%8,index,(index+1)%8];}
/** Confirmation never reads the canonical deck, including in the closed-room preview. */
export function visibleTableCards(tower:RunState['puzzles']['tower']):(Card|null)[]{
  return tower.stage==='arranging'?[...tower.deck]:Array.from({length:5},(_,index)=>tower.confirmation[index]??null);
}
export function confirmationChoices(tower:RunState['puzzles']['tower']){
  return CARDS.map(card=>({card,disabled:tower.stage!=='confirming'||tower.solved||tower.confirmation.includes(card)}));
}
