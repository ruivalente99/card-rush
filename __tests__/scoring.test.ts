import { describe, it, expect } from 'vitest';
import { calculateRoundScore, bustProbability, countUniqueNumbers, LUCKY7_BONUS } from '../lib/game/scoring';
import type { Card } from '../lib/game/types';

function num(value: number): Card {
  return { id: `n${value}`, type: 'number', value };
}

const freeze: Card = { id: 'f', type: 'freeze' };
const x2: Card = { id: 'x2', type: 'x2' };
const plus3: Card = { id: 'p3', type: 'plus3' };

describe('calculateRoundScore', () => {
  it('sums number card values', () => {
    expect(calculateRoundScore([num(3), num(5)], false)).toBe(8);
  });

  it('doubles with x2', () => {
    expect(calculateRoundScore([num(3), num(5), x2], false)).toBe(16);
  });

  it('adds 3 with plus3', () => {
    expect(calculateRoundScore([num(3), plus3], false)).toBe(6);
  });

  it('x2 applies before plus3', () => {
    expect(calculateRoundScore([num(4), x2, plus3], false)).toBe(11);
  });

  it('adds LUCKY7_BONUS when isLucky7', () => {
    expect(calculateRoundScore([num(1), num(2)], true)).toBe(3 + LUCKY7_BONUS);
  });

  it('doubles base when hyperTrainActive', () => {
    expect(calculateRoundScore([num(3), num(5)], false, true)).toBe(16);
  });

  it('hyperTrain stacks with x2 (4× total)', () => {
    expect(calculateRoundScore([num(4), x2], false, true)).toBe(16);
  });

  it('hyperTrain + x2 + plus3 order is correct', () => {
    // base=4, ×2(hyper)=8, ×2(x2)=16, +3=19
    expect(calculateRoundScore([num(4), x2, plus3], false, true)).toBe(19);
  });

  it('ignores non-number cards for base', () => {
    expect(calculateRoundScore([freeze, num(5)], false)).toBe(5);
  });
});

describe('bustProbability', () => {
  it('returns 0 for empty deck', () => {
    expect(bustProbability([], [num(3)])).toBe(0);
  });

  it('returns 0 for empty hand', () => {
    const deck = [num(3), num(5)];
    expect(bustProbability(deck, [])).toBe(0);
  });

  it('calculates correctly', () => {
    const deck: Card[] = [num(3), num(5), num(6), num(7)];
    const hand: Card[] = [num(3)];
    // 1 danger card (the 3 in deck) out of 4
    expect(bustProbability(deck, hand)).toBe(1 / 4);
  });

  it('returns 1 when all deck cards are danger', () => {
    const deck: Card[] = [num(3), num(3)];
    const hand: Card[] = [num(3)];
    expect(bustProbability(deck, hand)).toBe(1);
  });
});

describe('countUniqueNumbers', () => {
  it('counts distinct number values', () => {
    expect(countUniqueNumbers([num(1), num(2), num(1)])).toBe(2);
  });

  it('ignores non-number cards', () => {
    expect(countUniqueNumbers([num(1), freeze, x2])).toBe(1);
  });
});
