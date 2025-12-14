import { type Card, SUITS, RANKS } from '../types';

export const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  // 2 packs
  for (let i = 0; i < 2; i++) {
    const backColor = i === 0 ? 'red' : 'blue';
    SUITS.forEach((suit) => {
      RANKS.forEach((rank) => {
        deck.push({
          id: crypto.randomUUID(),
          suit,
          rank,
          color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
          faceUp: false,
          backColor,
        });
      });
    });
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};
