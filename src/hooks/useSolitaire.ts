import { useState, useCallback, useEffect, useRef } from 'react';
import {
  type Card,
  type GameState,
  type GameSettings,
  COLUMN_CONFIG,
} from '../types';
import { generateDeck, shuffleDeck } from '../utils/deck';
import {
  canMoveToColumn,
  canMoveToFoundation,
  isColumnComplete,
  isDescendingSequence,
} from '../utils/gameLogic';

export const useSolitaire = (
  initialMode: 'new' | 'continue' = 'new',
  settings: GameSettings = {
    revealAllCards: false,
    allowAnyCardToEmptyColumn: false,
  }
) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const dealingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const pushHistory = useCallback((state: GameState) => {
    setHistory((prev) => {
      const newHistory = [...prev, state];
      if (newHistory.length > 5) {
        return newHistory.slice(newHistory.length - 5);
      }
      return newHistory;
    });
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0 || isDealing) return;
    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setGameState(previousState);
  }, [history, isDealing]);

  const initializeGame = useCallback(() => {
    // Clear any existing dealing timeout
    if (dealingTimeoutRef.current) {
      clearTimeout(dealingTimeoutRef.current);
      dealingTimeoutRef.current = null;
    }
    if (autoCompleteTimeoutRef.current) {
      clearTimeout(autoCompleteTimeoutRef.current);
      autoCompleteTimeoutRef.current = null;
    }

    setIsDealing(true);
    setIsAutoCompleting(false);
    setHistory([]); // Clear history on restart
    localStorage.removeItem('spider_egypt_state');
    localStorage.removeItem('spider_egypt_history');
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
      if (target.isFaceUp || settings.revealAllCards) {
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
  }, [settings]);

  // Load state from local storage on mount
  useEffect(() => {
    if (initialMode === 'continue') {
      const savedState = localStorage.getItem('spider_egypt_state');
      const savedHistory = localStorage.getItem('spider_egypt_history');

      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          const parsedHistory = savedHistory ? JSON.parse(savedHistory) : [];
          setGameState(parsedState);
          setHistory(parsedHistory);
          setIsDealing(false);
        } catch (error) {
          console.error('Failed to load saved state:', error);
          initializeGame();
        }
      } else {
        initializeGame();
      }
    } else {
      initializeGame();
    }

    return () => {
      if (dealingTimeoutRef.current) {
        clearTimeout(dealingTimeoutRef.current);
      }
      if (autoCompleteTimeoutRef.current) {
        clearTimeout(autoCompleteTimeoutRef.current);
      }
    };
  }, [initializeGame, initialMode]);

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (!isDealing && gameState) {
      localStorage.setItem('spider_egypt_state', JSON.stringify(gameState));
      localStorage.setItem('spider_egypt_history', JSON.stringify(history));
    }
  }, [gameState, history, isDealing]);

  // Auto-complete logic
  useEffect(() => {
    if (!gameState || isDealing || isAutoCompleting) return;

    // Check if stock is empty
    if (gameState.stock.length > 0) return;

    // Check if all columns are either empty or a valid series starting with K
    const allColumnsReady = gameState.columns.every((col) => {
      if (col.length === 0) return true;
      // Must start with K, have no hidden cards, and be a valid sequence
      return (
        col[0].rank === 'K' &&
        col.every((c) => c.faceUp) &&
        isDescendingSequence(col)
      );
    });

    if (allColumnsReady) {
      // Check if there are any cards left to move (foundations not full)
      const totalCardsInFoundations = gameState.foundations.reduce(
        (acc, f) => acc + f.length,
        0
      );
      if (totalCardsInFoundations === 104) return; // 2 decks * 52 cards = 104

      setIsAutoCompleting(true);

      const performAutoMove = () => {
        setGameState((prevState) => {
          if (!prevState) return null;

          // Find the first card that can move to a foundation
          // Prioritize by rank (lowest first) is naturally handled if we just check top cards
          // because we can only move A, then 2, etc.
          // We iterate columns to find a move.

          let sourceColIndex = -1;
          let targetFoundationIndex = -1;

          for (let c = 0; c < prevState.columns.length; c++) {
            const col = prevState.columns[c];
            if (col.length === 0) continue;

            const card = col[col.length - 1];
            for (let f = 0; f < prevState.foundations.length; f++) {
              if (canMoveToFoundation(card, prevState.foundations[f])) {
                sourceColIndex = c;
                targetFoundationIndex = f;
                break;
              }
            }
            if (sourceColIndex !== -1) break;
          }

          if (sourceColIndex !== -1) {
            const newState = { ...prevState };
            newState.columns = newState.columns.map((col) => [...col]);
            newState.foundations = newState.foundations.map((found) => [
              ...found,
            ]);

            const card = newState.columns[sourceColIndex].pop()!;
            newState.foundations[targetFoundationIndex].push(card);
            newState.moves += 1;

            // Schedule next move
            autoCompleteTimeoutRef.current = setTimeout(performAutoMove, 100);
            return newState;
          } else {
            // No more moves found? Should not happen if condition met, unless done.
            setIsAutoCompleting(false);
            return prevState;
          }
        });
      };

      autoCompleteTimeoutRef.current = setTimeout(performAutoMove, 100);
    }
  }, [gameState, isDealing, isAutoCompleting]);

  const moveCard = useCallback(
    (
      source: {
        type: 'column' | 'foundation';
        index: number;
        cardIndex?: number;
      },
      target: { type: 'column' | 'foundation'; index: number }
    ) => {
      if (!gameState) return;

      const newState = { ...gameState };
      newState.columns = newState.columns.map((col) => [...col]);
      newState.foundations = newState.foundations.map((found) => [...found]);

      let cardsToMove: Card[] = [];
      let validMove = false;

      // Get cards from source
      if (source.type === 'column') {
        const sourceCol = newState.columns[source.index];
        if (!source.cardIndex && source.cardIndex !== 0) return;
        cardsToMove = sourceCol.slice(source.cardIndex);
      } else if (source.type === 'foundation') {
        const sourceFoundation = newState.foundations[source.index];
        if (sourceFoundation.length === 0) return;
        cardsToMove = [sourceFoundation[sourceFoundation.length - 1]];
      } else {
        return;
      }

      // Validate and Move to Target
      if (target.type === 'column') {
        const targetCol = newState.columns[target.index];
        if (
          canMoveToColumn(
            cardsToMove,
            targetCol,
            settings.allowAnyCardToEmptyColumn
          )
        ) {
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
                sourceCol[sourceCol.length - 1] = { ...newTop, faceUp: true };
              }
            }
          } else if (source.type === 'foundation') {
            newState.foundations[source.index].pop();
          }

          // Add to target
          newState.columns[target.index].push(...cardsToMove);
          newState.moves += 1;
          validMove = true;
        }
      } else if (target.type === 'foundation') {
        if (cardsToMove.length !== 1) return;

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
          validMove = true;
        }
      }

      if (validMove) {
        pushHistory(gameState);
        setGameState(newState);
      }
    },
    [gameState, pushHistory]
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

    pushHistory(gameState);
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
  }, [gameState, isDealing, pushHistory]);

  const autoMoveToFoundation = useCallback(
    (
      card: Card,
      source: { type: 'column'; index: number; cardIndex: number }
    ) => {
      if (!gameState) return;

      // Check all foundations
      for (let i = 0; i < gameState.foundations.length; i++) {
        if (canMoveToFoundation(card, gameState.foundations[i])) {
          const newState = { ...gameState };
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

          pushHistory(gameState);
          setGameState(newState);
          return;
        }
      }
    },
    [gameState, pushHistory]
  );

  const isWon = gameState
    ? gameState.foundations.reduce((acc, f) => acc + f.length, 0) === 104
    : false;

  return {
    gameState,
    initializeGame,
    moveCard,
    drawCards,
    autoMoveToFoundation,
    isDealing,
    undo,
    canUndo: history.length > 0 && !isDealing,
    isWon,
  };
};
