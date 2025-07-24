export interface Position {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  position: Position;
  level: number;
  damage: number;
  range: number;
  attackSpeed: number;
  cost: number;
  lastAttack: number;
  target?: Enemy;
  kills: number;
  specialAbility?: SpecialAbility;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  pathIndex: number;
  pathProgress: number;
  effects: EnemyEffect[];
  armor: number;
  flying: boolean;
}

export interface EnemyEffect {
  type: 'slow' | 'burn' | 'freeze' | 'poison';
  duration: number;
  strength: number;
}

export interface Projectile {
  id: string;
  position: Position;
  target: Enemy;
  damage: number;
  speed: number;
  type: ProjectileType;
  piercing?: boolean;
  splash?: boolean;
}

export interface SpecialAbility {
  type: 'airstrike' | 'freeze_all' | 'gold_boost' | 'repair';
  cooldown: number;
  lastUsed: number;
  cost: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  reward: number;
}

export interface GameState {
  gold: number;
  lives: number;
  wave: number;
  level: number;
  score: number;
  gameStatus: 'playing' | 'paused' | 'gameOver' | 'victory' | 'preparing' | 'levelComplete';
  selectedTower?: Tower;
  hoveredCell?: Position;
  showRange: boolean;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  experience: number;
  playerLevel: number;
  unlockedTowers: TowerType[];
  achievements: Achievement[];
  specialAbilities: SpecialAbility[];
}

export type TowerType = 'basic' | 'cannon' | 'laser' | 'ice' | 'poison' | 'lightning' | 'missile' | 'tesla';
export type EnemyType = 'basic' | 'fast' | 'heavy' | 'flying' | 'armored' | 'stealth' | 'boss' | 'swarm';
export type ProjectileType = 'bullet' | 'cannonball' | 'laser' | 'ice' | 'poison' | 'lightning' | 'missile' | 'tesla';

export interface TowerStats {
  name: string;
  damage: number;
  range: number;
  attackSpeed: number;
  cost: number;
  upgradeCost: number;
  description: string;
  color: string;
  unlockLevel: number;
  special?: string;
}

export interface EnemyStats {
  health: number;
  speed: number;
  reward: number;
  color: string;
  armor: number;
  flying: boolean;
  special?: string;
}

export interface WaveConfig {
  enemies: Array<{
    type: EnemyType;
    count: number;
    delay: number;
  }>;
  reward: number;
  bossWave?: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  waves: WaveConfig[];
  goldMultiplier: number;
  experienceReward: number;
  unlockRequirement: number;
  background: string;
  path: Position[];
}