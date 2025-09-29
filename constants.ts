import { Position } from './types';

export const MAIN_POSITION_OPTIONS: Position[] = [
  Position.PITCHER,
  Position.CATCHER,
  Position.INFIELDER,
  Position.OUTFIELDER,
];

export const SUB_POSITION_OPTIONS: Position[] = [
  Position.NONE,
  ...MAIN_POSITION_OPTIONS,
];

// For use in `style` attributes for gradients
export const POSITION_RAW_COLORS: Record<Position, string> = {
  [Position.PITCHER]: '#fbcfe8', // pink-200
  [Position.CATCHER]: '#bfdbfe', // blue-200
  [Position.INFIELDER]: '#fef08a', // yellow-200
  [Position.OUTFIELDER]: '#bbf7d0', // green-200
  [Position.NONE]: '#e5e7eb', // gray-200
};

export const POSITION_ORDER: Position[] = [
  Position.PITCHER,
  Position.CATCHER,
  Position.INFIELDER,
  Position.OUTFIELDER,
];

export const LINEUP_POSITIONS: string[] = [
  '投',
  '捕',
  '一',
  '二',
  '三',
  '遊',
  '左',
  '中',
  '右',
];

export const LINEUP_POSITION_COLORS: Record<string, string> = {
  '投': '#fbcfe8', // pink-200
  '捕': '#bfdbfe', // blue-200
  '一': '#fef08a', // yellow-200
  '二': '#fef08a', // yellow-200
  '三': '#fef08a', // yellow-200
  '遊': '#fef08a', // yellow-200
  '左': '#bbf7d0', // green-200
  '中': '#bbf7d0', // green-200
  '右': '#bbf7d0', // green-200
  'DH': '#ddd6fe', // violet-200
};

export const INNING_POSITION_OPTIONS: string[] = [
  ...LINEUP_POSITIONS,
  'DH',
  '-',
];