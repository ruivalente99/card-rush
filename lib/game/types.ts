export type CardType = 'number' | 'freeze' | 'second_chance' | 'x2' | 'plus3' | 'hypertrain';

export interface Card {
  id: string;
  type: CardType;
  value?: number;
}

export interface PlayerRoundState {
  hand: Card[];
  secondChances: number;
  froze: boolean;
  stayed: boolean;
  busted: boolean;
  roundScore: number;
  isLucky7: boolean;
  hyperTrainActive: boolean;
}

export interface Player {
  id: string;
  name: string;
  totalScore: number;
  roundState: PlayerRoundState;
}

export type GamePhase = 'LOBBY' | 'PLAYING' | 'ROUND_END' | 'GAME_OVER';

export type GameMode = 'free' | 'one-per-turn';

export interface GameConfig {
  pointTarget: number;
  maxRounds?: number;
  turnTimerSeconds: number;
  gameMode: GameMode;
  players: { id: string; name: string; emoji?: string }[];
}

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  winner?: string;
}

export type GameAction =
  | { type: 'DRAW' }
  | { type: 'STAY' }
  | { type: 'START_GAME' }
  | { type: 'NEXT_TURN' }
  | { type: 'NEXT_ROUND' }
  | { type: 'BEGIN_ROUND' }
  | { type: 'RESTART_GAME' }
  | { type: 'FORCE_HYPERTRAIN' };
