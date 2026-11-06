import type { Preferences } from '../game/state';
import { project, type Rect, type WorldLayout } from './layout';

export type StudioDock = 'side' | 'compact' | 'sheet';
export type StudioPlacement = {
  dock: StudioDock;
  frame: Rect;
  benchWidth: number;
  speaker: Rect;
  actor: Rect;
  tag: Rect;
  headingHeight: number;
  speakerHeight: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export function studioPlacement(layout: WorldLayout, textSize: Preferences['textSize']): StudioPlacement {
  const { width, height } = layout;
  const short = height < 540;
  const wide = width >= 1100 && height >= 600;
  const dock: StudioDock = textSize === 'large' || width < 740 || width / height < 1.1 ? 'sheet' : wide ? 'side' : 'compact';
  const inset = dock === 'sheet' ? 18 : 28;
  const top = short ? 12 : 88;
  const available = width - inset * 2;
  const gap = dock === 'side' ? 32 : dock === 'compact' ? 20 : 0;
  const dockWidth = dock === 'side' ? clamp(width * .22, 220, 300) : dock === 'compact' ? clamp(width * .22, 154, 212) : 0;
  const benchWidth = Math.min(available - gap - dockWidth, dock === 'sheet' ? 780 : 1000);
  const frame = { x: inset, y: top, width: benchWidth + gap + dockWidth, height: Math.max(120, height - top - (short ? 106 : 114)) };
  const headingHeight = short ? 52 : 60;
  const speakerHeight = short ? 76 : textSize === 'large' ? 106 : 88;
  const speaker = { x: benchWidth + gap, y: dock === 'side' ? 8 : 2, width: dockWidth, height: dock === 'side' ? 112 : 126 };
  const tagWidth = Math.min(198, width - 28);
  const mount = project({ x: 330, y: 648 }, layout.camera);
  const tag = {
    x: clamp(mount.x - tagWidth * .52, 14, width - tagWidth - 14),
    y: clamp(mount.y - 20, 72, height - (short ? 140 : 150)),
    width: tagWidth,
    height: 44,
  };

  let actor: Rect;
  if (dock === 'sheet') {
    const portraitWidth = short ? 145 : 169;
    actor = {
      x: frame.x + benchWidth - 10 - portraitWidth * .73,
      y: frame.y + headingHeight + 8,
      width: portraitWidth,
      height: portraitWidth * 1.5,
    };
  } else if (dock === 'compact') {
    const portraitWidth = Math.min(dockWidth * .94, height * .42);
    actor = {
      x: frame.x + speaker.x + (dockWidth - portraitWidth) / 2,
      y: frame.y + (short ? 102 : 128),
      width: portraitWidth,
      height: portraitWidth * 1.5,
    };
  } else {
    const actorHeight = Math.min(height * .64, dockWidth * 1.54, height - frame.y - 152);
    actor = {
      x: frame.x + speaker.x + (dockWidth - actorHeight * 2 / 3) / 2,
      y: Math.min(height - 38, frame.y + frame.height + 44) - actorHeight,
      width: actorHeight * 2 / 3,
      height: actorHeight,
    };
  }
  return { dock, frame, benchWidth, speaker, actor, tag, headingHeight, speakerHeight };
}
