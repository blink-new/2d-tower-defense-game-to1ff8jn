import React, { useRef, useEffect } from 'react';
import { GameState, Tower, Enemy, Projectile, TowerType, Position, LevelConfig } from '../types/game';
import { GAME_CONFIG, TOWER_STATS, ENEMY_STATS, VALID_TOWER_POSITIONS } from '../config/gameConfig';

interface GameCanvasProps {
  gameState: GameState;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  currentLevel: LevelConfig;
  selectedTowerType: TowerType | null;
  onCanvasClick: (position: Position) => void;
  onCanvasHover: (position: Position | null) => void;
}

const drawGrid = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x <= GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y <= GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
    ctx.stroke();
  }
};

const drawPath = (ctx: CanvasRenderingContext2D, path: Position[]) => {
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 30;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  
  ctx.stroke();
  
  // Draw path direction arrows
  ctx.fillStyle = '#4b5563';
  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(8, 0);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
};

const drawValidTowerPositions = (ctx: CanvasRenderingContext2D, towers: Tower[]) => {
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.lineWidth = 1;
  
  VALID_TOWER_POSITIONS.forEach(pos => {
    // Check if there's already a tower at this position
    const hasTower = towers.some(tower => 
      Math.abs(tower.position.x - pos.x) < GAME_CONFIG.GRID_SIZE / 2 &&
      Math.abs(tower.position.y - pos.y) < GAME_CONFIG.GRID_SIZE / 2
    );
    
    if (!hasTower) {
      const gridX = pos.x - GAME_CONFIG.GRID_SIZE / 2;
      const gridY = pos.y - GAME_CONFIG.GRID_SIZE / 2;
      
      ctx.fillRect(gridX, gridY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
      ctx.strokeRect(gridX, gridY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
    }
  });
};

const drawTowerRange = (ctx: CanvasRenderingContext2D, tower: Tower) => {
  ctx.strokeStyle = '#3b82f6';
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
};

const drawHoveredCell = (ctx: CanvasRenderingContext2D, position: Position, towerType: TowerType | null) => {
  const gridX = position.x - GAME_CONFIG.GRID_SIZE / 2;
  const gridY = position.y - GAME_CONFIG.GRID_SIZE / 2;
  
  if (towerType) {
    const towerStats = TOWER_STATS[towerType];
    
    // Draw placement preview
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fillRect(gridX, gridY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
    
    // Draw range preview
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.arc(position.x, position.y, towerStats.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw tower preview
    ctx.fillStyle = towerStats.color;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(position.x, position.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(gridX, gridY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
  }
};

const drawTower = (ctx: CanvasRenderingContext2D, tower: Tower, isSelected: boolean) => {
  const towerStats = TOWER_STATS[tower.type];
  
  // Tower base with level-based size
  const baseSize = 15 + (tower.level - 1) * 2;
  ctx.fillStyle = isSelected ? '#fbbf24' : towerStats.color;
  ctx.strokeStyle = isSelected ? '#f59e0b' : '#1f2937';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.arc(tower.position.x, tower.position.y, baseSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Tower weapon based on type
  ctx.fillStyle = '#1f2937';
  switch (tower.type) {
    case 'cannon':
      ctx.fillRect(tower.position.x - 3, tower.position.y - 10, 6, 20);
      break;
    case 'laser':
      ctx.fillRect(tower.position.x - 1, tower.position.y - 12, 2, 24);
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(tower.position.x - 0.5, tower.position.y - 12, 1, 24);
      break;
    case 'ice':
      // Draw crystal-like structure
      ctx.beginPath();
      ctx.moveTo(tower.position.x, tower.position.y - 10);
      ctx.lineTo(tower.position.x + 5, tower.position.y);
      ctx.lineTo(tower.position.x, tower.position.y + 10);
      ctx.lineTo(tower.position.x - 5, tower.position.y);
      ctx.closePath();
      ctx.fill();
      break;
    case 'missile':
      // Draw missile launcher
      ctx.fillRect(tower.position.x - 4, tower.position.y - 8, 8, 16);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(tower.position.x - 2, tower.position.y - 6, 4, 12);
      break;
    default:
      ctx.fillRect(tower.position.x - 2, tower.position.y - 8, 4, 16);
  }
  
  // Level indicator
  if (tower.level > 1) {
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(tower.level.toString(), tower.position.x, tower.position.y - 25);
  }
  
  // Kill count for high-performing towers
  if (tower.kills > 10) {
    ctx.fillStyle = '#10b981';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${tower.kills}`, tower.position.x, tower.position.y + 30);
  }
  
  // Target line
  if (tower.target) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tower.position.x, tower.position.y);
    ctx.lineTo(tower.target.position.x, tower.target.position.y);
    ctx.stroke();
  }
};

const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
  const enemyStats = ENEMY_STATS[enemy.type];
  
  // Apply visual effects
  let enemyColor = enemyStats.color;
  let glowColor = '';
  
  enemy.effects.forEach(effect => {
    switch (effect.type) {
      case 'slow':
        glowColor = '#06b6d4';
        break;
      case 'burn':
        glowColor = '#ef4444';
        break;
      case 'poison':
        glowColor = '#22c55e';
        break;
      case 'freeze':
        enemyColor = '#93c5fd';
        glowColor = '#3b82f6';
        break;
    }
  });
  
  // Draw glow effect if present
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
  }
  
  // Enemy body
  ctx.fillStyle = enemyColor;
  ctx.strokeStyle = enemy.armor > 0 ? '#6b7280' : '#1f2937';
  ctx.lineWidth = enemy.armor > 0 ? 3 : 1;
  
  const size = enemy.type === 'boss' ? 16 : 
               enemy.type === 'heavy' ? 12 : 
               enemy.type === 'swarm' ? 6 : 8;
  
  if (enemy.flying) {
    // Draw diamond for flying enemies
    ctx.beginPath();
    ctx.moveTo(enemy.position.x, enemy.position.y - size);
    ctx.lineTo(enemy.position.x + size, enemy.position.y);
    ctx.lineTo(enemy.position.x, enemy.position.y + size);
    ctx.lineTo(enemy.position.x - size, enemy.position.y);
    ctx.closePath();
  } else if (enemy.type === 'boss') {
    // Draw hexagon for boss
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = enemy.position.x + size * Math.cos(angle);
      const y = enemy.position.y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else {
    // Draw circle for ground enemies
    ctx.beginPath();
    ctx.arc(enemy.position.x, enemy.position.y, size, 0, Math.PI * 2);
  }
  
  ctx.fill();
  ctx.stroke();
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Armor indicator
  if (enemy.armor > 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${enemy.armor}`, enemy.position.x, enemy.position.y - size - 8);
  }
  
  // Health bar
  const barWidth = Math.max(20, size * 2);
  const barHeight = 4;
  const healthPercent = enemy.health / enemy.maxHealth;
  
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(enemy.position.x - barWidth / 2, enemy.position.y - size - 20, barWidth, barHeight);
  
  ctx.fillStyle = healthPercent > 0.6 ? '#10b981' : 
                  healthPercent > 0.3 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(enemy.position.x - barWidth / 2, enemy.position.y - size - 20, barWidth * healthPercent, barHeight);
  
  // Effect indicators
  let effectY = enemy.position.y + size + 8;
  enemy.effects.forEach(effect => {
    const effectIcon = {
      slow: '❄️',
      burn: '🔥',
      poison: '☠️',
      freeze: '🧊',
    }[effect.type];
    
    if (effectIcon) {
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(effectIcon, enemy.position.x, effectY);
      effectY += 12;
    }
  });
};

const drawProjectile = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  const colors = {
    bullet: '#3b82f6',
    cannonball: '#ef4444',
    laser: '#8b5cf6',
    ice: '#06b6d4',
    poison: '#22c55e',
    lightning: '#eab308',
    missile: '#f97316',
    tesla: '#a855f7',
  };
  
  ctx.fillStyle = colors[projectile.type] || '#3b82f6';
  
  const size = projectile.type === 'cannonball' ? 8 :
               projectile.type === 'missile' ? 10 : 4;
  
  // Special effects for different projectile types
  if (projectile.type === 'laser' || projectile.type === 'tesla') {
    ctx.shadowColor = colors[projectile.type];
    ctx.shadowBlur = 15;
  }
  
  if (projectile.type === 'missile') {
    // Draw missile with trail
    const angle = Math.atan2(
      projectile.target.position.y - projectile.position.y,
      projectile.target.position.x - projectile.position.x
    );
    
    ctx.save();
    ctx.translate(projectile.position.x, projectile.position.y);
    ctx.rotate(angle);
    
    // Missile body
    ctx.fillRect(-8, -3, 16, 6);
    
    // Missile tip
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(12, -2);
    ctx.lineTo(12, 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(projectile.position.x, projectile.position.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Reset shadow
  ctx.shadowBlur = 0;
};

const drawBackground = (ctx: CanvasRenderingContext2D, level: LevelConfig) => {
  // Create gradient background based on level
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
  gradient.addColorStop(0, level.background);
  gradient.addColorStop(1, '#0f172a');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  towers,
  enemies,
  projectiles,
  currentLevel,
  selectedTowerType,
  onCanvasClick,
  onCanvasHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    drawBackground(ctx, currentLevel);

    // Draw grid
    drawGrid(ctx);
    
    // Draw path
    drawPath(ctx, currentLevel.path);
    
    // Draw valid tower positions when placing
    if (selectedTowerType && gameState.gameStatus === 'preparing') {
      drawValidTowerPositions(ctx, towers);
    }
    
    // Draw tower ranges (if selected)
    if (gameState.selectedTower && gameState.showRange) {
      drawTowerRange(ctx, gameState.selectedTower);
    }
    
    // Draw hovered cell
    if (gameState.hoveredCell) {
      drawHoveredCell(ctx, gameState.hoveredCell, selectedTowerType);
    }
    
    // Draw towers
    towers.forEach(tower => drawTower(ctx, tower, tower.id === gameState.selectedTower?.id));
    
    // Draw enemies
    enemies.forEach(enemy => drawEnemy(ctx, enemy));
    
    // Draw projectiles
    projectiles.forEach(projectile => drawProjectile(ctx, projectile));

  }, [gameState, towers, enemies, projectiles, currentLevel, selectedTowerType]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    onCanvasClick({ x, y });
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    onCanvasHover({ x, y });
  };

  const handleCanvasMouseLeave = () => {
    onCanvasHover(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.CANVAS_WIDTH}
      height={GAME_CONFIG.CANVAS_HEIGHT}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      onMouseLeave={handleCanvasMouseLeave}
      className="border-2 border-slate-700 rounded-lg cursor-crosshair"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};