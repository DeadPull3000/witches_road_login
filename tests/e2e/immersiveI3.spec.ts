import { expect, test, type Page } from '@playwright/test';
import { COVEN } from '../../src/content/scenes';
import { createRun, type RunState } from '../../src/game/state';
import { INSTRUMENTS, isInstrumentScene, VESSELS, VESSEL_VIEW } from '../../src/world/instruments';
import { move, throughTrial } from '../helpers';
import { jugAction, openRoad, reloadRoad, returnToRoom, travelViaMap } from './support';

async function importInstrument(page: Page, run: RunState) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Import a saved journey').setInputFiles({ name: 'instrument.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  if(isInstrumentScene(run.currentScene))await expect(page.getByTestId('instrument-stage')).toHaveAttribute('data-expanded', 'true');
}
const saved = (page: Page) => expect(page.getByTestId('save-status')).toContainText('saved in this browser');
async function contextCounter(page: Page) {
  await page.addInitScript(()=>{const Original=window.AudioContext,root=window as unknown as{audioContexts:number};root.audioContexts=0;window.AudioContext=class extends Original{constructor(options?:AudioContextOptions){super(options);root.audioContexts++;}};});
}

test('coven keepsakes move between unique floor seats, survive closing and reload, and open the guarded trapdoor',async({page},testInfo)=>{
  await openRoad(page);
  let run=createRun();for(const command of [{type:'STAMP_ALIAS',alias:'Circle Finch'},{type:'SUBMIT_ATTEMPTED_SPELL'},{type:'START_RECOVERY'}]as const)run=move(run,command);
  await importInstrument(page,run);const circle=page.getByRole('dialog',{name:INSTRUMENTS.threshold.title,exact:true});
  await expect(circle.getByRole('group',{name:'Coven tokens'}).getByRole('button')).toHaveCount(5);
  await page.getByRole('button',{name:'Jen · Potions token',exact:true}).click();await page.getByRole('button',{name:'Gardening seat',exact:true}).click();
  await expect(page.getByRole('button',{name:'Gardening seat',exact:true})).toContainText('Jen');
  await page.getByRole('button',{name:'Open the trapdoor',exact:true}).click();await expect(page.getByTestId('feedback')).toContainText('wrong seat');
  await expect(page.getByRole('button',{name:'Enter Jen’s kitchen',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Potions seat',exact:true}).click();await expect(page.getByRole('button',{name:'Gardening seat',exact:true})).toContainText('Empty seat');
  await page.getByRole('button',{name:'Step back from the circle',exact:true}).click();const approach=page.getByRole('button',{name:'Approach the coven circle',exact:true});await expect(approach).toBeFocused();
  await approach.press('Enter');await expect(circle).toBeFocused();await expect(page.getByRole('button',{name:'Potions seat',exact:true})).toContainText('Jen');
  for(const token of COVEN.slice(1)){const button=page.getByRole('button',{name:`${token.name} · ${token.affinity} token`,exact:true});await button.focus();await button.press('Enter');await page.getByRole('button',{name:`${token.affinity} seat`,exact:true}).press('Enter');}
  await page.getByRole('button',{name:'Inspect leaf stamp'}).click();await expect(page.getByTestId('feedback')).toContainText('leaf stamp is valid');
  await saved(page);await reloadRoad(page);for(const token of COVEN)await expect(page.getByRole('button',{name:`${token.affinity} seat`,exact:true})).toContainText(token.name);
  await page.getByRole('group',{name:'Five coven seats',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath('coven-circle.png'),fullPage:true});
  await page.getByRole('button',{name:'Open the trapdoor',exact:true}).click();for(const token of COVEN)await expect(page.getByRole('button',{name:`${token.affinity} seat`,exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Enter Jen’s kitchen',exact:true}).click();await expect(page.getByTestId('instrument-stage')).toHaveAttribute('data-instrument','kitchen');
  await expect(page.locator('.coven-seats,.jug-display,.operation-grid')).toHaveCount(0);
});

test('the counter uses its vessel geometry, accepted quantities, source tools and an interruptible pour',async({page},testInfo)=>{
  await page.clock.install();await openRoad(page);await importInstrument(page,throughTrial('kitchen'));
  const plane=(await page.getByRole('group',{name:'Measuring vessels'}).boundingBox())!;
  for(const vessel of VESSELS){const bounds=(await page.getByRole('button',{name:`Select the ${vessel.capacity}-cup jug`,exact:true}).boundingBox())!;expect(bounds.x-plane.x).toBeCloseTo((vessel.x-VESSEL_VIEW.x)/VESSEL_VIEW.width*plane.width,0);expect(bounds.width).toBeGreaterThanOrEqual(44);expect(bounds.height).toBeGreaterThanOrEqual(44);}
  await jugAction(page,'Fill 5-cup jug');await expect(page.getByRole('button',{name:'Fill 5-cup jug',exact:true})).toBeDisabled();
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+5000));await jugAction(page,'Pour 5-cup into 3-cup');
  await expect(page.getByTestId('jug-5')).toHaveText('2 / 5 cups');await expect(page.getByTestId('jug-3')).toHaveText('3 / 3 cups');await expect(page.getByTestId('pour-stream')).toHaveAttribute('data-amount','3');
  await page.screenshot({path:testInfo.outputPath('kitchen-pour.png'),fullPage:true});await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByTestId('pour-stream')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.getByTestId('pour-stream')).toHaveCount(0);await page.clock.resume();
  await jugAction(page,'Empty 3-cup jug',true);await expect(page.getByTestId('jug-3')).toHaveText('0 / 3 cups');await page.getByRole('button',{name:'↶ Undo last move',exact:true}).click();await expect(page.getByTestId('jug-3')).toHaveText('3 / 3 cups');
  await saved(page);await reloadRoad(page);await expect(page.getByTestId('pour-stream')).toHaveCount(0);await expect(page.getByTestId('jug-5')).toHaveText('2 / 5 cups');
  for(const name of ['Empty 3-cup jug','Pour 5-cup into 3-cup','Fill 5-cup jug','Pour 5-cup into 3-cup'])await jugAction(page,name);
  await expect(page.getByTestId('jug-5')).toHaveText('4 / 5 cups');await expect(page.getByRole('button',{name:'Pour 5-cup into 3-cup',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Select the 3-cup jug',exact:true}).click();for(const name of ['Fill 3-cup jug','Empty 3-cup jug','Pour 3-cup into 5-cup'])await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();
  await expect(page.getByTestId('oven-chime')).toContainText('put the mitt away');await page.screenshot({path:testInfo.outputPath('kitchen-seal.png'),fullPage:true});
});

test('the recording desk retains its telephone draft through approach, menus and reframing while hardware follows the saved mix',async({page},testInfo)=>{
  await contextCounter(page);await openRoad(page);await importInstrument(page,throughTrial('studio'));const code=page.getByLabel('Two-digit recording number');await code.fill('17');
  await page.locator('canvas').evaluate(canvas=>canvas.setAttribute('data-i3','original'));await code.press('Escape');const approach=page.getByRole('button',{name:'Approach the recording desk',exact:true});await expect(approach).toBeFocused();await approach.press('Enter');await expect(code).toHaveValue('17');
  await page.getByRole('button',{name:'Room objects',exact:true}).click();await expect(page.getByTestId('feedback')).toHaveCount(1);await returnToRoom(page);await expect(code).toHaveValue('17');
  await page.screenshot({path:testInfo.outputPath('recording-mixer.png'),fullPage:true});
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('combobox',{name:'Text size',exact:true}).selectOption('large');
  const blocked=await page.getByRole('button',{name:'Close panel',exact:true}).evaluate(async button=>{(button as HTMLButtonElement).click();await Promise.resolve();return(document.getElementById('main') as HTMLElement).inert;});
  expect(blocked).toBe(false);await expect(code).toHaveValue('17');await code.fill('18');await expect(code).toHaveValue('18');
  await page.getByRole('button',{name:'Notebook',exact:true}).click();await page.keyboard.press('Escape');await code.fill('19');await expect(code).toHaveValue('19');
  await page.setViewportSize({width:390,height:640});await code.scrollIntoViewIfNeeded();await expect(code).toBeInViewport();await expect(code).toHaveValue('19');
  const channel=page.getByRole('button',{name:/CHANNEL 1/});await channel.focus();await channel.press('Space');await expect(channel).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Play the record backwards',exact:true}).click();await page.getByRole('button',{name:'Close the speaker doors',exact:true}).click();
  await expect(page.locator('.playback-state')).toContainText('backwards');await expect(page.locator('.playback-state')).toContainText('closed');
  await code.fill('22');await page.getByRole('button',{name:'Dial the number',exact:true}).click();await expect(page.getByTestId('feedback')).toContainText('misses a rhythm');await saved(page);await reloadRoad(page);
  await expect(code).toHaveValue('22');await expect(channel).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Play the record forwards',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Open the speaker doors',exact:true})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('recording-desk.png'),fullPage:true});await code.scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath('recording-telephone.png'),fullPage:true});await code.fill('23');await page.getByRole('button',{name:'Dial the number',exact:true}).click();await expect(page.getByRole('button',{name:/Continue to Agatha/})).toBeVisible();
  expect(await page.evaluate(()=>(window as unknown as{audioContexts:number}).audioContexts)).toBe(1);await expect(page.locator('canvas')).toHaveCount(1);expect(await page.evaluate(()=>scrollY)).toBe(0);await expect(page.getByRole('button',{name:/hint|suggested/i})).toHaveCount(0);
});

