import React from 'react';

interface MenuProps {
  onStartGame: () => void;
}

const Menu: React.FC<MenuProps> = ({ onStartGame }) => {
  return (
    <div className="menu">
      <h1>Egyiptomi Spider Pasziánsz</h1>
      <button onClick={onStartGame}>Új játék</button>
    </div>
  );
};

export default Menu;
