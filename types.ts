export enum Phase {
  START = 'START',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED',
}

export interface Stats {
  health: number;
  intelligence: number;
  charm: number;
  wealth: number;
  happiness: number;
}

export interface Talent {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  statModifiers?: Partial<Stats>;
}

export interface LogEntry {
  age: number;
  content: string;
  type: 'normal' | 'choice' | 'death' | 'achievement';
  statsChanged?: Partial<Stats>;
  achievements?: string[];
}

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface GameState {
  age: number;
  stats: Stats;
  talents: Talent[];
  history: LogEntry[];
  phase: Phase;
  isProcessing: boolean;
  pendingChoice: ChoiceOption[] | null;
  deathReason?: string;
  summary?: string;
  achievements: string[];
}

export interface GeminiResponse {
  content: string;
  statChanges?: Partial<Stats>;
  isDeath?: boolean;
  deathReason?: string;
  choices?: ChoiceOption[];
  achievements?: string[];
}