import React from 'react';
import { useSolitaire } from '../hooks/useSolitaire';
import CardComponent from './Card';
import { type Card as CardType } from '../types';
import { isDescendingSequence } from '../utils/gameLogic';

interface GameProps {
  onRestart: () => void;
  onExit: () => void;
}

const Game: React.FC<GameProps> = ({ onRestart, onExit }) => {
  const {
    gameState,
    moveCard,
    drawCards,
    initializeGame,
    autoMoveToFoundation,
    isDealing,
  } = useSolitaire();
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

  // Re-initialize if needed when component mounts (handled by hook useEffect, but we might want to trigger it on restart prop change if we were passing gameId down, but here we remount Game component so it's fine)

  if (!gameState) return <div>Loading...</div>;

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
          gap: '20px',
          overflowX: 'auto',
          minWidth: '0',
        }}
      >
        {gameState.columns.map((column, colIndex) => (
          <div
            key={`column-${colIndex}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, { type: 'column', index: colIndex })}
            onDragEnd={handleDragEnd}
            style={{
              minWidth: '70px',
              position: 'relative',
              height: '100%',
              flex: '0 0 70px',
            }}
          >
            {column.length === 0 && (
              <div
                style={{
                  width: '70px',
                  height: '100px',
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

              return (
                <div
                  key={card.id}
                  style={{
                    position: 'absolute',
                    top: `${cardIndex * 37}px`,
                    left: '0',
                    zIndex: cardIndex,
                    opacity: isHidden ? 0 : 1,
                  }}
                >
                  <CardComponent
                    card={card}
                    draggable={card.faceUp}
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
          width: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
          flexShrink: 0,
        }}
      >
        {/* Foundations Grid 2x4 */}
        <div
          className="foundations-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
          }}
        >
          {gameState.foundations.map((foundation, index) => (
            <div
              key={`foundation-${index}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, { type: 'foundation', index })}
              style={{
                border: '2px solid #ccc',
                borderRadius: '6px',
                width: '70px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            >
              {foundation.length > 0 ? (
                <CardComponent
                  card={foundation[foundation.length - 1]}
                  draggable={false}
                />
              ) : (
                <div style={{ opacity: 0.3, fontSize: '24px' }}>A</div>
              )}
            </div>
          ))}
        </div>

        {/* Controls Area: Deck + Buttons */}
        <div
          className="controls-area"
          style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}
        >
          {/* Stock */}
          <div
            className="stock"
            onClick={drawCards}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '6px',
              width: '70px',
              height: '100px',
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
                  width: '60px',
                  height: '90px',
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
                bottom: '-25px',
                fontSize: '14px',
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
              gap: '10px',
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
            <button onClick={onExit}>Kilépés</button>
            <div style={{ fontSize: '18px', marginTop: '10px' }}>
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
                    top: `${i * 30}px`,
                    left: 0,
                  }}
                >
                  <CardComponent card={card} draggable={false} />
                </div>
              ))}
        </div>
      )}
    </div>
  );
};

export default Game;
