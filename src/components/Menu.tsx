import React from 'react';
import { type GameSettings } from '../types';

interface MenuProps {
  onStartGame: () => void;
  onContinueGame?: () => void;
  hasSavedGame?: boolean;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

const Menu: React.FC<MenuProps> = ({
  onStartGame,
  onContinueGame,
  hasSavedGame,
  settings,
  onSettingsChange,
}) => {
  return (
    <div className="menu">
      <h1>Egyiptomi Spider Pasziánsz</h1>

      <div
        style={{
          border: '1px solid #ccc',
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Beállítások</h3>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={settings.revealAllCards}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                revealAllCards: e.target.checked,
              })
            }
            style={{ width: '20px', height: '20px' }}
          />
          Lapok felfedése
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={settings.allowAnyCardToEmptyColumn}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                allowAnyCardToEmptyColumn: e.target.checked,
              })
            }
            style={{ width: '20px', height: '20px' }}
          />
          Bármely kártya mehet üres helyre
        </label>
      </div>

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
