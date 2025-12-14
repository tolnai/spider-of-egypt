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
}

const Card: React.FC<CardProps> = ({
  card,
  onClick,
  onDoubleClick,
  onDragStart,
  onDrag,
  style,
  draggable,
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
        backgroundColor: 'white',
        border: '1px solid #999',
        borderRadius: '6px',
        width: '70px',
        height: '100px',
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
              top: '4px',
              left: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: '1',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {card.rank}
            </div>
            <div style={{ fontSize: '14px' }}>{getSuitSymbol(card.suit)}</div>
          </div>

          {/* Center Symbol */}
          <div style={{ fontSize: '34px' }}>{getSuitSymbol(card.suit)}</div>

          {/* Bottom Right Corner (Rotated) */}
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: '1',
              transform: 'rotate(180deg)',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {card.rank}
            </div>
            <div style={{ fontSize: '14px' }}>{getSuitSymbol(card.suit)}</div>
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
