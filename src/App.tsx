import { useState } from 'react';
import './App.css';
import Menu from './components/Menu';
import Game from './components/Game';

function App() {
  const [view, setView] = useState<'menu' | 'game'>('menu');
  const [gameId, setGameId] = useState(0); // Used to force re-render for restart
  const [gameMode, setGameMode] = useState<'new' | 'continue'>('new');

  const hasSavedGame = !!localStorage.getItem('spider_egypt_state');

  const handleStartGame = () => {
    setGameMode('new');
    setView('game');
    setGameId((prev) => prev + 1);
  };

  const handleContinueGame = () => {
    setGameMode('continue');
    setView('game');
    setGameId((prev) => prev + 1);
  };

  const handleRestart = () => {
    setGameMode('new');
    setGameId((prev) => prev + 1);
  };

  const handleExit = () => {
    setView('menu');
  };

  return (
    <div className="app">
      {view === 'menu' ? (
        <Menu
          onStartGame={handleStartGame}
          onContinueGame={handleContinueGame}
          hasSavedGame={hasSavedGame}
        />
      ) : (
        <Game
          key={gameId}
          onRestart={handleRestart}
          onExit={handleExit}
          initialMode={gameMode}
        />
      )}
    </div>
  );
}

export default App;
