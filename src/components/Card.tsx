import React from 'react';
import { type Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDrag?: (e: React.DragEvent) => void;
  style?: React.CSSProperties;
  draggable?: boolean;
  isMovable?: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  onClick,
  onDoubleClick,
  onDragStart,
  onDrag,
  style,
  draggable,
  isMovable = true,
}) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
        return '♣';
      case 'spades':
        return '♠';
      default:
        return '';
    }
  };

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const shouldGrayOut = card.faceUp && !isMovable;

  return (
    <div
      className={`card ${card.faceUp ? 'face-up' : 'face-down'}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={draggable && card.faceUp}
      onDragStart={onDragStart}
      onDrag={onDrag}
      style={{
        ...style,
        color: isRed ? 'red' : 'black',
        filter: shouldGrayOut ? 'brightness(0.85) grayscale(0.2)' : 'none',
        backgroundColor: 'white',
        border: '1px solid #999',
        borderRadius: '6px',
        width: '84px',
        height: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: draggable && card.faceUp ? 'grab' : 'default',
        userSelect: 'none',
        position: 'relative', // For absolute positioning of corner symbol
      }}
    >
      {card.faceUp ? (
        <>
          {/* Top Left Corner */}
          <div
            style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: '1',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
              {card.rank}
            </div>
            <div style={{ fontSize: '17px' }}>{getSuitSymbol(card.suit)}</div>
          </div>

          {/* Center Symbol */}
          <div style={{ fontSize: '41px' }}>{getSuitSymbol(card.suit)}</div>

          {/* Bottom Right Corner (Rotated) */}
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: '1',
              transform: 'rotate(180deg)',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
              {card.rank}
            </div>
            <div style={{ fontSize: '17px' }}>{getSuitSymbol(card.suit)}</div>
          </div>
        </>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background:
              card.backColor === 'red'
                ? 'repeating-linear-gradient(45deg, #b91c1c, #b91c1c 10px, #991b1b 10px, #991b1b 20px)'
                : 'repeating-linear-gradient(45deg, #1e40af, #1e40af 10px, #1e3a8a 10px, #1e3a8a 20px)',
            borderRadius: '5px',
            border: '2px solid white',
          }}
        />
      )}
    </div>
  );
};

export default Card;
