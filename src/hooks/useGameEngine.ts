import { useState, useEffect, useCallback, useRef } from 'react';
import { Tower, Enemy, Projectile, GameState, TowerType, Position, LevelConfig, Achievement } from '../types/game';
import { GAME_CONFIG, TOWER_STATS, ENEMY_STATS, generateLevel, ACHIEVEMENTS, SPECIAL_ABILITIES } from '../config/gameConfig';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>({
    gold: GAME_CONFIG.STARTING_GOLD,
    lives: GAME_CONFIG.STARTING_LIVES,
    wave: 1,
    level: 1,
    score: 0,
    gameStatus: 'preparing',
    showRange: false,
    difficulty: 'normal',
    experience: 0,
    playerLevel: 1,
    unlockedTowers: ['basic', 'cannon'],
    achievements: [...ACHIEVEMENTS],
    specialAbilities: [...SPECIAL_ABILITIES],
  });

  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(generateLevel(1));
  
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const waveSpawnRef = useRef<{
    enemyIndex: number;
    typeIndex: number;
    lastSpawn: number;
    spawnCount: number;
  }>({
    enemyIndex: 0,
    typeIndex: 0,
    lastSpawn: 0,
    spawnCount: 0,
  });

  // Calculate dynamic pricing based on level and difficulty
  const getDynamicPrice = useCallback((baseCost: number) => {
    const levelMultiplier = 1 + (gameState.level - 1) * 0.15;
    const difficultyMultiplier = {
      easy: 0.8,
      normal: 1.0,
      hard: 1.3,
      nightmare: 1.6,
    }[gameState.difficulty];
    
    return Math.floor(baseCost * levelMultiplier * difficultyMultiplier);
  }, [gameState.level, gameState.difficulty]);

  // Update achievements
  const updateAchievement = useCallback((achievementId: string, progress: number) => {
    setGameState(prev => ({
      ...prev,
      achievements: prev.achievements.map(achievement => {
        if (achievement.id === achievementId && !achievement.unlocked) {
          const newProgress = Math.min(achievement.target, achievement.progress + progress);
          const unlocked = newProgress >= achievement.target;
          
          if (unlocked && !achievement.unlocked) {
            // Award achievement reward
            setTimeout(() => {
              setGameState(gs => ({ ...gs, gold: gs.gold + achievement.reward }));
            }, 100);
          }
          
          return { ...achievement, progress: newProgress, unlocked };
        }
        return achievement;
      }),
    }));
  }, []);

  // Add experience and level up
  const addExperience = useCallback((exp: number) => {
    setGameState(prev => {
      const newExp = prev.experience + exp;
      const expNeeded = prev.playerLevel * 200;
      
      if (newExp >= expNeeded && prev.playerLevel < GAME_CONFIG.MAX_PLAYER_LEVEL) {
        const newPlayerLevel = prev.playerLevel + 1;
        const newUnlockedTowers = [...prev.unlockedTowers];
        
        // Unlock new towers based on level
        Object.entries(TOWER_STATS).forEach(([type, stats]) => {
          if (stats.unlockLevel <= newPlayerLevel && !newUnlockedTowers.includes(type as TowerType)) {
            newUnlockedTowers.push(type as TowerType);
          }
        });
        
        return {
          ...prev,
          experience: newExp - expNeeded,
          playerLevel: newPlayerLevel,
          unlockedTowers: newUnlockedTowers,
          gold: prev.gold + 100, // Level up bonus
        };
      }
      
      return { ...prev, experience: newExp };
    });
  }, []);

  const damageEnemy = useCallback((enemyId: string, damage: number, effectType?: 'slow' | 'burn' | 'freeze' | 'poison') => {
    setEnemies(prev => prev.map(enemy => {
      if (enemy.id === enemyId) {
        const actualDamage = Math.max(1, damage - enemy.armor);
        const newHealth = enemy.health - actualDamage;
        
        // Apply effects
        const newEffects = [...enemy.effects];
        if (effectType) {
          const existingEffect = newEffects.find(e => e.type === effectType);
          if (existingEffect) {
            existingEffect.duration = Math.max(existingEffect.duration, 3000);
          } else {
            newEffects.push({
              type: effectType,
              duration: 3000,
              strength: effectType === 'slow' ? 0.5 : 10,
            });
          }
        }
        
        if (newHealth <= 0) {
          // Enemy killed, award gold and experience
          const goldReward = Math.floor(enemy.reward * currentLevel.goldMultiplier);
          setGameState(gs => ({ 
            ...gs, 
            gold: gs.gold + goldReward,
            score: gs.score + goldReward * 10,
          }));
          
          addExperience(enemy.type === 'boss' ? 50 : 10);
          updateAchievement('first_kill', 1);
          updateAchievement('gold_collector', goldReward);
          
          return null;
        }
        
        return { ...enemy, health: newHealth, effects: newEffects };
      }
      return enemy;
    }).filter(Boolean) as Enemy[]);
  }, [currentLevel.goldMultiplier, addExperience, updateAchievement]);

  const createProjectile = useCallback((tower: Tower, target: Enemy) => {
    const piercing = tower.type === 'laser';
    const splash = tower.type === 'cannon' || tower.type === 'missile';
    
    const newProjectile: Projectile = {
      id: `projectile-${Date.now()}-${Math.random()}`,
      position: { ...tower.position },
      target,
      damage: tower.damage,
      speed: tower.type === 'missile' ? 8 : tower.type === 'laser' ? 12 : 6,
      type: tower.type === 'basic' ? 'bullet' : 
            tower.type === 'cannon' ? 'cannonball' :
            tower.type === 'laser' ? 'laser' : 
            tower.type === 'ice' ? 'ice' :
            tower.type === 'poison' ? 'poison' :
            tower.type === 'lightning' ? 'lightning' :
            tower.type === 'missile' ? 'missile' : 'tesla',
      piercing,
      splash,
    };

    setProjectiles(prev => [...prev, newProjectile]);
  }, []);

  const spawnEnemies = useCallback((currentTime: number) => {
    const waveConfig = currentLevel.waves[gameState.wave - 1];
    if (!waveConfig) return;

    const spawn = waveSpawnRef.current;
    if (spawn.typeIndex >= waveConfig.enemies.length) return;

    const currentEnemyType = waveConfig.enemies[spawn.typeIndex];
    
    if (currentTime - spawn.lastSpawn >= currentEnemyType.delay) {
      if (spawn.spawnCount < currentEnemyType.count) {
        const enemyStats = ENEMY_STATS[currentEnemyType.type];
        const healthMultiplier = 1 + (gameState.level - 1) * 0.2;
        
        const newEnemy: Enemy = {
          id: `enemy-${Date.now()}-${Math.random()}`,
          type: currentEnemyType.type,
          position: { ...currentLevel.path[0] },
          health: Math.floor(enemyStats.health * healthMultiplier),
          maxHealth: Math.floor(enemyStats.health * healthMultiplier),
          speed: enemyStats.speed,
          reward: enemyStats.reward,
          pathIndex: 0,
          pathProgress: 0,
          effects: [],
          armor: enemyStats.armor,
          flying: enemyStats.flying,
        };

        setEnemies(prev => [...prev, newEnemy]);
        spawn.lastSpawn = currentTime;
        spawn.spawnCount++;
      } else {
        // Move to next enemy type
        spawn.typeIndex++;
        spawn.spawnCount = 0;
      }
    }
  }, [gameState.wave, gameState.level, currentLevel]);

  const updateEnemies = useCallback((deltaTime: number) => {
    setEnemies(prev => prev.map(enemy => {
      if (enemy.pathIndex >= currentLevel.path.length - 1) {
        // Enemy reached the end
        setGameState(gs => ({ ...gs, lives: gs.lives - 1 }));
        return null;
      }

      // Apply effects
      let currentSpeed = enemy.speed;
      const newEffects = enemy.effects.map(effect => {
        if (effect.type === 'slow') {
          currentSpeed *= effect.strength;
        } else if (effect.type === 'burn' || effect.type === 'poison') {
          // Damage over time
          if (Math.random() < 0.1) { // 10% chance per frame
            damageEnemy(enemy.id, effect.strength);
          }
        }
        return { ...effect, duration: effect.duration - deltaTime };
      }).filter(effect => effect.duration > 0);

      const currentTarget = currentLevel.path[enemy.pathIndex + 1];
      const direction = {
        x: currentTarget.x - enemy.position.x,
        y: currentTarget.y - enemy.position.y,
      };
      const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

      if (distance < 5) {
        // Reached current target, move to next
        return {
          ...enemy,
          pathIndex: enemy.pathIndex + 1,
          position: { ...currentTarget },
          effects: newEffects,
        };
      }

      // Move towards target
      const normalizedDirection = {
        x: direction.x / distance,
        y: direction.y / distance,
      };

      const moveDistance = currentSpeed * (deltaTime / 16.67);

      return {
        ...enemy,
        position: {
          x: enemy.position.x + normalizedDirection.x * moveDistance,
          y: enemy.position.y + normalizedDirection.y * moveDistance,
        },
        effects: newEffects,
      };
    }).filter(Boolean) as Enemy[]);
  }, [currentLevel.path, damageEnemy]);

  const updateTowers = useCallback((currentTime: number) => {
    setTowers(prev => prev.map(tower => {
      // Find target
      const enemiesInRange = enemies.filter(enemy => {
        // Check if tower can target flying enemies
        if (enemy.flying && !['laser', 'missile', 'lightning'].includes(tower.type)) {
          return false;
        }
        
        const distance = Math.sqrt(
          Math.pow(enemy.position.x - tower.position.x, 2) +
          Math.pow(enemy.position.y - tower.position.y, 2)
        );
        return distance <= tower.range;
      });

      if (enemiesInRange.length === 0) {
        return { ...tower, target: undefined };
      }

      // Target the enemy furthest along the path
      const target = enemiesInRange.reduce((furthest, current) => 
        current.pathIndex > furthest.pathIndex ? current : furthest
      );

      // Attack if ready
      if (currentTime - tower.lastAttack >= tower.attackSpeed) {
        createProjectile(tower, target);
        
        // Update tower kills for achievements
        const updatedTower = { 
          ...tower, 
          target, 
          lastAttack: currentTime,
          kills: tower.kills + (target.health <= tower.damage ? 1 : 0)
        };
        
        return updatedTower;
      }

      return { ...tower, target };
    }));
  }, [enemies, createProjectile]);

  const updateProjectiles = useCallback((deltaTime: number) => {
    setProjectiles(prev => prev.map(projectile => {
      const direction = {
        x: projectile.target.position.x - projectile.position.x,
        y: projectile.target.position.y - projectile.position.y,
      };
      const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

      if (distance < 15) {
        // Hit target
        const effectType = projectile.type === 'ice' ? 'slow' :
                          projectile.type === 'poison' ? 'poison' :
                          projectile.type === 'lightning' ? 'burn' : undefined;
        
        damageEnemy(projectile.target.id, projectile.damage, effectType);
        
        // Handle splash damage
        if (projectile.splash) {
          enemies.forEach(enemy => {
            if (enemy.id !== projectile.target.id) {
              const splashDistance = Math.sqrt(
                Math.pow(enemy.position.x - projectile.target.position.x, 2) +
                Math.pow(enemy.position.y - projectile.target.position.y, 2)
              );
              if (splashDistance <= 60) {
                damageEnemy(enemy.id, Math.floor(projectile.damage * 0.5), effectType);
              }
            }
          });
        }
        
        // Handle piercing
        if (projectile.piercing) {
          enemies.forEach(enemy => {
            if (enemy.id !== projectile.target.id) {
              const pierceDistance = Math.sqrt(
                Math.pow(enemy.position.x - projectile.position.x, 2) +
                Math.pow(enemy.position.y - projectile.position.y, 2)
              );
              if (pierceDistance <= 20) {
                damageEnemy(enemy.id, Math.floor(projectile.damage * 0.7), effectType);
              }
            }
          });
        }
        
        return null;
      }

      const normalizedDirection = {
        x: direction.x / distance,
        y: direction.y / distance,
      };

      const moveDistance = projectile.speed * (deltaTime / 16.67);

      return {
        ...projectile,
        position: {
          x: projectile.position.x + normalizedDirection.x * moveDistance,
          y: projectile.position.y + normalizedDirection.y * moveDistance,
        },
      };
    }).filter(Boolean) as Projectile[]);
  }, [damageEnemy, enemies]);

  const checkGameConditions = useCallback(() => {
    if (gameState.lives <= 0) {
      setGameState(gs => ({ ...gs, gameStatus: 'gameOver' }));
      return;
    }

    // Check if wave is complete
    const waveConfig = currentLevel.waves[gameState.wave - 1];
    if (waveConfig && enemies.length === 0) {
      const spawn = waveSpawnRef.current;
      const allEnemiesSpawned = spawn.typeIndex >= waveConfig.enemies.length;
      
      if (allEnemiesSpawned) {
        updateAchievement('wave_survivor', 1);
        
        if (gameState.wave >= currentLevel.waves.length) {
          // Level complete
          setGameState(gs => ({ 
            ...gs, 
            gameStatus: 'levelComplete',
            gold: gs.gold + waveConfig.reward,
          }));
          
          addExperience(currentLevel.experienceReward);
          updateAchievement('level_conqueror', 1);
          
          // Check for perfect defense achievement
          if (gameState.lives === GAME_CONFIG.STARTING_LIVES) {
            updateAchievement('perfect_defense', 1);
          }
        } else {
          // Prepare next wave
          setGameState(gs => ({ 
            ...gs, 
            gameStatus: 'preparing',
            wave: gs.wave + 1,
            gold: gs.gold + waveConfig.reward,
          }));
          
          // Reset spawn tracking
          waveSpawnRef.current = {
            enemyIndex: 0,
            typeIndex: 0,
            lastSpawn: 0,
            spawnCount: 0,
          };
        }
      }
    }
  }, [gameState.lives, gameState.wave, enemies.length, currentLevel, addExperience, updateAchievement]);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (gameState.gameStatus === 'playing') {
      spawnEnemies(currentTime);
      updateEnemies(deltaTime);
      updateTowers(currentTime);
      updateProjectiles(deltaTime);
      checkGameConditions();
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.gameStatus, spawnEnemies, updateEnemies, updateTowers, updateProjectiles, checkGameConditions]);

  // Game controls
  const startWave = () => {
    setGameState(gs => ({ ...gs, gameStatus: 'playing' }));
  };

  const pauseGame = () => {
    setGameState(gs => ({ 
      ...gs, 
      gameStatus: gs.gameStatus === 'paused' ? 'playing' : 'paused' 
    }));
  };

  const nextLevel = () => {
    const newLevel = gameState.level + 1;
    const newLevelConfig = generateLevel(newLevel);
    
    setCurrentLevel(newLevelConfig);
    setGameState(gs => ({ 
      ...gs, 
      level: newLevel,
      wave: 1,
      gameStatus: 'preparing',
      lives: GAME_CONFIG.STARTING_LIVES,
    }));
    
    setTowers([]);
    setEnemies([]);
    setProjectiles([]);
    
    waveSpawnRef.current = {
      enemyIndex: 0,
      typeIndex: 0,
      lastSpawn: 0,
      spawnCount: 0,
    };
  };

  const placeTower = (position: Position, type: TowerType) => {
    const towerStats = TOWER_STATS[type];
    const cost = getDynamicPrice(towerStats.cost);
    
    if (gameState.gold < cost || !gameState.unlockedTowers.includes(type)) return false;

    const newTower: Tower = {
      id: `tower-${Date.now()}-${Math.random()}`,
      type,
      position,
      level: 1,
      damage: towerStats.damage,
      range: towerStats.range,
      attackSpeed: towerStats.attackSpeed,
      cost,
      lastAttack: 0,
      kills: 0,
    };

    setTowers(prev => [...prev, newTower]);
    setGameState(gs => ({ ...gs, gold: gs.gold - cost }));
    updateAchievement('tower_master', 1);
    return true;
  };

  const upgradeTower = (towerId: string) => {
    const tower = towers.find(t => t.id === towerId);
    if (!tower) return false;

    const towerStats = TOWER_STATS[tower.type];
    const upgradeCost = getDynamicPrice(towerStats.upgradeCost * tower.level);
    
    if (gameState.gold < upgradeCost) return false;

    setTowers(prev => prev.map(t => {
      if (t.id === towerId) {
        return {
          ...t,
          level: t.level + 1,
          damage: Math.floor(t.damage * 1.4),
          range: Math.floor(t.range * 1.1),
          attackSpeed: Math.floor(t.attackSpeed * 0.85),
        };
      }
      return t;
    }));

    setGameState(gs => ({ ...gs, gold: gs.gold - upgradeCost }));
    updateAchievement('upgrade_expert', 1);
    return true;
  };

  const useSpecialAbility = (abilityType: string) => {
    const ability = gameState.specialAbilities.find(a => a.type === abilityType);
    if (!ability || gameState.gold < ability.cost) return false;

    const currentTime = Date.now();
    if (currentTime - ability.lastUsed < ability.cooldown) return false;

    // Execute ability effect
    switch (abilityType) {
      case 'airstrike':
        enemies.forEach(enemy => {
          damageEnemy(enemy.id, 200);
        });
        break;
      case 'freeze_all':
        setEnemies(prev => prev.map(enemy => ({
          ...enemy,
          effects: [...enemy.effects, { type: 'freeze', duration: 5000, strength: 0.1 }],
        })));
        break;
      case 'gold_boost':
        setGameState(gs => ({ ...gs, gold: gs.gold + 200 }));
        break;
      case 'repair':
        setGameState(gs => ({ ...gs, lives: Math.min(gs.lives + 5, GAME_CONFIG.STARTING_LIVES) }));
        break;
    }

    // Update ability cooldown and cost
    setGameState(gs => ({
      ...gs,
      gold: gs.gold - ability.cost,
      specialAbilities: gs.specialAbilities.map(a => 
        a.type === abilityType ? { ...a, lastUsed: currentTime } : a
      ),
    }));

    return true;
  };

  const selectTower = (tower: Tower | undefined) => {
    setGameState(gs => ({ ...gs, selectedTower: tower }));
  };

  const setHoveredCell = (position: Position | undefined) => {
    setGameState(gs => ({ ...gs, hoveredCell: position }));
  };

  const changeDifficulty = (difficulty: 'easy' | 'normal' | 'hard' | 'nightmare') => {
    setGameState(gs => ({ ...gs, difficulty }));
  };

  const resetGame = () => {
    setGameState({
      gold: GAME_CONFIG.STARTING_GOLD,
      lives: GAME_CONFIG.STARTING_LIVES,
      wave: 1,
      level: 1,
      score: 0,
      gameStatus: 'preparing',
      showRange: false,
      difficulty: 'normal',
      experience: 0,
      playerLevel: 1,
      unlockedTowers: ['basic', 'cannon'],
      achievements: [...ACHIEVEMENTS],
      specialAbilities: [...SPECIAL_ABILITIES],
    });
    setTowers([]);
    setEnemies([]);
    setProjectiles([]);
    setCurrentLevel(generateLevel(1));
    waveSpawnRef.current = {
      enemyIndex: 0,
      typeIndex: 0,
      lastSpawn: 0,
      spawnCount: 0,
    };
  };

  // Start game loop
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  return {
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
  };
};