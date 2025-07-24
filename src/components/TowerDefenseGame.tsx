import React, { useState, useEffect } from 'react';
import { TowerType, Position } from '../types/game';
import { useGameEngine } from '../hooks/useGameEngine';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';
import { VALID_TOWER_POSITIONS, GAME_CONFIG } from '../config/gameConfig';

export const TowerDefenseGame: React.FC = () => {
  const {
    gameState,
    towers,
    enemies,
    projectiles,
    currentLevel,
    startWave,
    pauseGame,
    nextLevel,
    placeTower,
    upgradeTower,
    useSpecialAbility,
    selectTower,
    setHoveredCell,
    changeDifficulty,
    resetGame,
    getDynamicPrice,
  } = useGameEngine();

  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);

  // Handle game status changes
  useEffect(() => {
    if (gameState.gameStatus === 'gameOver') {
      setShowGameOverModal(true);
    } else if (gameState.gameStatus === 'victory') {
      setShowVictoryModal(true);
    } else if (gameState.gameStatus === 'levelComplete') {
      setShowLevelCompleteModal(true);
    } else {
      setShowGameOverModal(false);
      setShowVictoryModal(false);
      setShowLevelCompleteModal(false);
    }
  }, [gameState.gameStatus]);

  const handleCanvasClick = (position: Position) => {
    if (selectedTowerType && gameState.gameStatus === 'preparing') {
      // Check if position is valid for tower placement
      const validPosition = VALID_TOWER_POSITIONS.find(
        pos => Math.abs(pos.x - position.x) < GAME_CONFIG.GRID_SIZE / 2 &&
               Math.abs(pos.y - position.y) < GAME_CONFIG.GRID_SIZE / 2
      );

      if (validPosition) {
        // Check if there's already a tower at this position
        const existingTower = towers.find(
          tower => Math.abs(tower.position.x - validPosition.x) < GAME_CONFIG.GRID_SIZE / 2 &&
                   Math.abs(tower.position.y - validPosition.y) < GAME_CONFIG.GRID_SIZE / 2
        );

        if (!existingTower) {
          const success = placeTower(validPosition, selectedTowerType);
          if (success) {
            setSelectedTowerType(null);
          }
        }
      }
    } else {
      // Try to select an existing tower
      const clickedTower = towers.find(
        tower => Math.abs(tower.position.x - position.x) < GAME_CONFIG.GRID_SIZE / 2 &&
                 Math.abs(tower.position.y - position.y) < GAME_CONFIG.GRID_SIZE / 2
      );

      selectTower(clickedTower);
    }
  };

  const handleCanvasHover = (position: Position | null) => {
    if (position && selectedTowerType) {
      const validPosition = VALID_TOWER_POSITIONS.find(
        pos => Math.abs(pos.x - position.x) < GAME_CONFIG.GRID_SIZE / 2 &&
               Math.abs(pos.y - position.y) < GAME_CONFIG.GRID_SIZE / 2
      );
      setHoveredCell(validPosition);
    } else {
      setHoveredCell(undefined);
    }
  };

  const handleTowerSelect = (type: TowerType | null) => {
    setSelectedTowerType(type);
    if (!type) {
      setHoveredCell(undefined);
    }
  };

  const handleResetGame = () => {
    resetGame();
    setSelectedTowerType(null);
    setShowGameOverModal(false);
    setShowVictoryModal(false);
    setShowLevelCompleteModal(false);
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <GameCanvas
            gameState={gameState}
            towers={towers}
            enemies={enemies}
            projectiles={projectiles}
            currentLevel={currentLevel}
            selectedTowerType={selectedTowerType}
            onCanvasClick={handleCanvasClick}
            onCanvasHover={handleCanvasHover}
          />
          
          {/* Game Status Overlays */}
          {showGameOverModal && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="bg-slate-900 p-8 rounded-lg border border-red-500 text-center">
                <h2 className="text-3xl font-bold text-red-400 mb-4">💀 Game Over!</h2>
                <p className="text-white mb-2">You defended for {gameState.wave - 1} waves</p>
                <p className="text-white mb-2">Final Score: {gameState.score.toLocaleString()}</p>
                <p className="text-white mb-6">Level Reached: {gameState.level}</p>
                <div className="space-y-2">
                  <button
                    onClick={handleResetGame}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => changeDifficulty('easy')}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Switch to Easy Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {showVictoryModal && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="bg-slate-900 p-8 rounded-lg border border-green-500 text-center">
                <h2 className="text-3xl font-bold text-green-400 mb-4">🏆 Victory!</h2>
                <p className="text-white mb-2">Congratulations! You've mastered the defense!</p>
                <p className="text-white mb-2">Final Score: {gameState.score.toLocaleString()}</p>
                <p className="text-white mb-6">Player Level: {gameState.playerLevel}</p>
                <div className="space-y-2">
                  <button
                    onClick={handleResetGame}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => {
                      changeDifficulty('hard');
                      handleResetGame();
                    }}
                    className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Try Hard Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {showLevelCompleteModal && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="bg-slate-900 p-8 rounded-lg border border-blue-500 text-center">
                <h2 className="text-3xl font-bold text-blue-400 mb-4">🎉 Level Complete!</h2>
                <p className="text-white mb-2">{currentLevel.name} Conquered!</p>
                <p className="text-white mb-2">Waves Survived: {currentLevel.waves.length}</p>
                <p className="text-white mb-2">Experience Gained: +{currentLevel.experienceReward}</p>
                <p className="text-white mb-6">Current Score: {gameState.score.toLocaleString()}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      nextLevel();
                      setShowLevelCompleteModal(false);
                    }}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Continue to Level {gameState.level + 1}
                  </button>
                  <button
                    onClick={handleResetGame}
                    className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Start New Game
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pause Overlay */}
          {gameState.gameStatus === 'paused' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-slate-900 p-6 rounded-lg border border-yellow-500 text-center">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">⏸️ Game Paused</h2>
                <p className="text-white mb-4">Click Resume to continue</p>
                <button
                  onClick={pauseGame}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Resume Game
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game UI Sidebar */}
      <GameUI
        gameState={gameState}
        selectedTowerType={selectedTowerType}
        currentLevel={currentLevel}
        onTowerSelect={handleTowerSelect}
        onStartWave={startWave}
        onPauseGame={pauseGame}
        onNextLevel={() => {
          nextLevel();
          setShowLevelCompleteModal(false);
        }}
        onUpgradeTower={upgradeTower}
        onUseSpecialAbility={useSpecialAbility}
        onChangeDifficulty={changeDifficulty}
        onResetGame={handleResetGame}
        getDynamicPrice={getDynamicPrice}
      />
    </div>
  );
};