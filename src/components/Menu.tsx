import React from 'react';

interface MenuProps {
  onStartGame: () => void;
  onContinueGame?: () => void;
  hasSavedGame?: boolean;
}

const Menu: React.FC<MenuProps> = ({
  onStartGame,
  onContinueGame,
  hasSavedGame,
}) => {
  return (
    <div className="menu">
      <h1>Egyiptomi Spider Pasziánsz</h1>
      {hasSavedGame && (
        <button onClick={onContinueGame} style={{ marginBottom: '10px' }}>
          Folytatás
        </button>
      )}
      <button onClick={onStartGame}>Új játék</button>
    </div>
  );
};

export default Menu;
