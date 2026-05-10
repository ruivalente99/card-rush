import type { GameState, GameAction, GameMode, Player, PlayerRoundState } from './types';
import { buildDeck, drawCard } from './deck';
import { calculateRoundScore, countUniqueNumbers } from './scoring';

function freshRoundState(): PlayerRoundState {
  return {
    hand: [],
    secondChances: 0,
    froze: false,
    stayed: false,
    busted: false,
    roundScore: 0,
    isLucky7: false,
    hyperTrainActive: false,
  };
}

function initPlayers(config: GameState['config']): Player[] {
  return config.players.map((p) => ({
    id: p.id,
    name: p.name,
    totalScore: 0,
    roundState: freshRoundState(),
  }));
}

function isPlayerDone(p: Player): boolean {
  return p.roundState.busted || p.roundState.stayed || p.roundState.froze;
}

function allPlayersDone(players: Player[]): boolean {
  return players.every(isPlayerDone);
}

function nextActiveIndex(players: Player[], from: number): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (!isPlayerDone(players[idx])) return idx;
  }
  return from;
}

function checkWin(state: GameState): GameState {
  const { config, players } = state;
  if (config.pointTarget > 0) {
    const winner = players.find((p) => p.totalScore >= config.pointTarget);
    if (winner) return { ...state, phase: 'GAME_OVER', winner: winner.id };
  } else if (config.maxRounds && state.round >= config.maxRounds) {
    const top = [...players].sort((a, b) => b.totalScore - a.totalScore)[0];
    return { ...state, phase: 'GAME_OVER', winner: top.id };
  }
  return state;
}

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      if (state.phase !== 'LOBBY') return state;
      return {
        ...state,
        phase: 'PLAYING',
        deck: buildDeck(),
        discardPile: [],
        players: initPlayers(state.config),
        currentPlayerIndex: 0,
        round: 1,
      };
    }

    case 'DRAW': {
      if (state.phase !== 'PLAYING') return state;
      if (state.deck.length === 0) return state;

      const { card, remaining } = drawCard(state.deck);
      const playerIdx = state.currentPlayerIndex;
      let player = state.players[playerIdx];
      let rs = player.roundState;

      const newDiscard = [card, ...state.discardPile];
      let newDeck = remaining;

      // Freeze: auto-stay immediately
      if (card.type === 'freeze') {
        const score = calculateRoundScore([...rs.hand, card], rs.isLucky7, rs.hyperTrainActive);
        const updatedPlayer: Player = {
          ...player,
          roundState: {
            ...rs,
            hand: [...rs.hand, card],
            froze: true,
            roundScore: score,
          },
        };
        const newPlayers = state.players.map((p, i) =>
          i === playerIdx ? updatedPlayer : p
        );
        let next: GameState = {
          ...state,
          deck: newDeck,
          discardPile: newDiscard,
          players: newPlayers,
        };
        return applyAction(next, { type: 'NEXT_TURN' });
      }

      // Second chance: bank it, continue
      if (card.type === 'second_chance') {
        const updatedPlayer: Player = {
          ...player,
          roundState: {
            ...rs,
            hand: [...rs.hand, card],
            secondChances: rs.secondChances + 1,
          },
        };
        let next: GameState = {
          ...state,
          deck: newDeck,
          discardPile: newDiscard,
          players: state.players.map((p, i) =>
            i === playerIdx ? updatedPlayer : p
          ),
        };
        if (state.config.gameMode === 'one-per-turn') {
          return applyAction(next, { type: 'NEXT_TURN' });
        }
        return next;
      }

      // HyperTrain: activate doubling bonus, continue drawing
      if (card.type === 'hypertrain') {
        const newHand = [...rs.hand, card];
        const uniqueNums = countUniqueNumbers(newHand);
        const isLucky7 = uniqueNums >= 7;
        const updatedPlayer: Player = {
          ...player,
          roundState: { ...rs, hand: newHand, hyperTrainActive: true, isLucky7 },
        };
        let next: GameState = {
          ...state,
          deck: newDeck,
          discardPile: newDiscard,
          players: state.players.map((p, i) =>
            i === playerIdx ? updatedPlayer : p
          ),
        };
        if (isLucky7) return applyAction(next, { type: 'STAY' });
        if (state.config.gameMode === 'one-per-turn') {
          return applyAction(next, { type: 'NEXT_TURN' });
        }
        return next;
      }

      // x2 / plus3: add to hand, keep drawing
      if (card.type === 'x2' || card.type === 'plus3') {
        const newHand = [...rs.hand, card];
        const uniqueNums = countUniqueNumbers(newHand);
        const isLucky7 = uniqueNums >= 7;
        const updatedPlayer: Player = {
          ...player,
          roundState: { ...rs, hand: newHand, isLucky7 },
        };
        let next: GameState = {
          ...state,
          deck: newDeck,
          discardPile: newDiscard,
          players: state.players.map((p, i) =>
            i === playerIdx ? updatedPlayer : p
          ),
        };
        if (isLucky7) return applyAction(next, { type: 'STAY' });
        if (state.config.gameMode === 'one-per-turn') {
          return applyAction(next, { type: 'NEXT_TURN' });
        }
        return next;
      }

      // Number card
      const heldValues = new Set(
        rs.hand.filter((c) => c.type === 'number').map((c) => c.value!)
      );
      const isDuplicate = heldValues.has(card.value!);

      if (isDuplicate && rs.secondChances > 0) {
        const newHand = [...rs.hand, card];
        const uniqueNums = countUniqueNumbers(newHand);
        const isLucky7 = uniqueNums >= 7;
        const updatedPlayer: Player = {
          ...player,
          roundState: {
            ...rs,
            hand: newHand,
            secondChances: rs.secondChances - 1,
            isLucky7,
          },
        };
        let next: GameState = {
          ...state,
          deck: newDeck,
          discardPile: newDiscard,
          players: state.players.map((p, i) =>
            i === playerIdx ? updatedPlayer : p
          ),
        };
        if (isLucky7) return applyAction(next, { type: 'STAY' });
        if (state.config.gameMode === 'one-per-turn') {
          return applyAction(next, { type: 'NEXT_TURN' });
        }
        return next;
      }

      if (isDuplicate) {
        // BUST — do NOT auto-advance. BustOverlay (local) or API route (online) dispatches NEXT_TURN.
        const updatedPlayer: Player = {
          ...player,
          roundState: {
            ...rs,
            hand: [...rs.hand, card],
            busted: true,
            roundScore: 0,
          },
        };
        const newPlayers = state.players.map((p, i) =>
          i === playerIdx ? updatedPlayer : p
        );
        return {
          ...state,
          deck: newDeck,
          discardPile: newDiscard,
          players: newPlayers,
        };
      }

      // Safe number card
      const newHand = [...rs.hand, card];
      const uniqueNums = countUniqueNumbers(newHand);
      const isLucky7 = uniqueNums >= 7;
      const updatedPlayer: Player = {
        ...player,
        roundState: { ...rs, hand: newHand, isLucky7 },
      };
      let next: GameState = {
        ...state,
        deck: newDeck,
        discardPile: newDiscard,
        players: state.players.map((p, i) =>
          i === playerIdx ? updatedPlayer : p
        ),
      };
      if (isLucky7) return applyAction(next, { type: 'STAY' });
      if (state.config.gameMode === 'one-per-turn') {
        return applyAction(next, { type: 'NEXT_TURN' });
      }
      return next;
    }

    case 'STAY': {
      if (state.phase !== 'PLAYING') return state;
      const playerIdx = state.currentPlayerIndex;
      const player = state.players[playerIdx];
      const rs = player.roundState;
      const score = calculateRoundScore(rs.hand, rs.isLucky7, rs.hyperTrainActive);
      const updatedPlayer: Player = {
        ...player,
        roundState: { ...rs, stayed: true, roundScore: score },
      };
      const newPlayers = state.players.map((p, i) =>
        i === playerIdx ? updatedPlayer : p
      );
      let next: GameState = { ...state, players: newPlayers };
      return applyAction(next, { type: 'NEXT_TURN' });
    }

    case 'NEXT_TURN': {
      if (state.phase !== 'PLAYING') return state;
      if (allPlayersDone(state.players)) {
        return applyAction(state, { type: 'NEXT_ROUND' });
      }
      const nextIdx = nextActiveIndex(state.players, state.currentPlayerIndex);
      return { ...state, currentPlayerIndex: nextIdx };
    }

    case 'NEXT_ROUND': {
      const playersWithTotals = state.players.map((p) => ({
        ...p,
        totalScore: p.totalScore + p.roundState.roundScore,
      }));
      const stateWithTotals: GameState = {
        ...state,
        phase: 'ROUND_END',
        players: playersWithTotals,
      };
      return checkWin(stateWithTotals);
    }

    case 'BEGIN_ROUND': {
      if (state.phase !== 'ROUND_END') return state;
      return {
        ...state,
        phase: 'PLAYING',
        deck: buildDeck(),
        discardPile: [],
        players: state.players.map((p) => ({
          ...p,
          roundState: freshRoundState(),
        })),
        round: state.round + 1,
        currentPlayerIndex: 0,
      };
    }

    case 'RESTART_GAME': {
      if (state.phase !== 'GAME_OVER') return state;
      return {
        ...state,
        phase: 'PLAYING',
        deck: buildDeck(),
        discardPile: [],
        players: initPlayers(state.config),
        currentPlayerIndex: 0,
        round: 1,
        winner: undefined,
      };
    }

    default:
      return state;
  }
}

export function createInitialState(
  config: Omit<GameState['config'], 'gameMode'> & { gameMode?: GameMode }
): GameState {
  return {
    phase: 'LOBBY',
    config: { ...config, gameMode: config.gameMode ?? 'free' },
    deck: [],
    discardPile: [],
    players: [],
    currentPlayerIndex: 0,
    round: 0,
  };
}
