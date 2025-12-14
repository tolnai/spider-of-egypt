import { useState, useCallback, useEffect, useRef } from 'react';
import { type Card, type GameState, COLUMN_CONFIG } from '../types';
import { generateDeck, shuffleDeck } from '../utils/deck';
import {
  canMoveToColumn,
  canMoveToFoundation,
  isColumnComplete,
} from '../utils/gameLogic';

export const useSolitaire = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const dealingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initializeGame = useCallback(() => {
    // Clear any existing dealing timeout
    if (dealingTimeoutRef.current) {
      clearTimeout(dealingTimeoutRef.current);
      dealingTimeoutRef.current = null;
    }

    setIsDealing(true);
    const deck = shuffleDeck(generateDeck());

    // Initialize empty state
    const columns: Card[][] = Array(9)
      .fill([])
      .map(() => []);
    const foundations: Card[][] = Array(8)
      .fill([])
      .map(() => []);

    setGameState({
      columns,
      foundations,
      stock: [], // Temporary, will be filled by dealing logic
      score: 0,
      moves: 0,
    });

    // Dealing Animation Logic
    // Pre-calculate deal targets for row-by-row dealing
    const dealTargets: { colIndex: number; isFaceUp: boolean }[] = [];
    const maxRows = Math.max(...COLUMN_CONFIG);

    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < COLUMN_CONFIG.length; c++) {
        if (r < COLUMN_CONFIG[c]) {
          dealTargets.push({
            colIndex: c,
            isFaceUp: r === COLUMN_CONFIG[c] - 1,
          });
        }
      }
    }

    let currentDealIndex = 0;
    let deckIndex = 0;

    const dealNextCard = () => {
      if (currentDealIndex >= dealTargets.length) {
        // Done dealing columns, put rest in stock
        setGameState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            stock: deck.slice(deckIndex),
          };
        });
        setIsDealing(false);
        dealingTimeoutRef.current = null;
        return;
      }

      const target = dealTargets[currentDealIndex];
      const card = { ...deck[deckIndex] };
      if (target.isFaceUp) {
        card.faceUp = true;
      }

      setGameState((prev) => {
        if (!prev) return null;
        const newColumns = [...prev.columns];
        newColumns[target.colIndex] = [...newColumns[target.colIndex], card];
        return { ...prev, columns: newColumns };
      });

      deckIndex++;
      currentDealIndex++;
      dealingTimeoutRef.current = setTimeout(dealNextCard, 50); // 0.05s delay
    };

    // Start dealing
    dealNextCard();
  }, []);

  useEffect(() => {
    initializeGame();
    return () => {
      if (dealingTimeoutRef.current) {
        clearTimeout(dealingTimeoutRef.current);
      }
    };
  }, [initializeGame]);

  const moveCard = useCallback(
    (
      source: {
        type: 'column' | 'foundation';
        index: number;
        cardIndex?: number;
      },
      target: { type: 'column' | 'foundation'; index: number }
    ) => {
      setGameState((prevState) => {
        if (!prevState) return null;
        const newState = { ...prevState };

        // Deep copy needed for arrays we modify
        newState.columns = newState.columns.map((col) => [...col]);
        newState.foundations = newState.foundations.map((found) => [...found]);

        let cardsToMove: Card[] = [];

        // Get cards from source
        if (source.type === 'column') {
          const sourceCol = newState.columns[source.index];
          if (!source.cardIndex && source.cardIndex !== 0) return prevState; // Should have index
          cardsToMove = sourceCol.slice(source.cardIndex);
        } else {
          // Moving from foundation (if allowed, usually 1 card)
          // Not implemented based on rules, but good for completeness if needed
          return prevState;
        }

        // Validate and Move to Target
        if (target.type === 'column') {
          const targetCol = newState.columns[target.index];
          if (canMoveToColumn(cardsToMove, targetCol)) {
            // Remove from source
            if (source.type === 'column') {
              newState.columns[source.index].splice(
                source.cardIndex!,
                cardsToMove.length
              );

              // Reveal new top card of source column if any
              const sourceCol = newState.columns[source.index];
              if (sourceCol.length > 0) {
                const newTop = sourceCol[sourceCol.length - 1];
                if (!newTop.faceUp) {
                  newTop.faceUp = true; // Mutating the copy
                  // Actually we need to make sure we updated the object in the array
                  sourceCol[sourceCol.length - 1] = { ...newTop, faceUp: true };
                }
              }
            }

            // Add to target
            newState.columns[target.index].push(...cardsToMove);
            newState.moves += 1;
            return newState;
          }
        } else if (target.type === 'foundation') {
          // Can only move one card at a time to foundation usually
          if (cardsToMove.length !== 1) return prevState;

          const targetFoundation = newState.foundations[target.index];
          if (canMoveToFoundation(cardsToMove[0], targetFoundation)) {
            // Remove from source
            if (source.type === 'column') {
              newState.columns[source.index].splice(source.cardIndex!, 1);

              // Reveal new top card of source column
              const sourceCol = newState.columns[source.index];
              if (sourceCol.length > 0) {
                const newTop = sourceCol[sourceCol.length - 1];
                if (!newTop.faceUp) {
                  sourceCol[sourceCol.length - 1] = { ...newTop, faceUp: true };
                }
              }
            }

            // Add to target
            newState.foundations[target.index].push(cardsToMove[0]);
            newState.moves += 1;
            return newState;
          }
        }

        return prevState;
      });
    },
    []
  );

  const drawCards = useCallback(() => {
    if (isDealing || !gameState || gameState.stock.length === 0) return;

    const eligibleColumnIndices: number[] = [];
    gameState.columns.forEach((col, index) => {
      if (!isColumnComplete(col)) {
        eligibleColumnIndices.push(index);
      }
    });

    if (eligibleColumnIndices.length === 0) return;

    setIsDealing(true);

    let targetIndex = 0;

    const animateDraw = () => {
      if (targetIndex >= eligibleColumnIndices.length) {
        setIsDealing(false);
        return;
      }

      const currentTargetIndex = targetIndex;

      setGameState((prev) => {
        if (!prev || prev.stock.length === 0) return prev;

        const newState = { ...prev };
        newState.columns = newState.columns.map((col) => [...col]);
        newState.stock = [...newState.stock];

        const colIndex = eligibleColumnIndices[currentTargetIndex];
        const card = newState.stock.shift();

        if (card && newState.columns[colIndex]) {
          card.faceUp = true;
          newState.columns[colIndex].push(card);
          newState.moves += currentTargetIndex === 0 ? 1 : 0; // Count as 1 move? Or 1 per card? Usually 1 move for the draw action.
        }

        return newState;
      });

      targetIndex++;
      setTimeout(animateDraw, 50);
    };

    animateDraw();
  }, [gameState, isDealing]);

  const autoMoveToFoundation = useCallback(
    (
      card: Card,
      source: { type: 'column'; index: number; cardIndex: number }
    ) => {
      setGameState((prevState) => {
        if (!prevState) return null;

        // Check all foundations
        for (let i = 0; i < prevState.foundations.length; i++) {
          if (canMoveToFoundation(card, prevState.foundations[i])) {
            // Found a valid move, reuse moveCard logic by calling it?
            // We can't call moveCard inside setState callback easily if moveCard also sets state.
            // So we duplicate logic or structure differently.
            // Duplicating logic for now as it's simple enough.

            const newState = { ...prevState };
            newState.columns = newState.columns.map((col) => [...col]);
            newState.foundations = newState.foundations.map((found) => [
              ...found,
            ]);

            // Remove from source
            newState.columns[source.index].splice(source.cardIndex, 1);

            // Reveal new top
            const sourceCol = newState.columns[source.index];
            if (sourceCol.length > 0) {
              const newTop = sourceCol[sourceCol.length - 1];
              if (!newTop.faceUp) {
                sourceCol[sourceCol.length - 1] = { ...newTop, faceUp: true };
              }
            }

            // Add to foundation
            newState.foundations[i].push(card);
            newState.moves += 1;
            return newState;
          }
        }
        return prevState;
      });
    },
    []
  );

  return {
    gameState,
    initializeGame,
    moveCard,
    drawCards,
    autoMoveToFoundation,
    isDealing,
  };
};
