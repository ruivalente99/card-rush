import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyAction, createInitialState } from '../lib/game/engine';
import * as deckModule from '../lib/game/deck';
import type { Card, GameState } from '../lib/game/types';

function makeCard(type: Card['type'], value?: number): Card {
  return { id: `${type}-${value ?? ''}`, type, value };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialState({
    pointTarget: 200,
    turnTimerSeconds: 0,
    players: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ],
  });
  return { ...base, ...overrides };
}

describe('START_GAME', () => {
  it('transitions LOBBY → PLAYING', () => {
    const state = makeState();
    expect(state.phase).toBe('LOBBY');
    const next = applyAction(state, { type: 'START_GAME' });
    expect(next.phase).toBe('PLAYING');
    expect(next.players.length).toBe(2);
    expect(next.deck.length).toBe(91);
    expect(next.round).toBe(1);
  });

  it('no-ops when not in LOBBY', () => {
    const state = makeState({ phase: 'PLAYING' });
    const next = applyAction(state, { type: 'START_GAME' });
    expect(next.phase).toBe('PLAYING');
  });
});

describe('DRAW - bust detection', () => {
  it('busts when duplicate number drawn and no second chance', () => {
    // Two cards with the same value → second draw must bust
    const fixedDeck: Card[] = [makeCard('number', 3), makeCard('number', 3), makeCard('number', 5)];
    vi.spyOn(deckModule, 'buildDeck').mockReturnValueOnce(fixedDeck);

    let state = applyAction(makeState(), { type: 'START_GAME' });
    state = applyAction(state, { type: 'DRAW' }); // draw 3 — safe
    state = applyAction(state, { type: 'DRAW' }); // draw duplicate 3 → BUST + NEXT_TURN

    const p1 = state.players[0];
    expect(p1.roundState.busted).toBe(true);
    expect(p1.roundState.roundScore).toBe(0);
  });

  it('consumes second chance on duplicate', () => {
    const fixedDeck: Card[] = [
      makeCard('second_chance'),
      makeCard('number', 3),
      makeCard('number', 3),
    ];
    vi.spyOn(deckModule, 'buildDeck').mockReturnValueOnce(fixedDeck);

    let state = applyAction(makeState(), { type: 'START_GAME' });
    state = applyAction(state, { type: 'DRAW' }); // draw second_chance
    state = applyAction(state, { type: 'DRAW' }); // draw 3
    state = applyAction(state, { type: 'DRAW' }); // draw duplicate 3 — second chance absorbs

    const p1 = state.players[0];
    expect(p1.roundState.busted).toBe(false);
    expect(p1.roundState.secondChances).toBe(0);
  });
});

describe('STAY', () => {
  it('banks round score and moves to next player', () => {
    const fixedDeck: Card[] = [makeCard('number', 5), makeCard('number', 7)];
    vi.spyOn(deckModule, 'buildDeck').mockReturnValueOnce(fixedDeck);

    let state = applyAction(makeState(), { type: 'START_GAME' });
    state = applyAction(state, { type: 'DRAW' }); // draw 5
    state = applyAction(state, { type: 'STAY' });

    const p1 = state.players[0];
    expect(p1.roundState.stayed).toBe(true);
    expect(p1.roundState.roundScore).toBe(5);
    expect(state.currentPlayerIndex).toBe(1); // moved to p2
  });
});

describe('Lucky 7 bonus', () => {
  it('triggers when 7 unique number cards drawn', () => {
    const fixedDeck: Card[] = [0, 1, 2, 3, 4, 5, 6].map((v) =>
      makeCard('number', v)
    );
    vi.spyOn(deckModule, 'buildDeck').mockReturnValueOnce(fixedDeck);

    let state = applyAction(makeState(), { type: 'START_GAME' });
    for (let i = 0; i < 7; i++) {
      state = applyAction(state, { type: 'DRAW' });
    }

    const p1 = state.players[0];
    expect(p1.roundState.isLucky7).toBe(true);
    expect(p1.roundState.stayed).toBe(true);
    // base = 0+1+2+3+4+5+6 = 21, +LUCKY7_BONUS(15) = 36
    expect(p1.roundState.roundScore).toBe(36);
  });
});

describe('win condition', () => {
  it('reaches GAME_OVER when pointTarget met', () => {
    // Give p1 totalScore just below target so one more round wins
    const fixedDeck: Card[] = [makeCard('number', 12), makeCard('number', 11)];
    vi.spyOn(deckModule, 'buildDeck').mockReturnValue(fixedDeck);

    let state = createInitialState({
      pointTarget: 10,
      turnTimerSeconds: 0,
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
    });
    state = applyAction(state, { type: 'START_GAME' });
    // p1 draws 12 and stays
    state = applyAction(state, { type: 'DRAW' });
    state = applyAction(state, { type: 'STAY' });
    // p2 stays with 0 score — all players done → NEXT_ROUND fires → ROUND_END
    state = applyAction(state, { type: 'STAY' });
    // State is now ROUND_END with scores tallied and win condition met
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winner).toBe('p1');
  });
});