test('the four spirit lamps keep all statements readable and the planchette never awards progress for a failed check',async({page},testInfo)=>{
  await openRoad(page);await importInstrument(page,throughTrial('cabin'));await expect(page.getByRole('list',{name:'Four spirit statements'}).getByRole('listitem')).toHaveCount(4);
  const lampB=page.getByRole('button',{name:'Lamp B: unlit',exact:true});await lampB.focus();await lampB.press('Space');await expect(page.getByRole('button',{name:'Lamp B: lit',exact:true})).toHaveAttribute('aria-pressed','true');
  const originalSize=page.viewportSize()!;await page.setViewportSize({width:844,height:390});
  await page.getByRole('button',{name:'Ask the spirits to check',exact:true}).click();await expect(page.getByTestId('feedback')).toContainText('spirits disagree');await expect(page.getByRole('button',{name:/Continue to Lilia/})).toHaveCount(0);
  await page.setViewportSize(originalSize);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish','none');await page.getByRole('button',{name:'↶ Undo last move',exact:true}).click();await expect(lampB).toBeVisible();
  for(const lamp of ['A','C','D'])await page.getByRole('button',{name:`Lamp ${lamp}: unlit`,exact:true}).click();await page.getByRole('button',{name:'Ask the spirits to check',exact:true}).click();
  for(const lamp of ['A','B','C','D'])await expect(page.getByRole('button',{name:new RegExp(`^Lamp ${lamp}:`)})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Ask the spirits to check',exact:true})).toBeDisabled();await expect(page.getByText('Holds',{exact:true})).toHaveCount(0);await saved(page);await reloadRoad(page);
  await expect(page.getByRole('button',{name:/Continue to Lilia/})).toBeVisible();await expect(page.getByRole('list',{name:'Four spirit statements'}).getByRole('listitem')).toHaveCount(4);await page.screenshot({path:testInfo.outputPath('spirit-table.png'),fullPage:true});
});

test('all four instrument planes reframe with reachable targets and retain one world and audio context',async({page},testInfo)=>{
  test.setTimeout(90_000);await contextCounter(page);await openRoad(page);await importInstrument(page,throughTrial('tower'));await page.locator('canvas').evaluate(canvas=>canvas.setAttribute('data-i3','original'));
  const sizes=testInfo.project.name==='chromium'?[[1280,800],[844,390]]:[[390,844],[360,640]];
  for(const [width,height]of sizes){await page.setViewportSize({width,height});for(const [scene,name]of [['threshold',/The threshold/],['kitchen',/Jen’s kitchen/],['studio',/Alice’s studio/],['cabin',/Agatha’s cabin/]]as const){
    await travelViaMap(page,name);const stage=page.getByTestId('instrument-stage');await expect(stage).toHaveAttribute('data-instrument',scene);await expect(stage).toHaveAttribute('data-expanded','true');
    const box=(await stage.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);expect(box.y+box.height).toBeLessThanOrEqual(height-90);
    expect(await stage.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    const targets=await stage.locator('button:visible').evaluateAll(buttons=>buttons.map(button=>{const box=button.getBoundingClientRect();return{width:box.width,height:box.height};}));
    for(const bounds of targets){expect(bounds.width).toBeGreaterThanOrEqual(43.5);expect(bounds.height).toBeGreaterThanOrEqual(43.5);}
    await expect(page.locator('canvas')).toHaveAttribute('data-i3','original');await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state','playing');
    await page.getByRole('button',{name:INSTRUMENTS[scene].close,exact:true}).click();const approach=page.getByRole('button',{name:INSTRUMENTS[scene].approach,exact:true});await expect(approach).toBeFocused();await expect(approach).toBeInViewport();
    await expect(page.getByTestId('feedback')).toHaveCount(1);
    if(width===sizes[0][0])await page.screenshot({path:testInfo.outputPath(`${scene}-world.png`),fullPage:true});
    await approach.click();await expect(stage).toHaveAttribute('data-expanded','true');
    expect(await page.evaluate(()=>({x:scrollX,y:scrollY,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight}))).toEqual({x:0,y:0,overflow:false});
  }}
  expect(await page.evaluate(()=>(window as unknown as{audioContexts:number}).audioContexts)).toBe(1);await expect(page.locator('.jug-display,.operation-grid,.lyric-strips,.lamp-row,.coven-seats')).toHaveCount(0);
});

test('an instrument publishes quantities and its pour only after save completion, and travel cannot replay the cue',async({page})=>{
  await page.addInitScript(()=>{
    const root=window as unknown as{holdInstrumentSave:boolean;instrumentCompletions:(()=>void)[]};root.holdInstrumentSave=false;root.instrumentCompletions=[];
    const prototype=IDBTransaction.prototype as EventTarget,original=prototype.addEventListener;
    prototype.addEventListener=function(type,listener,options){if(type!=='complete'||!listener)return original.call(this,type,listener,options);const transaction=this as IDBTransaction;
      const deliver:EventListener=event=>{const invoke=()=>{if(typeof listener==='function')listener.call(transaction,event);else listener.handleEvent(event);};if(root.holdInstrumentSave&&transaction.mode==='readwrite')root.instrumentCompletions.push(invoke);else invoke();};return original.call(this,type,deliver,options);};
  });
  await openRoad(page);await importInstrument(page,throughTrial('kitchen'));await jugAction(page,'Fill 5-cup jug');await saved(page);
  await page.evaluate(()=>(window as unknown as{holdInstrumentSave:boolean}).holdInstrumentSave=true);
  try{await page.getByRole('button',{name:'Pour 5-cup into 3-cup',exact:true}).click();await expect(page.getByTestId('save-status')).toContainText('Saving your place');await expect(page.getByTestId('jug-5')).toHaveText('5 / 5 cups');await expect(page.getByTestId('pour-stream')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Pour 5-cup into 3-cup',exact:true})).toBeDisabled();
  }finally{await page.evaluate(()=>{const root=window as unknown as{holdInstrumentSave:boolean;instrumentCompletions:(()=>void)[]};root.holdInstrumentSave=false;root.instrumentCompletions.splice(0).forEach(invoke=>invoke());});}
  await expect(page.getByTestId('jug-5')).toHaveText('2 / 5 cups');await saved(page);await travelViaMap(page,/The cottage/);await travelViaMap(page,/Jen’s kitchen/);
  await expect(page.getByTestId('pour-stream')).toHaveCount(0);await expect(page.getByTestId('jug-5')).toHaveText('2 / 5 cups');
});
