import { expect, test, type Page } from '@playwright/test';
import { CARDS, towerSolution } from '../../src/puzzles/rules';
import { VINE_POSITIONS, type Point } from '../../src/content/vines';
import type { RunState } from '../../src/game/state';
import { INSTRUMENTS } from '../../src/world/instruments';
import { move, throughTrial } from '../helpers';
import { openRoad, reloadRoad, returnToRoom, travelViaMap } from './support';

async function importTrial(page:Page,run:RunState){
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByLabel('Import a saved journey').setInputFiles({name:'trial.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(run))});
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');await expect(page.getByTestId('instrument-stage')).toHaveAttribute('data-expanded','true');
}
const saved=(page:Page)=>expect(page.getByTestId('save-status')).toContainText('saved in this browser');
async function frameWorking(page:Page,selector:string){await page.locator(selector).evaluate(el=>{const stage=el.closest('.instrument-stage')!;stage.scrollTop+=el.getBoundingClientRect().top-stage.getBoundingClientRect().top-90;});}
async function point(page:Page,value:Point){return page.getByTestId('vine-map').evaluate((svg,coordinates)=>{const p=new DOMPoint(...coordinates).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);return{x:p.x,y:p.y};},[...value]);}
async function pointer(page:Page,type:string,node:keyof typeof VINE_POSITIONS,buttons=1){const p=await point(page,VINE_POSITIONS[node]);await page.getByTestId('vine-map').dispatchEvent(type,{clientX:p.x,clientY:p.y,pointerId:42,pointerType:'touch',isPrimary:true,button:0,buttons});}
const garden=()=>move(throughTrial('greenhouse'),{type:'ENTER_SCENE',scene:'garden'});

test('the opposite chair accepts only a legal arrangement and its closed table never leaks the answer',async({page},testInfo)=>{
  test.setTimeout(60_000);await openRoad(page);const run=throughTrial('tower');await importTrial(page,run);
  await expect(page.getByRole('list',{name:'Four card memories'}).getByRole('listitem')).toHaveCount(4);
  await page.getByRole('button',{name:'Set the arrangement',exact:true}).click();await expect(page.getByTestId('tarot-table')).toHaveAttribute('data-seat','first');await expect(page.getByTestId('feedback')).toContainText('memories');
  for(const action of towerSolution(run.puzzles.tower.deck)){const button=page.getByRole('button',{name:action.toUpperCase(),exact:true});await button.focus();await button.press('Enter');}
  await expect(page.getByLabel('Current card order').locator('b')).toHaveText([...CARDS]);await frameWorking(page,'.lilia-table-assembly');await page.screenshot({path:testInfo.outputPath('lilia-table-working.png'),fullPage:true});
  await page.getByRole('button',{name:'Set the arrangement',exact:true}).click();await expect(page.getByTestId('tarot-table')).toHaveAttribute('data-seat','opposite');await expect(page.getByLabel('Permanent table nick · right edge')).toBeVisible();await expect(page.getByLabel('Current card order')).toHaveCount(0);
  await page.getByRole('button',{name:INSTRUMENTS.tower.close,exact:true}).click();await expect(page.locator('.road-trial-still .preview-card-face')).toHaveCount(0);await expect(page.locator('.road-trial-still .preview-card-back')).toHaveCount(5);await page.screenshot({path:testInfo.outputPath('lilia-table-world.png'),fullPage:true});
  await page.getByRole('button',{name:INSTRUMENTS.tower.approach,exact:true}).press('Enter');await page.getByRole('button',{name:'Door',exact:true}).press('Space');await saved(page);await reloadRoad(page);await expect(page.getByRole('button',{name:'Door',exact:true})).toBeDisabled();await expect(page.locator('.card-back')).toHaveCount(4);
  for(const card of ['Key','Tower','Moon','Cup'])await page.getByRole('button',{name:card,exact:true}).click();await page.getByRole('button',{name:'Confirm password',exact:true}).click();await expect(page.getByRole('button',{name:/Continue to Rio/})).toBeVisible();await saved(page);await reloadRoad(page);await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish','none');await page.screenshot({path:testInfo.outputPath('lilia-seal.png'),fullPage:true});
});

test('named stones share the drawing plane and keyboard moves still work immediately after a real stroke',async({page},testInfo)=>{
  test.setTimeout(60_000);await openRoad(page);await importTrial(page,throughTrial('greenhouse'));await page.getByTestId('vine-map').scrollIntoViewIfNeeded();
  const targets=await page.locator('.vine-working-plane').evaluate((plane,positions)=>{const matrix=plane.querySelector('svg')!.getScreenCTM()!;return Object.entries(positions).map(([node,position])=>{const expected=new DOMPoint(...position).matrixTransform(matrix),b=plane.querySelector(`[data-stone="${node}"]`)!.getBoundingClientRect();return{cx:b.x+b.width/2,cy:b.y+b.height/2,x:expected.x,y:expected.y,width:b.width,height:b.height};});},VINE_POSITIONS);
  for(const box of targets){expect(box.cx).toBeCloseTo(box.x,0);expect(box.cy).toBeCloseTo(box.y,0);expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  const from=await point(page,VINE_POSITIONS.C),to=await point(page,VINE_POSITIONS.D);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:12});await page.mouse.up();await expect(page.getByTestId('vine-route')).toHaveText('C Seed → D Bloom');
  const next=page.getByRole('button',{name:'Follow to A · Memory',exact:true});await next.focus();await next.press('Space');await expect(page.getByTestId('vine-route')).toHaveText('C Seed → D Bloom → A Memory');await page.getByRole('button',{name:'↶ Undo last move',exact:true}).click();await expect(page.getByTestId('vine-route')).toHaveText('C Seed → D Bloom');
  await frameWorking(page,'.vine-working-plane');await page.screenshot({path:testInfo.outputPath('rio-vine-working.png'),fullPage:true});await saved(page);await reloadRoad(page);await expect(page.getByTestId('vine-route')).toHaveText('C Seed → D Bloom');
  await page.getByRole('button',{name:'Reset this puzzle',exact:true}).click();for(const node of ['B','A','D','C','A','E','D']as const)await page.getByRole('button',{name:new RegExp(`^Follow to ${node} ·`)}).click();
  await expect(page.getByRole('button',{name:'Return to the cottage',exact:true})).toBeVisible();await expect(page.getByLabel('Rio’s red flower')).toBeVisible();for(const target of await page.locator('.vine-stone-target').all())await expect(target).toBeDisabled();await page.screenshot({path:testInfo.outputPath('rio-bloom.png'),fullPage:true});
});

