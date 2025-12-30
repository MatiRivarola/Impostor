
export type Role = 'citizen' | 'impostor' | 'undercover';

export type GameMode = 'classic' | 'chaos' | 'hardcore';

export type AppMode = 'LANDING' | 'LOCAL' | 'ONLINE_LOBBY' | 'ONLINE_GAME';

export type GamePhase =
  | 'SETUP'
  | 'LOADING'
  | 'ASSIGNMENT_WAIT' // "Pass phone to X"
  | 'ASSIGNMENT_REVEAL' // Showing the role
  | 'DEBATE'
  | 'VOTING'
  | 'LAST_BULLET' // Hardcore mode only: Impostor guesses word
  | 'GAME_OVER';

export type OnlinePhase = 'LOBBY' | 'ASSIGNMENT' | 'DEBATE' | 'VOTING' | 'ELIMINATION' | 'RESULT';

export interface EliminationData {
  victimId: string;
  victimName: string;
  victimRole: Role;
  victimAvatar?: string;
  victimColor?: string;
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  word?: string; // The word this player sees (if any)
  isDead: boolean;
  avatar?: string; // Emoji for online mode
  color?: string;  // Hex color for online mode
}

export type ScoreMap = Record<string, number>;

export interface GameState {
  phase: GamePhase;
  players: Player[];
  impostorCount: number;
  undercoverCount: number;
  gameMode: GameMode;
  theme: string; // Label of the chosen theme (or mixed)
  secretWord: string; // The "Real" word (Citizens)
  undercoverWord: string; // The "Fake" word (Undercover)
  currentPlayerIndex: number; 
  winner: 'citizens' | 'impostor' | null;
}

export interface ThemeOption {
  id: string;
  label: string;
  emoji: string;
}

export interface WordPair {
  normal: string;
  undercover: string;
}
