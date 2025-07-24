import { TowerStats, EnemyStats, WaveConfig, Position, LevelConfig, Achievement } from '../types/game';

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 40,
  FPS: 60,
  STARTING_GOLD: 150,
  STARTING_LIVES: 25,
  MAX_PLAYER_LEVEL: 50,
};

export const TOWER_STATS: Record<string, TowerStats> = {
  basic: {
    name: 'Basic Tower',
    damage: 25,
    range: 80,
    attackSpeed: 1000,
    cost: 20,
    upgradeCost: 15,
    description: 'Fast, reliable tower with steady damage',
    color: '#3b82f6',
    unlockLevel: 1,
  },
  cannon: {
    name: 'Cannon Tower',
    damage: 60,
    range: 100,
    attackSpeed: 2000,
    cost: 45,
    upgradeCost: 30,
    description: 'Powerful splash damage in large area',
    color: '#ef4444',
    unlockLevel: 1,
    special: 'Splash damage to nearby enemies',
  },
  laser: {
    name: 'Laser Tower',
    damage: 35,
    range: 120,
    attackSpeed: 500,
    cost: 65,
    upgradeCost: 40,
    description: 'High-tech piercing laser beam',
    color: '#8b5cf6',
    unlockLevel: 3,
    special: 'Pierces through multiple enemies',
  },
  ice: {
    name: 'Ice Tower',
    damage: 20,
    range: 90,
    attackSpeed: 1200,
    cost: 35,
    upgradeCost: 25,
    description: 'Slows enemies with frost damage',
    color: '#06b6d4',
    unlockLevel: 2,
    special: 'Slows enemy movement speed',
  },
  poison: {
    name: 'Poison Tower',
    damage: 15,
    range: 85,
    attackSpeed: 800,
    cost: 55,
    upgradeCost: 35,
    description: 'Deals damage over time with toxic clouds',
    color: '#22c55e',
    unlockLevel: 5,
    special: 'Poison damage over time',
  },
  lightning: {
    name: 'Lightning Tower',
    damage: 80,
    range: 110,
    attackSpeed: 2500,
    cost: 85,
    upgradeCost: 50,
    description: 'Chains lightning between enemies',
    color: '#eab308',
    unlockLevel: 7,
    special: 'Chains to nearby enemies',
  },
  missile: {
    name: 'Missile Tower',
    damage: 120,
    range: 150,
    attackSpeed: 3000,
    cost: 120,
    upgradeCost: 70,
    description: 'Guided missiles with massive damage',
    color: '#f97316',
    unlockLevel: 10,
    special: 'Guided missiles, huge splash',
  },
  tesla: {
    name: 'Tesla Tower',
    damage: 45,
    range: 95,
    attackSpeed: 600,
    cost: 95,
    upgradeCost: 55,
    description: 'Continuous electric beam damage',
    color: '#a855f7',
    unlockLevel: 12,
    special: 'Continuous beam, no projectiles',
  },
};

export const ENEMY_STATS: Record<string, EnemyStats> = {
  basic: {
    health: 100,
    speed: 1,
    reward: 12,
    color: '#f59e0b',
    armor: 0,
    flying: false,
  },
  fast: {
    health: 60,
    speed: 2.2,
    reward: 18,
    color: '#10b981',
    armor: 0,
    flying: false,
    special: 'Very fast movement',
  },
  heavy: {
    health: 250,
    speed: 0.6,
    reward: 30,
    color: '#dc2626',
    armor: 2,
    flying: false,
    special: 'High armor, slow movement',
  },
  flying: {
    health: 80,
    speed: 1.8,
    reward: 25,
    color: '#8b5cf6',
    armor: 0,
    flying: true,
    special: 'Flies over obstacles',
  },
  armored: {
    health: 180,
    speed: 1.2,
    reward: 35,
    color: '#6b7280',
    armor: 4,
    flying: false,
    special: 'Heavy armor protection',
  },
  stealth: {
    health: 90,
    speed: 1.5,
    reward: 40,
    color: '#374151',
    armor: 1,
    flying: false,
    special: 'Invisible to some towers',
  },
  swarm: {
    health: 30,
    speed: 1.8,
    reward: 8,
    color: '#fbbf24',
    armor: 0,
    flying: false,
    special: 'Spawns in large groups',
  },
  boss: {
    health: 800,
    speed: 0.8,
    reward: 150,
    color: '#7c2d12',
    armor: 5,
    flying: false,
    special: 'Massive health and armor',
  },
};

