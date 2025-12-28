import { type Card, RANK_VALUE } from '../types';

export const isDescendingSequence = (cards: Card[]): boolean => {
  if (cards.length <= 1) return true;
  for (let i = 0; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];

    // Check rank descending
    if (RANK_VALUE[current.rank] !== RANK_VALUE[next.rank] + 1) {
      return false;
    }
    // Check alternating colors
    if (current.color === next.color) {
      return false;
    }
  }
  return true;
};

export const canMoveToColumn = (
  sourceCards: Card[],
  targetColumn: Card[],
  allowAnyCardToEmptyColumn: boolean = false
): boolean => {
  if (sourceCards.length === 0) return false;

  // Check if source cards form a valid sequence themselves
  if (!isDescendingSequence(sourceCards)) {
    return false;
  }

  // If target column is empty
  if (targetColumn.length === 0) {
    if (allowAnyCardToEmptyColumn) return true;
    return sourceCards[0].rank === 'K';
  }

  const targetTop = targetColumn[targetColumn.length - 1];
  const sourceBottom = sourceCards[0]; // The highest rank card in the moving stack

  // Check rank (Target must be Source + 1)
  if (RANK_VALUE[targetTop.rank] !== RANK_VALUE[sourceBottom.rank] + 1) {
    return false;
  }

  // Check alternating color
  if (targetTop.color === sourceBottom.color) {
    return false;
  }

  return true;
};

export const canMoveToFoundation = (
  card: Card,
  foundation: Card[]
): boolean => {
  if (foundation.length === 0) {
    return card.rank === 'A';
  }

  const topCard = foundation[foundation.length - 1];

  // Must be same suit
  if (card.suit !== topCard.suit) {
    return false;
  }

  // Must be next rank
  if (RANK_VALUE[card.rank] !== RANK_VALUE[topCard.rank] + 1) {
    return false;
  }

  return true;
};

export const isColumnComplete = (column: Card[]): boolean => {
  // "series without unrevealed cards (so starting with K)"
  // This means the column has no face-down cards, and the bottom-most card (index 0) is a King.
  // And presumably it must be a valid sequence from K down to whatever is at the top.
  // But the rule just says "starting with K" and "without unrevealed cards".
  // It doesn't explicitly say it has to be a full K-A sequence, just that it starts with K and has no hidden cards.
  // However, usually in solitaire, "starting with K" implies the base.

  if (column.length === 0) return false;

  // Check for unrevealed cards
  const hasUnrevealed = column.some((c) => !c.faceUp);
  if (hasUnrevealed) return false;

  // Check if base is King
  if (column[0].rank !== 'K') return false;

  // The rule "series without unrevealed cards" implies the whole visible column is a valid series?
  // "where we already have a series without unrevealed cards"
  // If I have K, Q, J (all visible), is that a series? Yes.
  // If I have K, 5 (both visible, but not a series), is that a series? No.
  // So we should check if the whole column is a valid descending alternating sequence.
  return isDescendingSequence(column);
};
