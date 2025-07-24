import React from 'react';
import { GameState, Tower, TowerType, LevelConfig } from '../types/game';
import { TOWER_STATS, GAME_CONFIG } from '../config/gameConfig';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface GameUIProps {
  gameState: GameState;
  selectedTowerType: TowerType | null;
  currentLevel: LevelConfig;
  onTowerSelect: (type: TowerType | null) => void;
  onStartWave: () => void;
  onPauseGame: () => void;
  onNextLevel: () => void;
  onUpgradeTower: (towerId: string) => void;
  onUseSpecialAbility: (abilityType: string) => void;
  onChangeDifficulty: (difficulty: 'easy' | 'normal' | 'hard' | 'nightmare') => void;
  onResetGame: () => void;
  getDynamicPrice: (baseCost: number) => number;
}

export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  selectedTowerType,
  currentLevel,
  onTowerSelect,
  onStartWave,
  onPauseGame,
  onNextLevel,
  onUpgradeTower,
  onUseSpecialAbility,
  onChangeDifficulty,
  onResetGame,
  getDynamicPrice,
}) => {
  const getAbilityCooldownPercent = (abilityType: string) => {
    const ability = gameState.specialAbilities.find(a => a.type === abilityType);
    if (!ability) return 100;
    
    const currentTime = Date.now();
    const timeSinceLastUse = currentTime - ability.lastUsed;
    const cooldownPercent = Math.min(100, (timeSinceLastUse / ability.cooldown) * 100);
    return cooldownPercent;
  };

  const canUseAbility = (abilityType: string) => {
    const ability = gameState.specialAbilities.find(a => a.type === abilityType);
    if (!ability) return false;
    
    const currentTime = Date.now();
    const canAfford = gameState.gold >= ability.cost;
    const cooldownReady = currentTime - ability.lastUsed >= ability.cooldown;
    
    return canAfford && cooldownReady;
  };

  const getPlayerLevelProgress = () => {
    const expNeeded = gameState.playerLevel * 200;
    return (gameState.experience / expNeeded) * 100;
  };

  const unlockedAchievements = gameState.achievements.filter(a => a.unlocked);

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 p-4 overflow-y-auto">
      <Tabs defaultValue="towers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="towers">Towers</TabsTrigger>
          <TabsTrigger value="abilities">Abilities</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="achievements">Awards</TabsTrigger>
        </TabsList>

        {/* Game Status Header */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{currentLevel.name}</h2>
            <Badge variant="outline" className="text-amber-400 border-amber-400">
              {gameState.difficulty.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-800 p-2 rounded">
              <div className="text-amber-400">💰 Gold</div>
              <div className="text-white font-bold">{gameState.gold}</div>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <div className="text-red-400">❤️ Lives</div>
              <div className="text-white font-bold">{gameState.lives}</div>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <div className="text-blue-400">🌊 Wave</div>
              <div className="text-white font-bold">{gameState.wave}/{currentLevel.waves.length}</div>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <div className="text-purple-400">📊 Score</div>
              <div className="text-white font-bold">{gameState.score.toLocaleString()}</div>
            </div>
          </div>

          {/* Player Level Progress */}
          <div className="bg-slate-800 p-2 rounded">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-400">Level {gameState.playerLevel}</span>
              <span className="text-gray-400">{gameState.experience}/{gameState.playerLevel * 200} XP</span>
            </div>
            <Progress value={getPlayerLevelProgress()} className="h-2" />
          </div>

          {/* Game Controls */}
          <div className="flex gap-2">
            {gameState.gameStatus === 'preparing' && (
              <Button onClick={onStartWave} className="flex-1 bg-green-600 hover:bg-green-700">
                Start Wave
              </Button>
            )}
            {gameState.gameStatus === 'playing' && (
              <Button onClick={onPauseGame} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                Pause
              </Button>
            )}
            {gameState.gameStatus === 'paused' && (
              <Button onClick={onPauseGame} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Resume
              </Button>
            )}
            {gameState.gameStatus === 'levelComplete' && (
              <Button onClick={onNextLevel} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Next Level
              </Button>
            )}
            {(gameState.gameStatus === 'gameOver' || gameState.gameStatus === 'victory') && (
              <Button onClick={onResetGame} className="flex-1 bg-red-600 hover:bg-red-700">
                New Game
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="towers" className="space-y-4">
          {/* Tower Shop */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Tower Shop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(TOWER_STATS).map(([type, stats]) => {
                const isUnlocked = gameState.unlockedTowers.includes(type as TowerType);
                const cost = getDynamicPrice(stats.cost);
                const canAfford = gameState.gold >= cost;
                const isSelected = selectedTowerType === type;

                return (
                  <div
                    key={type}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-900/30'
                        : isUnlocked && canAfford
                        ? 'border-slate-600 bg-slate-800 hover:border-slate-500'
                        : 'border-slate-700 bg-slate-800/50 opacity-50'
                    }`}
                    onClick={() => isUnlocked && canAfford && onTowerSelect(isSelected ? null : type as TowerType)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-white">{stats.name}</div>
                        {!isUnlocked && (
                          <Badge variant="secondary" className="text-xs">
                            Unlock Lv.{stats.unlockLevel}
                          </Badge>
                        )}
                      </div>
                      <div className="text-amber-400 font-bold">${cost}</div>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{stats.description}</div>
                    {stats.special && (
                      <div className="text-xs text-blue-400 mb-2">⚡ {stats.special}</div>
                    )}
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-red-400">⚔️ {stats.damage}</div>
                      <div className="text-green-400">🎯 {stats.range}</div>
                      <div className="text-yellow-400">⚡ {(1000/stats.attackSpeed).toFixed(1)}/s</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Selected Tower Info */}
          {gameState.selectedTower && (
            <Card>
              <CardHeader>
                <CardTitle className="text-white">Tower Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">
                      {TOWER_STATS[gameState.selectedTower.type].name}
                    </span>
                    <Badge variant="outline">Level {gameState.selectedTower.level}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-red-400">Damage</div>
                      <div className="text-white font-bold">{gameState.selectedTower.damage}</div>
                    </div>
                    <div>
                      <div className="text-green-400">Range</div>
                      <div className="text-white font-bold">{gameState.selectedTower.range}</div>
                    </div>
                    <div>
                      <div className="text-yellow-400">Speed</div>
                      <div className="text-white font-bold">
                        {(1000/gameState.selectedTower.attackSpeed).toFixed(1)}/s
                      </div>
                    </div>
                    <div>
                      <div className="text-purple-400">Kills</div>
                      <div className="text-white font-bold">{gameState.selectedTower.kills}</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => onUpgradeTower(gameState.selectedTower!.id)}
                    disabled={gameState.gold < getDynamicPrice(TOWER_STATS[gameState.selectedTower.type].upgradeCost * gameState.selectedTower.level)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Upgrade (${getDynamicPrice(TOWER_STATS[gameState.selectedTower.type].upgradeCost * gameState.selectedTower.level)})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="abilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Special Abilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gameState.specialAbilities.map((ability) => {
                const cooldownPercent = getAbilityCooldownPercent(ability.type);
                const canUse = canUseAbility(ability.type);
                
                const abilityInfo = {
                  airstrike: { name: '💥 Airstrike', desc: 'Damage all enemies' },
                  freeze_all: { name: '❄️ Freeze All', desc: 'Slow all enemies' },
                  gold_boost: { name: '💰 Gold Rush', desc: 'Instant +200 gold' },
                  repair: { name: '🔧 Repair', desc: 'Restore 5 lives' },
                }[ability.type] || { name: ability.type, desc: 'Special ability' };

                return (
                  <div key={ability.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-semibold">{abilityInfo.name}</div>
                        <div className="text-xs text-gray-400">{abilityInfo.desc}</div>
                      </div>
                      <div className="text-amber-400 font-bold">${ability.cost}</div>
                    </div>
                    
                    <Progress value={cooldownPercent} className="h-2" />
                    
                    <Button
                      onClick={() => onUseSpecialAbility(ability.type)}
                      disabled={!canUse}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                      size="sm"
                    >
                      {cooldownPercent < 100 ? 
                        `Cooldown: ${Math.ceil((ability.cooldown - (Date.now() - ability.lastUsed)) / 1000)}s` :
                        'Use Ability'
                      }
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Difficulty Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {(['easy', 'normal', 'hard', 'nightmare'] as const).map((diff) => (
                  <Button
                    key={diff}
                    onClick={() => onChangeDifficulty(diff)}
                    variant={gameState.difficulty === diff ? 'default' : 'outline'}
                    size="sm"
                    className={`${
                      diff === 'easy' ? 'text-green-400' :
                      diff === 'normal' ? 'text-blue-400' :
                      diff === 'hard' ? 'text-orange-400' : 'text-red-400'
                    }`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Game Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-blue-400">Current Level</div>
                  <div className="text-white font-bold">{gameState.level}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-green-400">Player Level</div>
                  <div className="text-white font-bold">{gameState.playerLevel}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-purple-400">Total Score</div>
                  <div className="text-white font-bold">{gameState.score.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-amber-400">Experience</div>
                  <div className="text-white font-bold">{gameState.experience}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-white font-semibold">Unlocked Towers</div>
                <div className="flex flex-wrap gap-1">
                  {gameState.unlockedTowers.map(tower => (
                    <Badge key={tower} variant="secondary" className="text-xs">
                      {TOWER_STATS[tower].name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-white font-semibold">Level Progress</div>
                <div className="text-sm text-gray-400">{currentLevel.description}</div>
                <Progress 
                  value={(gameState.wave / currentLevel.waves.length) * 100} 
                  className="h-2" 
                />
                <div className="text-xs text-gray-400">
                  Wave {gameState.wave} of {currentLevel.waves.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">
                Achievements ({unlockedAchievements.length}/{gameState.achievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gameState.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded border ${
                    achievement.unlocked
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className={`font-semibold ${achievement.unlocked ? 'text-green-400' : 'text-white'}`}>
                        {achievement.unlocked ? '🏆' : '🔒'} {achievement.name}
                      </div>
                      <div className="text-xs text-gray-400">{achievement.description}</div>
                    </div>
                    {achievement.unlocked && (
                      <Badge variant="outline" className="text-amber-400 border-amber-400">
                        +${achievement.reward}
                      </Badge>
                    )}
                  </div>
                  
                  {!achievement.unlocked && (
                    <div className="space-y-1">
                      <Progress 
                        value={(achievement.progress / achievement.target) * 100} 
                        className="h-2" 
                      />
                      <div className="text-xs text-gray-400">
                        {achievement.progress}/{achievement.target}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};