const getLevelName = (levelId: number): string => {
  const names = [
    'Green Fields', 'Desert Outpost', 'Frozen Tundra', 'Volcanic Crater',
    'Dark Forest', 'Crystal Caves', 'Sky Fortress', 'Underwater Base',
    'Space Station', 'Neon City', 'Ancient Ruins', 'Cyber Grid',
    'Toxic Wasteland', 'Mountain Pass', 'Jungle Temple', 'Arctic Base',
    'Lava Flows', 'Storm Clouds', 'Crystal Maze', 'Final Stronghold'
  ];
  return names[(levelId - 1) % names.length] || `Sector ${levelId}`;
};

const getLevelDescription = (levelId: number): string => {
  const descriptions = [
    'A peaceful meadow under attack',
    'Defend the desert outpost from invasion',
    'Survive the frozen wasteland assault',
    'Protect the volcanic research station',
    'Navigate the haunted forest paths',
    'Guard the precious crystal mines',
    'Defend the floating sky fortress',
    'Protect the underwater facility',
    'Secure the orbital space station',
    'Defend the cyberpunk metropolis',
    'Protect the ancient temple ruins',
    'Guard the digital cyber grid',
    'Survive the toxic wasteland',
    'Defend the mountain stronghold',
    'Protect the jungle temple',
    'Guard the arctic research base',
    'Survive the lava field assault',
    'Defend against the storm invasion',
    'Navigate the crystal labyrinth',
    'The final battle for survival'
  ];
  return descriptions[(levelId - 1) % descriptions.length] || `Defend Sector ${levelId} at all costs`;
};

const getLevelBackground = (levelId: number): string => {
  const backgrounds = [
    '#22c55e', '#f59e0b', '#06b6d4', '#ef4444',
    '#374151', '#8b5cf6', '#3b82f6', '#0891b2',
    '#1e1b4b', '#ec4899', '#92400e', '#7c3aed',
    '#059669', '#dc2626', '#16a34a', '#0284c7',
    '#ea580c', '#6366f1', '#a855f7', '#7c2d12'
  ];
  return backgrounds[(levelId - 1) % backgrounds.length] || '#1f2937';
};

const generateLevelPath = (levelId: number): Position[] => {
  // Generate different path patterns based on level
  const patterns = [
    // Pattern 1: Simple S-curve
    [
      { x: -40, y: 200 }, { x: 120, y: 200 }, { x: 120, y: 120 },
      { x: 280, y: 120 }, { x: 280, y: 280 }, { x: 480, y: 280 },
      { x: 480, y: 160 }, { x: 640, y: 160 }, { x: 640, y: 360 }, { x: 840, y: 360 }
    ],
    // Pattern 2: Zigzag
    [
      { x: -40, y: 300 }, { x: 150, y: 300 }, { x: 150, y: 150 },
      { x: 350, y: 150 }, { x: 350, y: 450 }, { x: 550, y: 450 },
      { x: 550, y: 200 }, { x: 750, y: 200 }, { x: 840, y: 200 }
    ],
    // Pattern 3: Spiral
    [
      { x: -40, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 500 },
      { x: 600, y: 500 }, { x: 600, y: 200 }, { x: 400, y: 200 },
      { x: 400, y: 350 }, { x: 700, y: 350 }, { x: 840, y: 350 }
    ],
  ];
  
  return patterns[(levelId - 1) % patterns.length] || patterns[0];
};

