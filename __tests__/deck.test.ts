import { describe, it, expect } from 'vitest';
import { buildDeck, drawCard } from '../lib/game/deck';

describe('buildDeck', () => {
  it('builds 93 cards total', () => {
    const deck = buildDeck();
    expect(deck.length).toBe(93); // 79 numbers + 12 specials + 2 hypertrain
  });

  it('has correct number card counts', () => {
    const deck = buildDeck();
    const numbers = deck.filter((c) => c.type === 'number');
    expect(numbers.length).toBe(79);

    // value 0 → 1 card
    expect(numbers.filter((c) => c.value === 0).length).toBe(1);
    // value N → N cards for 1-12
    for (let n = 1; n <= 12; n++) {
      expect(numbers.filter((c) => c.value === n).length).toBe(n);
    }
  });

  it('has 3 of each special card and 2 hypertrain', () => {
    const deck = buildDeck();
    expect(deck.filter((c) => c.type === 'freeze').length).toBe(3);
    expect(deck.filter((c) => c.type === 'second_chance').length).toBe(3);
    expect(deck.filter((c) => c.type === 'x2').length).toBe(3);
    expect(deck.filter((c) => c.type === 'plus3').length).toBe(3);
    expect(deck.filter((c) => c.type === 'hypertrain').length).toBe(2);
  });

  it('assigns unique ids to all cards', () => {
    const deck = buildDeck();
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(deck.length);
  });
});

describe('drawCard', () => {
  it('removes top card and returns remaining', () => {
    const deck = buildDeck();
    const { card, remaining } = drawCard(deck);
    expect(remaining.length).toBe(92);
    expect(card).toBe(deck[0]);
  });

  it('throws on empty deck', () => {
    expect(() => drawCard([])).toThrow('Deck is empty');
  });
});