test('resizing, menus, closing, scroll and a changed drawing transform all cancel an uncommitted vine stroke',async({page})=>{
  test.setTimeout(60_000);await openRoad(page);await importTrial(page,throughTrial('greenhouse'));const route=page.getByTestId('vine-route');
  const draft=async()=>{await page.getByTestId('vine-map').scrollIntoViewIfNeeded();await pointer(page,'pointerdown','C');await pointer(page,'pointermove','B');await expect(page.locator('.vine.draft')).toHaveCount(1);};
  const unchanged=async()=>{await pointer(page,'pointerup','B',0);await expect(route).toHaveText('C Seed');await expect(page.locator('.vine.draft')).toHaveCount(0);};
  await draft();const size=page.viewportSize()!;await page.setViewportSize({width:size.width-10,height:size.height-10});await unchanged();
  await draft();await page.getByRole('button',{name:'Notebook',exact:true}).click();await page.keyboard.press('Escape');await unchanged();
  await draft();await page.getByRole('button',{name:INSTRUMENTS.greenhouse.close,exact:true}).click();await page.getByRole('button',{name:INSTRUMENTS.greenhouse.approach,exact:true}).click();await unchanged();
  await draft();await page.getByTestId('instrument-stage').evaluate(el=>el.dispatchEvent(new Event('scroll')));await unchanged();
  await draft();await page.getByTestId('vine-map').evaluate(el=>(el as SVGSVGElement).style.transform='translateX(3px)');await unchanged();await page.getByTestId('vine-map').evaluate(el=>(el as SVGSVGElement).style.transform='');
  await draft();await pointer(page,'lostpointercapture','B');await unchanged();
  await draft();await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await unchanged();
  await page.getByRole('button',{name:'Follow to A · Memory',exact:true}).click();await expect(route).toHaveText('C Seed → A Memory');await saved(page);await reloadRoad(page);await expect(route).toHaveText('C Seed → A Memory');
});

