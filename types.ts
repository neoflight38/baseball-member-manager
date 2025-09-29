export enum Position {
  PITCHER = 'ピッチャー',
  CATCHER = 'キャッチャー',
  INFIELDER = '内野手',
  OUTFIELDER = '外野手',
  NONE = 'なし'
}

export interface Player {
  id: string;
  name: string;
  number: string;
  mainPosition: Position;
  subPosition1: Position;
  subPosition2: Position;
}

export interface MatchDetails {
  date: string;
  time: string;
  venue: string;
  opponent: string;
}

export type SortType = 'default' | 'number' | 'position';