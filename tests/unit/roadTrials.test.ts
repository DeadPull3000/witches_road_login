import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createRun } from '../../src/game/state';
import { CARDS, toggleMushroom, towerSolution } from '../../src/puzzles/rules';
import { CAP_POSITIONS, capNeighbours, confirmationChoices, visibleTableCards } from '../../src/world/trialLayout';
import { GARDEN_ASSETS, worldLayout } from '../../src/world/layout';
import { instrumentFrame } from '../../src/world/instruments';
import { move, throughTrial } from '../helpers';

describe('the physical Road trials preserve their puzzle contract',()=>{
  it('never exposes the canonical deck from the opposite seat or its idle preview',()=>{
    let run=throughTrial('tower');for(const action of towerSolution(run.puzzles.tower.deck))run=move(run,{type:'MOVE_DECK',move:action});
    expect(visibleTableCards(run.puzzles.tower)).toEqual([...CARDS]);
    run=move(run,{type:'SUBMIT_DECK'});expect(visibleTableCards(run.puzzles.tower)).toEqual([null,null,null,null,null]);
    run=move(run,{type:'PICK_CONFIRM',card:'Door'});expect(visibleTableCards(run.puzzles.tower)).toEqual(['Door',null,null,null,null]);
    const changed={...run.puzzles.tower,deck:[...run.puzzles.tower.deck].reverse()};expect(visibleTableCards(changed)).toEqual(visibleTableCards(run.puzzles.tower));
    const visible=visibleTableCards(run.puzzles.tower);visible[0]='Cup';expect(run.puzzles.tower.confirmation).toEqual(['Door']);
  });
  it('keeps card choices unique and locks them after accepted confirmation',()=>{
    let run=throughTrial('tower');expect(confirmationChoices(run.puzzles.tower).every(choice=>choice.disabled)).toBe(true);
    for(const action of towerSolution(run.puzzles.tower.deck))run=move(run,{type:'MOVE_DECK',move:action});run=move(run,{type:'SUBMIT_DECK'});
    for(const card of [...CARDS].reverse()){
      const choices=confirmationChoices(run.puzzles.tower);expect(choices.filter(c=>c.disabled).map(c=>c.card)).toEqual(CARDS.filter(c=>run.puzzles.tower.confirmation.includes(c)));
      expect(choices.find(c=>c.card===card)?.disabled).toBe(false);run=move(run,{type:'PICK_CONFIRM',card});
    }
    run=move(run,{type:'CONFIRM_DECK'});expect(run.puzzles.tower.solved).toBe(true);expect(confirmationChoices(run.puzzles.tower).every(choice=>choice.disabled)).toBe(true);
  });
  it('describes precisely the affected caps for all eight operations in all 256 ring states',()=>{
    for(let mask=0;mask<256;mask++)for(let index=0;index<8;index++){
      const lights=Array.from({length:8},(_,i)=>!!(mask&(1<<i))),changed=toggleMushroom(lights,index),neighbours=capNeighbours(index);
      expect(new Set(neighbours).size).toBe(3);
      expect(changed.map((value,i)=>value!==lights[i]?i:-1).filter(i=>i>=0)).toEqual([...neighbours].sort((a,b)=>a-b));
      expect(toggleMushroom(changed,index)).toEqual(lights);
    }
  });
  it('places the eight numbered caps clockwise without overlapping their mobile targets',()=>{
    expect(CAP_POSITIONS).toHaveLength(8);expect(CAP_POSITIONS[0].x).toBeCloseTo(50);expect(CAP_POSITIONS[0].y).toBeCloseTo(15);
    for(let index=0;index<8;index++){
      const a=CAP_POSITIONS[index],b=CAP_POSITIONS[(index+1)%8];expect(a.x).toBeGreaterThanOrEqual(13);expect(a.x).toBeLessThanOrEqual(87);expect(a.y).toBeGreaterThanOrEqual(15);expect(a.y).toBeLessThanOrEqual(85);
      expect(Math.hypot((a.x-b.x)*2.56,(a.y-b.y)*3.35)).toBeGreaterThan(68);
    }
  });
});

describe('authored full-screen garden profiles',()=>{
  it.each([[360,640],[390,844],[768,1024],[844,390],[1280,800],[2560,1080]])('covers %s × %s uniformly and keeps the idle ring above the satchel', (width,height)=>{
    const run={...createRun(),currentScene:'garden' as const},l=worldLayout(run,width,height),asset=GARDEN_ASSETS[l.profile],b=l.backgroundRect;
    expect(l.background).toBe(asset.url);expect(l.character).toBeNull();expect(b.width/b.height).toBeCloseTo(asset.width/asset.height,8);
    expect(b.x).toBeLessThanOrEqual(.001);expect(b.y).toBeLessThanOrEqual(.001);expect(b.x+b.width).toBeGreaterThanOrEqual(width-.001);expect(b.y+b.height).toBeGreaterThanOrEqual(height-.001);
    const ring=instrumentFrame(width,height,false,'garden');expect(ring.y+ring.height+26).toBeLessThanOrEqual(height-100);
  });
  it('packages independent wide and tall paintings with smaller lossless runtime files',()=>{
    for(const [profile,asset]of Object.entries(GARDEN_ASSETS)){
      const file=profile==='landscape'?'garden-moonrise-wide':'garden-moonrise-tall',source=readFileSync(new URL(`../../public/assets/garden/${file}.png`,import.meta.url)),runtime=readFileSync(new URL(`../../public/assets/garden/${file}.webp`,import.meta.url));
      expect(source.readUInt32BE(16)).toBe(asset.width);expect(source.readUInt32BE(20)).toBe(asset.height);expect(runtime.subarray(0,4).toString()).toBe('RIFF');expect(runtime.subarray(8,12).toString()).toBe('WEBP');expect(runtime.length).toBeLessThan(source.length);expect(runtime.length).toBeLessThan(2_500_000);
    }
  });
});