test('numbered caps preserve neighbor previews, undo, reload and optional recognition through their ring',async({page},testInfo)=>{
  test.setTimeout(60_000);await openRoad(page);await importTrial(page,garden());const cap=(n:number)=>page.getByRole('button',{name:new RegExp(`^Cap ${n}:`)});
  await cap(1).focus();await expect(page.locator('.cap-preview')).toHaveText('Cap 1 changes caps 8, 1 and 2.');await cap(3).focus();await expect(page.locator('.cap-preview')).toHaveText('Cap 3 changes caps 2, 3 and 4.');await cap(3).press('Space');
  await expect.poll(()=>page.locator('.remembering-cap').evaluateAll(elements=>elements.map(el=>el.getAttribute('aria-pressed')))).toEqual(['true','true','true','true','true','false','false','false']);
  await page.getByRole('button',{name:'↶ Undo last move',exact:true}).click();await expect(cap(3)).toHaveAttribute('aria-pressed','false');await cap(3).click();await saved(page);await reloadRoad(page);await expect(cap(3)).toHaveAttribute('aria-pressed','true');
  await cap(7).click();await expect(page.getByText(/The garden remembers\./)).toBeVisible();expect(await page.locator('.remembering-cap').evaluateAll(elements=>elements.map(el=>({lit:el.getAttribute('aria-pressed'),disabled:(el as HTMLButtonElement).disabled})))).toEqual(Array.from({length:8},()=>({lit:'true',disabled:true})));
  await page.getByRole('button',{name:'Forget me',exact:true}).click();await page.getByRole('button',{name:'Remember this journey again',exact:true}).click();await saved(page);await page.getByRole('button',{name:INSTRUMENTS.garden.close,exact:true}).click();await page.screenshot({path:testInfo.outputPath('garden-ring-world.png'),fullPage:true});
  await page.getByRole('button',{name:INSTRUMENTS.garden.approach,exact:true}).click();await frameWorking(page,'.remembering-ring');await page.screenshot({path:testInfo.outputPath('garden-ring-lit.png'),fullPage:true});await page.getByRole('button',{name:'Return to cottage',exact:true}).click();await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-scene','cottage');
});

test('all three working objects reframe without extra worlds, unreachable controls or page overflow',async({page},testInfo)=>{
  test.setTimeout(90_000);await page.addInitScript(()=>{const Original=window.AudioContext,root=window as unknown as{audioContexts:number};root.audioContexts=0;window.AudioContext=class extends Original{constructor(options?:AudioContextOptions){super(options);root.audioContexts++;}};});await openRoad(page);await importTrial(page,throughTrial('greenhouse'));await page.locator('canvas').evaluate(el=>el.setAttribute('data-i4','original'));
  const sizes=testInfo.project.name==='chromium'?[[1280,800],[844,390]]:[[390,844],[360,640]];
  for(const [width,height]of sizes){await page.setViewportSize({width,height});for(const [scene,name]of [['tower',/Lilia’s tower/],['greenhouse',/Rio’s greenhouse/],['garden',/Remember me garden/]]as const){
    await travelViaMap(page,name);const stage=page.getByTestId('instrument-stage');await expect(stage).toHaveAttribute('data-instrument',scene);const b=(await stage.boundingBox())!;expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(height-90);expect(await stage.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    for(const target of await stage.locator('button:visible').evaluateAll(elements=>elements.map(el=>{const b=el.getBoundingClientRect();return{width:b.width,height:b.height};}))){expect(target.width).toBeGreaterThanOrEqual(43.5);expect(target.height).toBeGreaterThanOrEqual(43.5);}
    await page.getByRole('button',{name:INSTRUMENTS[scene].close,exact:true}).click();await expect(page.getByRole('button',{name:INSTRUMENTS[scene].approach,exact:true})).toBeInViewport();if(width===sizes[0][0])await page.screenshot({path:testInfo.outputPath(`${scene}-idle.png`),fullPage:true});
    await expect(page.locator('canvas')).toHaveAttribute('data-i4','original');await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state','playing');expect(await page.evaluate(()=>({x:scrollX,y:scrollY,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight}))).toEqual({x:0,y:0,overflow:false});
  }}
  expect(await page.evaluate(()=>(window as unknown as{audioContexts:number}).audioContexts)).toBe(1);await expect(page.getByRole('button',{name:/hint|suggested/i})).toHaveCount(0);await expect(page.locator('.mushroom-ring')).toHaveCount(0);
});

test('the last three trials remain playable with missing textures and large text',async({page})=>{
  test.setTimeout(60_000);await page.route('**/assets/**',route=>route.abort());await openRoad(page);await importTrial(page,throughTrial('greenhouse'));await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('combobox',{name:'Text size',exact:true}).selectOption('large');await page.getByRole('button',{name:'Close panel',exact:true}).click();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer','fallback');await page.getByRole('button',{name:'Follow to A · Memory',exact:true}).press('Enter');await expect(page.getByTestId('vine-route')).toHaveText('C Seed → A Memory');
  await travelViaMap(page,/Remember me garden/);await page.getByRole('button',{name:'Cap 3: unlit',exact:true}).press('Space');await expect(page.getByRole('button',{name:'Cap 3: lit',exact:true})).toBeVisible();await saved(page);
  await importTrial(page,throughTrial('tower'));await page.getByRole('button',{name:'CUT',exact:true}).press('Enter');await expect(page.getByLabel('Current card order').locator('b')).toHaveText(['Door','Cup','Tower','Moon','Key']);await page.getByRole('button',{name:'Room objects',exact:true}).click();await expect(page.getByTestId('feedback')).toHaveCount(1);await returnToRoom(page);await expect(page.getByRole('list',{name:'Four card memories'})).toBeVisible();await saved(page);expect(await page.getByTestId('instrument-stage').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});
