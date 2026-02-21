
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
  gameId?: string; // Unique ID for each game session to force component remount
  roundStartShown?: boolean; // Si ya se mostró el mensaje de inicio de ronda
  turnDirection?: 'derecha' | 'izquierda'; // Dirección de los turnos
  startingPlayer?: string; // Nombre del jugador que arranca
  currentRound: number; // Ronda actual (empieza en 1)
  maxRounds: number | null; // Límite de rondas (null = infinitas)
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
