import { describe, expect, it } from 'vitest';
import { COVEN } from '../../src/content/scenes';
import { applyCommand } from '../../src/game/commands';
import { acceptedPour, COVEN_SEATS, INSTRUMENTS, instrumentFrame, isInstrumentScene, jugActions, pourStream, VESSELS, VESSEL_VIEW } from '../../src/world/instruments';
import { move, throughTrial } from '../helpers';

describe('instrument geometry and command boundaries', () => {
  it.each([[360,640],[390,844],[844,390],[768,1024],[1280,720],[2560,1080]])('keeps approached and idle planes inside a %s × %s viewport', (width,height) => {
    for (const expanded of [true,false]) {
      const box=instrumentFrame(width,height,expanded);
      expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.y+box.height).toBeLessThanOrEqual(height-80);
      expect(box.width).toBeGreaterThan(expanded?240:200);expect(box.height).toBeGreaterThan(100);
      if(!expanded)expect(box.y+box.height+26).toBeLessThanOrEqual(height-100);
    }
    const content=instrumentFrame(width,height,true).width-(width<=720?32:52);
    for(const vessel of VESSELS){
      expect(vessel.width/VESSEL_VIEW.width*content).toBeGreaterThanOrEqual(44);
      expect(vessel.height/VESSEL_VIEW.width*content).toBeGreaterThanOrEqual(44);
      expect(vessel.x).toBeGreaterThanOrEqual(VESSEL_VIEW.x);expect(vessel.x+vessel.width).toBeLessThanOrEqual(VESSEL_VIEW.x+VESSEL_VIEW.width);
    }
  });
  it('defines the seven earlier working objects and Vision’s bench, with distinct coven seats',()=>{
    expect(Object.keys(INSTRUMENTS)).toEqual(['threshold','kitchen','studio','cabin','tower','greenhouse','garden','vision']);
    expect(['cottage','account'].some(scene=>isInstrumentScene(scene as 'cottage'))).toBe(false);
    expect(COVEN_SEATS).toHaveLength(COVEN.length);expect(new Set(COVEN_SEATS.map(p=>`${p.x},${p.y}`)).size).toBe(5);
    for(const seat of COVEN_SEATS){expect(seat.x).toBeGreaterThanOrEqual(16);expect(seat.x).toBeLessThanOrEqual(84);expect(seat.y).toBeGreaterThanOrEqual(10);expect(seat.y).toBeLessThanOrEqual(85);}
  });
  it('enables precisely the legal domain operations for both selected vessels at every bounded quantity',()=>{
    for(let small=0;small<=3;small++)for(let large=0;large<=5;large++){
      const run=throughTrial('kitchen');run.puzzles.kitchen.volumes=[small,large];run.puzzles.kitchen.solved=large===4;
      const before=JSON.stringify(run);
      for(const selected of [0,1]as const)for(const action of jugActions(run.puzzles.kitchen.volumes,selected,run.puzzles.kitchen.solved)){
        expect(action.move.endsWith(selected?'large':'small')).toBe(true);
        if(action.disabled) expect(()=>applyCommand(run,{type:'JUG',move:action.move})).toThrow();
        else {const result=applyCommand(run,{type:'JUG',move:action.move});
          expect(result.state).not.toBe(run);
          expect(result.state.puzzles.kitchen.volumes[0]).toBeGreaterThanOrEqual(0);expect(result.state.puzzles.kitchen.volumes[0]).toBeLessThanOrEqual(3);
          expect(result.state.puzzles.kitchen.volumes[1]).toBeGreaterThanOrEqual(0);expect(result.state.puzzles.kitchen.volumes[1]).toBeLessThanOrEqual(5);
        }
      }
      expect(JSON.stringify(run)).toBe(before);
    }
  });
  it('animates only the amount actually transferred by an accepted maximal pour',()=>{
    const before=move(throughTrial('kitchen'),{type:'JUG',move:'fill-large'}),after=move(before,{type:'JUG',move:'pour-large'});
    expect(acceptedPour(before,after,{type:'JUG',move:'pour-large'})).toEqual({move:'pour-large',amount:3,revision:after.revision});
    expect(pourStream('pour-large')).not.toBe(pourStream('pour-small'));
    const small=move(throughTrial('kitchen'),{type:'JUG',move:'fill-small'}),poured=move(small,{type:'JUG',move:'pour-small'});
    expect(acceptedPour(small,poured,{type:'JUG',move:'pour-small'})?.amount).toBe(3);
  });
  it('rejects cue replay for imports, foreign saves, unchanged and rejected operations, and room changes',()=>{
    const before=move(throughTrial('kitchen'),{type:'JUG',move:'fill-large'}),after=move(before,{type:'JUG',move:'pour-large'}),command={type:'JUG',move:'pour-large'}as const;
    expect(acceptedPour(before,after,null)).toBeNull();expect(acceptedPour(after,after,command)).toBeNull();
    expect(acceptedPour(before,{...after,runId:crypto.randomUUID()},command)).toBeNull();
    expect(acceptedPour({...before,currentScene:'studio'},after,command)).toBeNull();
    expect(acceptedPour(before,{...after,currentScene:'studio'},command)).toBeNull();
    expect(()=>move(before,{type:'JUG',move:'fill-large'})).toThrow();expect(acceptedPour(before,before,command)).toBeNull();
    expect(acceptedPour(before,after,{type:'SET_CHANNEL',index:0,enabled:true})).toBeNull();
  });
});
