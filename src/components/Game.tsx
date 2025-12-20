import React from 'react';
import { useSolitaire } from '../hooks/useSolitaire';
import CardComponent from './Card';
import { type Card as CardType } from '../types';
import { isDescendingSequence, canMoveToColumn } from '../utils/gameLogic';

interface GameProps {
  onRestart: () => void;
  onExit: () => void;
  initialMode?: 'new' | 'continue';
}

const Game: React.FC<GameProps> = ({
  onRestart,
  onExit,
  initialMode = 'new',
}) => {
  const {
    gameState,
    moveCard,
    drawCards,
    initializeGame,
    autoMoveToFoundation,
    isDealing,
    undo,
    canUndo,
  } = useSolitaire(initialMode);
  const [draggingSource, setDraggingSource] = React.useState<{
    type: 'column' | 'foundation';
    index: number;
    cardIndex?: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [cursorPos, setCursorPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedSource, setSelectedSource] = React.useState<{
    type: 'column' | 'foundation';
    index: number;
    cardIndex?: number;
  } | null>(null);

  // Re-initialize if needed when component mounts (handled by hook useEffect, but we might want to trigger it on restart prop change if we were passing gameId down, but here we remount Game component so it's fine)

  if (!gameState) return <div>Loading...</div>;

  const handleCardClick = (
    _card: CardType,
    source: { type: 'column' | 'foundation'; index: number; cardIndex?: number }
  ) => {
    if (isDealing) return;

    // If nothing selected, try to select
    if (!selectedSource) {
      if (source.type === 'column' && source.cardIndex !== undefined) {
        const column = gameState.columns[source.index];
        const cardsToMove = column.slice(source.cardIndex);
        if (isDescendingSequence(cardsToMove)) {
          setSelectedSource(source);
        }
      } else if (source.type === 'foundation') {
        // Can select foundation card to move back
        setSelectedSource(source);
      }
      return;
    }

    // If clicking the same card -> deselect
    if (
      selectedSource.type === source.type &&
      selectedSource.index === source.index &&
      selectedSource.cardIndex === source.cardIndex
    ) {
      setSelectedSource(null);
      return;
    }

    // If clicking a column card, treat it as a move target (to that column)
    if (source.type === 'column') {
      // Try to move selected cards to this column
      let cardsToMove: CardType[] = [];
      if (selectedSource.type === 'column') {
        const sourceCol = gameState.columns[selectedSource.index];
        if (selectedSource.cardIndex !== undefined) {
          cardsToMove = sourceCol.slice(selectedSource.cardIndex);
        }
      } else if (selectedSource.type === 'foundation') {
        const sourceFoundation = gameState.foundations[selectedSource.index];
        if (sourceFoundation.length > 0) {
          cardsToMove = [sourceFoundation[sourceFoundation.length - 1]];
        }
      }

      const targetCol = gameState.columns[source.index];
      if (canMoveToColumn(cardsToMove, targetCol)) {
        moveCard(selectedSource, { type: 'column', index: source.index });
        setSelectedSource(null);
      } else {
        // Invalid move.
        // If the clicked card is movable, select it instead.
        // Otherwise just deselect.
        if (source.type === 'column' && source.cardIndex !== undefined) {
          const column = gameState.columns[source.index];
          const newSelectionMovable = isDescendingSequence(
            column.slice(source.cardIndex)
          );
          if (newSelectionMovable) {
            setSelectedSource(source);
          } else {
            setSelectedSource(null);
          }
        } else {
          setSelectedSource(null);
        }
      }
    } else if (source.type === 'foundation') {
      // Clicking a foundation card (target)
      // Try to move selected card to this foundation
      // But user said "it should not matter which card I click... place it on any foundation"
      // So we should trigger autoMoveToFoundation logic for the selected card
      if (
        selectedSource.type === 'column' &&
        selectedSource.cardIndex !== undefined
      ) {
        const sourceCol = gameState.columns[selectedSource.index];
        const card = sourceCol[selectedSource.cardIndex];
        // We only move the top card to foundation usually, but autoMoveToFoundation handles logic
        // Actually autoMoveToFoundation takes a card and source.
        // It checks if that card can go to ANY foundation.
        // But we need to make sure we are moving the LAST card of the sequence if we selected a stack?
        // Usually you only move one card to foundation.
        // If user selected a stack, can we move the bottom one? No, usually top one.
        // If user selected a middle card, it's a stack. Can't move stack to foundation.
        // So check if it's a single card (last in column)
        if (selectedSource.cardIndex === sourceCol.length - 1) {
          autoMoveToFoundation(card, {
            type: 'column',
            index: selectedSource.index,
            cardIndex: selectedSource.cardIndex,
          });
          setSelectedSource(null);
        } else {
          setSelectedSource(null);
        }
      } else {
        setSelectedSource(null);
      }
    }
  };

  const handleColumnClick = (colIndex: number) => {
    if (isDealing) return;
    if (selectedSource) {
      // Try to move to empty column
      let cardsToMove: CardType[] = [];
      if (selectedSource.type === 'column') {
        const sourceCol = gameState.columns[selectedSource.index];
        if (selectedSource.cardIndex !== undefined) {
          cardsToMove = sourceCol.slice(selectedSource.cardIndex);
        }
      } else if (selectedSource.type === 'foundation') {
        const sourceFoundation = gameState.foundations[selectedSource.index];
        if (sourceFoundation.length > 0) {
          cardsToMove = [sourceFoundation[sourceFoundation.length - 1]];
        }
      }

      const targetCol = gameState.columns[colIndex]; // Should be empty
      if (canMoveToColumn(cardsToMove, targetCol)) {
        moveCard(selectedSource, { type: 'column', index: colIndex });
        setSelectedSource(null);
      } else {
        setSelectedSource(null);
      }
    }
  };

  const handleFoundationAreaClick = () => {
    if (isDealing) return;
    if (selectedSource) {
      // Same logic as clicking a foundation card
      if (
        selectedSource.type === 'column' &&
        selectedSource.cardIndex !== undefined
      ) {
        const sourceCol = gameState.columns[selectedSource.index];
        const card = sourceCol[selectedSource.cardIndex];
        if (selectedSource.cardIndex === sourceCol.length - 1) {
          autoMoveToFoundation(card, {
            type: 'column',
            index: selectedSource.index,
            cardIndex: selectedSource.cardIndex,
          });
          setSelectedSource(null);
        } else {
          setSelectedSource(null);
        }
      } else {
        setSelectedSource(null);
      }
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    source: { type: 'column' | 'foundation'; index: number; cardIndex?: number }
  ) => {
    if (isDealing) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('text/plain', JSON.stringify(source));
    e.dataTransfer.effectAllowed = 'move';

    // Hide native drag image
    const emptyImage = new Image();
    emptyImage.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(emptyImage, 0, 0);

    // Calculate offset relative to the clicked card
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setCursorPos({ x: e.clientX, y: e.clientY });

    if (source.type === 'column' && source.cardIndex !== undefined) {
      const column = gameState.columns[source.index];
      const cardsToDrag = column.slice(source.cardIndex);

      // Check if valid sequence
      if (!isDescendingSequence(cardsToDrag)) {
        e.preventDefault();
        return;
      }

      setDraggingSource(source);
    } else if (source.type === 'foundation') {
      setDraggingSource(source);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setDraggingSource(null);
    setCursorPos(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (e.clientX === 0 && e.clientY === 0) return;
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const handleDrop = (
    e: React.DragEvent,
    target: { type: 'column' | 'foundation'; index: number }
  ) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    try {
      const source = JSON.parse(data);
      moveCard(source, target);
    } catch (err) {
      console.error('Invalid drop data', err);
    }
    setDraggingSource(null);
  };

  const handleDoubleClick = (
    card: CardType,
    source: { type: 'column'; index: number; cardIndex: number }
  ) => {
    if (isDealing) return;
    autoMoveToFoundation(card, source);
  };

  return (
    <div
      className="game-container"
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        padding: '20px',
        gap: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Left: Columns */}
      <div
        className="columns-area"
        style={{
          flexGrow: 1,
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          minWidth: '900px',
          justifyContent: 'center',
        }}
      >
        {gameState.columns.map((column, colIndex) => (
          <div
            key={`column-${colIndex}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, { type: 'column', index: colIndex })}
            onDragEnd={handleDragEnd}
            onClick={() => handleColumnClick(colIndex)}
            style={{
              minWidth: '84px',
              position: 'relative',
              height: '100%',
              flex: '0 0 84px',
            }}
          >
            {column.length === 0 && (
              <div
                style={{
                  width: '84px',
                  height: '120px',
                  border: '2px dashed rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  margin: '0 auto',
                }}
              />
            )}
            {column.map((card, cardIndex) => {
              // Check if this card is being dragged (or is below a dragged card in the same column)
              const isHidden =
                draggingSource?.type === 'column' &&
                draggingSource.index === colIndex &&
                draggingSource.cardIndex !== undefined &&
                cardIndex >= draggingSource.cardIndex;

              const isMovable = isDescendingSequence(column.slice(cardIndex));
              const isSelected =
                selectedSource?.type === 'column' &&
                selectedSource.index === colIndex &&
                selectedSource.cardIndex === cardIndex;

              return (
                <div
                  key={card.id}
                  style={{
                    position: 'absolute',
                    top: `${cardIndex * 45}px`,
                    left: '0',
                    zIndex: cardIndex,
                    opacity: isHidden ? 0 : 1,
                  }}
                >
                  <CardComponent
                    card={card}
                    draggable={card.faceUp}
                    isMovable={isMovable}
                    isSelected={isSelected}
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleCardClick(card, {
                        type: 'column',
                        index: colIndex,
                        cardIndex,
                      });
                    }}
                    onDragStart={(e) =>
                      handleDragStart(e, {
                        type: 'column',
                        index: colIndex,
                        cardIndex,
                      })
                    }
                    onDrag={handleDrag}
                    onDoubleClick={() =>
                      handleDoubleClick(card, {
                        type: 'column',
                        index: colIndex,
                        cardIndex,
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Right: Sidebar */}
      <div
        className="sidebar"
        style={{
          width: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '48px',
          flexShrink: 0,
        }}
      >
        {/* Foundations Grid 2x4 */}
        <div
          className="foundations-grid"
          onClick={handleFoundationAreaClick}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {gameState.foundations.map((foundation, index) => (
            <div
              key={`foundation-${index}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, { type: 'foundation', index })}
              onDragEnd={handleDragEnd}
              onClick={handleFoundationAreaClick}
              style={{
                border: '2px solid #ccc',
                borderRadius: '6px',
                width: '84px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            >
              {foundation.length > 0 ? (
                <CardComponent
                  card={foundation[foundation.length - 1]}
                  draggable={true}
                  isSelected={
                    selectedSource?.type === 'foundation' &&
                    selectedSource.index === index
                  }
                  onClick={(e) => {
                    e?.stopPropagation();
                    handleCardClick(foundation[foundation.length - 1], {
                      type: 'foundation',
                      index,
                    });
                  }}
                  onDragStart={(e) =>
                    handleDragStart(e, { type: 'foundation', index })
                  }
                  onDrag={handleDrag}
                />
              ) : (
                <div style={{ opacity: 0.3, fontSize: '29px' }}>A</div>
              )}
            </div>
          ))}
        </div>

        {/* Controls Area: Deck + Buttons */}
        <div
          className="controls-area"
          style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}
        >
          {/* Stock */}
          <div
            className="stock"
            onClick={drawCards}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '6px',
              width: '84px',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {gameState.stock.length > 0 ? (
              <div
                style={{
                  width: '72px',
                  height: '108px',
                  background:
                    'repeating-linear-gradient(45deg, #606dbc, #606dbc 10px, #465298 10px, #465298 20px)',
                  borderRadius: '5px',
                  border: '1px solid #fff',
                }}
              />
            ) : (
              <span>Üres</span>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: '-30px',
                fontSize: '17px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              Pakli ({gameState.stock.length})
            </div>
          </div>

          {/* Buttons & Stats */}
          <div
            className="game-actions"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flexGrow: 1,
            }}
          >
            <button
              onClick={() => {
                onRestart();
                initializeGame();
              }}
            >
              Új játék
            </button>
            <button onClick={undo} disabled={!canUndo}>
              Visszavonás
            </button>
            <button onClick={onExit}>Kilépés</button>
            <div style={{ fontSize: '22px', marginTop: '12px' }}>
              Lépések: {gameState.moves}
            </div>
          </div>
        </div>
      </div>
      {/* Custom Drag Layer */}
      {draggingSource && cursorPos && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            transform: `translate(${cursorPos.x - dragOffset.x}px, ${
              cursorPos.y - dragOffset.y
            }px)`,
          }}
        >
          {draggingSource.type === 'column' &&
            draggingSource.cardIndex !== undefined &&
            gameState.columns[draggingSource.index]
              .slice(draggingSource.cardIndex)
              .map((card, i) => (
                <div
                  key={card.id}
                  style={{
                    position: 'absolute',
                    top: `${i * 36}px`,
                    left: 0,
                  }}
                >
                  <CardComponent card={card} draggable={false} />
                </div>
              ))}
          {draggingSource.type === 'foundation' &&
            gameState.foundations[draggingSource.index].length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                <CardComponent
                  card={
                    gameState.foundations[draggingSource.index][
                      gameState.foundations[draggingSource.index].length - 1
                    ]
                  }
                  draggable={false}
                />
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Game;
