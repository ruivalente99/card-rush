export type CardType = 'number' | 'freeze' | 'second_chance' | 'x2' | 'plus3';

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
  isFlip7: boolean;
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
  | { type: 'FLIP' }
  | { type: 'STAY' }
  | { type: 'START_GAME' }
  | { type: 'NEXT_TURN' }
  | { type: 'NEXT_ROUND' }   // transition to ROUND_END, tally scores
  | { type: 'BEGIN_ROUND' }; // transition from ROUND_END → PLAYING (new round)
