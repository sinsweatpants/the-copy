export const SCREENPLAY_FORMATS = [
  'basmala',
  'scene-header-1',
  'scene-header-2',
  'scene-header-3',
  'action',
  'character',
  'parenthetical',
  'dialogue',
  'transition'
] as const;

export type ScreenplayFormat = typeof SCREENPLAY_FORMATS[number];

export const SPACING_MAP: Record<ScreenplayFormat, Partial<Record<ScreenplayFormat, string>>> = {
  'scene-header-1': { 'scene-header-3': '0px', 'action': '1em' },
  'scene-header-3': { 'action': '0.5em' },
  'action': { 'action': '0px', 'character': '1em', 'scene-header-1': '2em' },
  'character': { 'dialogue': '0px', 'parenthetical': '0px' },
  'parenthetical': { 'dialogue': '0px' },
  'dialogue': { 'action': '1em', 'character': '1em' },
  'transition': { 'scene-header-1': '2em' },
  'basmala': { 'scene-header-1': '1em' }
};

export const NEXT_FORMAT_ON_ENTER: Record<ScreenplayFormat, ScreenplayFormat> = {
  'scene-header-1': 'scene-header-3',
  'scene-header-3': 'action',
  'action': 'action',
  'character': 'dialogue',
  'parenthetical': 'dialogue',
  'dialogue': 'action',
  'transition': 'scene-header-1',
  'basmala': 'scene-header-1'
};

export const NEEDS_EMPTY_LINE: Record<ScreenplayFormat, ScreenplayFormat[]> = {
  'scene-header-3': ['action'],
  'action': ['character', 'transition'],
  'dialogue': ['character', 'action', 'transition'],
  'transition': ['scene-header-1']
};

export const A4_PAGE_HEIGHT_PX = 1123;
