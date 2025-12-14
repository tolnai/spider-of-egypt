import { useState } from 'react';
import './App.css';
import Menu from './components/Menu';
import Game from './components/Game';

function App() {
  const [view, setView] = useState<'menu' | 'game'>('menu');
  const [gameId, setGameId] = useState(0); // Used to force re-render for restart

  const handleStartGame = () => {
    setView('game');
    setGameId((prev) => prev + 1);
  };

  const handleRestart = () => {
    setGameId((prev) => prev + 1);
  };

  const handleExit = () => {
    setView('menu');
  };

  return (
    <div className="app">
      {view === 'menu' ? (
        <Menu onStartGame={handleStartGame} />
      ) : (
        <Game key={gameId} onRestart={handleRestart} onExit={handleExit} />
      )}
    </div>
  );
}

export default App;
