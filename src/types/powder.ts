export type ElementCategory = 
  | 'Solids'
  | 'Powders'
  | 'Liquids'
  | 'Gases'
  | 'Explosives'
  | 'Energetic & Fire'
  | 'Organics & Flora'
  | 'Metals & Alloys'
  | 'Acids & Corrosives'
  | 'Radioactive & Cosmic'
  | 'Plasma & Laser'
  | 'Tech & Special'
  | 'Custom Synthesis';

export interface ReactionRule {
  withCategoryOrId: number | string; // target element ID or category
  chance: number; // 0.0 - 1.0
  transformsSelfTo?: number; // element ID
  transformsTargetTo?: number; // element ID
  producesExtra?: number; // element ID (spawned nearby)
  heatChange?: number; // temperature delta
  explosionRadius?: number;
}

export interface ElementDef {
  id: number;
  name: string;
  category: ElementCategory;
  color: string; // Hex or RGBA string
  colorRgb: [number, number, number];
  density: number; // For gravity/buoyancy logic (higher sinks, lower floats)
  state: 'solid' | 'movable_solid' | 'liquid' | 'gas' | 'plasma';
  viscosity?: number; // for liquid flow rate (1-10)
  flammable?: boolean;
  ignitionTemp?: number;
  corrosive?: boolean;
  acidResistance?: number; // 0 to 1
  decayTime?: number; // lifetime in frames
  conductive?: boolean;
  temperature?: number; // default temp
  gravityMultiplier?: number; // positive = falls, negative = rises
  description: string;
  reactions?: ReactionRule[];
}

export interface PowderCell {
  id: number; // element ID (0 = Empty/Air)
  temp: number; // Temperature in °C
  life: number; // Remaining lifetime
  updatedFrame: number; // To prevent double-updating in single tick
  fxFlags: number; // Special visual or state bitmask
}

export interface PowderSettings {
  gridWidth: number;
  gridHeight: number;
  targetFps: number;
  subSteps: number;
  gravityX: number;
  gravityY: number;
  ambientTemp: number;
  heatTransfer: boolean;
  airResistance: number;
  chunkOptimization: boolean;
  autoHealEnabled: boolean;
}

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warn' | 'error' | 'autofix' | 'manualfix';
  message: string;
  details?: string;
}

export interface SystemDiagnosticState {
  fps: number;
  frameTimeMs: number;
  activeCellsCount: number;
  updatedCellsPerSec: number;
  memoryUsageMb: number;
  anomaliesDetected: number;
  autoFixesExecuted: number;
  gridIntegrityPercent: number;
  lastAutoHealingPassTime: string;
}
