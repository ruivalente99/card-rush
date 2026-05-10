import { v4 as uuidv4 } from 'uuid';
import type { Card, CardType } from './types';

function makeCard(type: CardType, value?: number): Card {
  return { id: uuidv4(), type, value };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildDeck(): Card[] {
  const cards: Card[] = [];

  // Number cards: value N has N copies (0 → 1 card special case)
  for (let n = 0; n <= 12; n++) {
    const count = n === 0 ? 1 : n;
    for (let i = 0; i < count; i++) {
      cards.push(makeCard('number', n));
    }
  }

  // Special cards: 3 of each
  for (let i = 0; i < 3; i++) {
    cards.push(makeCard('freeze'));
    cards.push(makeCard('second_chance'));
    cards.push(makeCard('x2'));
    cards.push(makeCard('plus3'));
  }

  // HyperTrain: 2 cards (rainbow score doubler)
  cards.push(makeCard('hypertrain'));
  cards.push(makeCard('hypertrain'));

  return shuffle(cards);
}

export function drawCard(deck: Card[]): { card: Card; remaining: Card[] } {
  if (deck.length === 0) throw new Error('Deck is empty');
  const [card, ...remaining] = deck;
  return { card, remaining };
}
