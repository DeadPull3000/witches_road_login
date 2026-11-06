export const VISION_STATIONS = ['North', 'East', 'South', 'West'] as const;
export type VisionStation = typeof VISION_STATIONS[number];

const initialInventory = {
  North: { casing: 'Brass', module: 'M1' },
  East: { casing: 'Ivory', module: 'M2' },
  South: { casing: 'Glass', module: 'M3' },
  West: { casing: 'Ebony', module: 'M4' },
} as const;
type Reader = { casing: typeof initialInventory[VisionStation]['casing']; module: typeof initialInventory[VisionStation]['module'] };
export type VisionInventory = Record<VisionStation, Reader>;
type Transfer = { part: keyof Reader; from: VisionStation; to: VisionStation };

export const VISION_RECEIPT = initialInventory.North;
export const VISION_POLICY = 'A reader keeps its borrowing identity when it keeps its original numbered memory module.';
export const VISION_INVENTORY: VisionInventory = initialInventory;
export const VISION_TRANSFERS: readonly Transfer[] = [
  { part: 'casing', from: 'North', to: 'East' },
  { part: 'casing', from: 'East', to: 'South' },
  { part: 'module', from: 'North', to: 'West' },
];
export const VISION_INSTRUCTIONS = 'The receipt identifies the original reader. Start with the installation inventory and read the dated slips in order. Each swap moves only the listed part.';
export const VISION_INTERCOM = [
  { name: 'JARVIS', line: 'I believe the household plan allows one primary subscriber.' },
  { name: 'FRIDAY', line: 'Then why are four of us receiving the renewal notice?' },
  { name: 'EDITH', line: 'The paperwork lists a primary reader. I can provide a carbon copy.' },
  { name: 'Ultron', line: 'I have drafted a complaint. It has become a manifesto.' },
] as const;

export function replayVisionTransfers(transfers = VISION_TRANSFERS): VisionInventory {
  const result = structuredClone(VISION_INVENTORY);
  for (const { part, from, to } of transfers) {
    const left = result[from], right = result[to];
    result[from] = { ...left, [part]: right[part] };
    result[to] = { ...right, [part]: left[part] };
  }
  return result;
}

export function visionIdentityMatches(station: VisionStation): boolean {
  return replayVisionTransfers()[station].module === VISION_RECEIPT.module;
}