// Dynamic level generation
export const generateLevel = (levelId: number): LevelConfig => {
  const baseWaves = Math.min(8 + Math.floor(levelId / 2), 15);
  const waves: WaveConfig[] = [];
  
  for (let wave = 1; wave <= baseWaves; wave++) {
    const waveConfig: WaveConfig = {
      enemies: [],
      reward: 50 + (wave * 15) + (levelId * 10),
      bossWave: wave === baseWaves && levelId % 3 === 0,
    };

    if (waveConfig.bossWave) {
      // Boss wave
      waveConfig.enemies.push({
        type: 'boss',
        count: 1 + Math.floor(levelId / 10),
        delay: 3000,
      });
      waveConfig.enemies.push({
        type: 'heavy',
        count: 3 + Math.floor(levelId / 5),
        delay: 1500,
      });
    } else {
      // Regular wave with scaling difficulty
      const enemyTypes = ['basic', 'fast', 'heavy', 'flying', 'armored', 'stealth', 'swarm'];
      const availableTypes = enemyTypes.slice(0, Math.min(3 + Math.floor(levelId / 3), enemyTypes.length));
      
      availableTypes.forEach((type, index) => {
        const baseCount = type === 'swarm' ? 15 : type === 'boss' ? 1 : 8;
        const count = Math.floor(baseCount + (wave * 2) + (levelId * 1.5));
        const delay = type === 'fast' ? 400 : type === 'heavy' ? 2000 : type === 'boss' ? 5000 : 800;
        
        waveConfig.enemies.push({
          type: type as any,
          count: Math.max(1, count),
          delay: Math.max(300, delay - (levelId * 50)),
        });
      });
    }

    waves.push(waveConfig);
  }

  return {
    id: levelId,
    name: `Level ${levelId}: ${getLevelName(levelId)}`,
    description: getLevelDescription(levelId),
    waves,
    goldMultiplier: 1 + (levelId * 0.1),
    experienceReward: 100 + (levelId * 50),
    unlockRequirement: levelId === 1 ? 0 : (levelId - 1) * 1000,
    background: getLevelBackground(levelId),
    path: generateLevelPath(levelId),
  };
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_kill',
    name: 'First Blood',
    description: 'Destroy your first enemy',
    unlocked: false,
    progress: 0,
    target: 1,
    reward: 50,
  },
  {
    id: 'tower_master',
    name: 'Tower Master',
    description: 'Build 50 towers',
    unlocked: false,
    progress: 0,
    target: 50,
    reward: 200,
  },
  {
    id: 'wave_survivor',
    name: 'Wave Survivor',
    description: 'Complete 100 waves',
    unlocked: false,
    progress: 0,
    target: 100,
    reward: 500,
  },
  {
    id: 'gold_collector',
    name: 'Gold Collector',
    description: 'Earn 10,000 gold',
    unlocked: false,
    progress: 0,
    target: 10000,
    reward: 300,
  },
  {
    id: 'perfect_defense',
    name: 'Perfect Defense',
    description: 'Complete a level without losing any lives',
    unlocked: false,
    progress: 0,
    target: 1,
    reward: 400,
  },
  {
    id: 'upgrade_expert',
    name: 'Upgrade Expert',
    description: 'Upgrade towers 25 times',
    unlocked: false,
    progress: 0,
    target: 25,
    reward: 250,
  },
  {
    id: 'level_conqueror',
    name: 'Level Conqueror',
    description: 'Complete 10 levels',
    unlocked: false,
    progress: 0,
    target: 10,
    reward: 1000,
  },
];

export const SPECIAL_ABILITIES = [
  {
    type: 'airstrike' as const,
    cooldown: 30000, // 30 seconds
    lastUsed: 0,
    cost: 100,
  },
  {
    type: 'freeze_all' as const,
    cooldown: 45000, // 45 seconds
    lastUsed: 0,
    cost: 150,
  },
  {
    type: 'gold_boost' as const,
    cooldown: 60000, // 60 seconds
    lastUsed: 0,
    cost: 75,
  },
  {
    type: 'repair' as const,
    cooldown: 20000, // 20 seconds
    lastUsed: 0,
    cost: 50,
  },
];

// Predefined path for enemies to follow (default level 1)
export const ENEMY_PATH: Position[] = [
  { x: -40, y: 200 },
  { x: 120, y: 200 },
  { x: 120, y: 120 },
  { x: 280, y: 120 },
  { x: 280, y: 280 },
  { x: 480, y: 280 },
  { x: 480, y: 160 },
  { x: 640, y: 160 },
  { x: 640, y: 360 },
  { x: 840, y: 360 },
];

// Grid positions where towers can be placed (avoiding the path)
export const VALID_TOWER_POSITIONS: Position[] = [];

// Initialize valid tower positions
for (let x = 0; x < GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRID_SIZE) {
  for (let y = 0; y < GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRID_SIZE) {
    const gridX = x + GAME_CONFIG.GRID_SIZE / 2;
    const gridY = y + GAME_CONFIG.GRID_SIZE / 2;
    
    // Check if this position is too close to the path
    const tooCloseToPath = ENEMY_PATH.some(pathPoint => {
      const distance = Math.sqrt(
        Math.pow(gridX - pathPoint.x, 2) + Math.pow(gridY - pathPoint.y, 2)
      );
      return distance < GAME_CONFIG.GRID_SIZE;
    });
    
    if (!tooCloseToPath) {
      VALID_TOWER_POSITIONS.push({ x: gridX, y: gridY });
    }
  }
}