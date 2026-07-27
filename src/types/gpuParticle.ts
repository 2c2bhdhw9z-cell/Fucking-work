export type ParticlePresetType =
  | 'galaxy'
  | 'floating_dust'
  | 'floating_bubbles'
  | 'quantum_float'
  | 'explosion'
  | 'blackhole'
  | 'fountain'
  | 'stream'
  | 'vortex'
  | 'supernova'
  | 'fluid_flow'
  | 'grid_drop';

export type ParticleColorPalette =
  | 'rainbow'
  | 'cyberpunk'
  | 'fire_plasma'
  | 'cosmic_nebula'
  | 'acid_toxic'
  | 'ocean_depths'
  | 'monochrome_gold'
  | 'velocity_heatmap';

export interface Obstacle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
}

export interface GpuParticleSettings {
  particleCount: number; // e.g. 100,000 to 10,000,000
  targetFps: number;
  gravityX: number; // -10.0 to 10.0
  gravityY: number; // -10.0 to 10.0
  friction: number; // 0.80 to 1.00 (damping)
  turbulence: number; // 0.0 to 5.0 (curl noise strength)
  particleSize: number; // 1.0 to 10.0
  particleOpacity: number; // 0.1 to 1.0
  speedMultiplier: number; // 0.1 to 3.0
  palette: ParticleColorPalette;
  mouseForce: number; // -20.0 to 20.0 (positive = attract, negative = repel)
  mouseRadius: number; // 10 to 300 px
  boundaryMode: 'bounce' | 'wrap' | 'kill';
  bounceElasticity: number; // 0.1 to 1.0
  autoAdaptQuality: boolean; // Auto drop/raise particle LOD if FPS drops
  particleRepulsion: number; // Inter-particle collision / spatial repulsion (0.0 to 1.0)
  floatBuoyancy: number; // Upward anti-gravity float force (-2.0 to 2.0)
  mouseCollisionMode: 'elastic_bounce' | 'attract' | 'repel' | 'vortex' | 'shockwave';
  hasObstacles: boolean;
}

export interface GpuEngineStats {
  fps: number;
  gpuFrameTimeMs: number;
  particleCountActive: number;
  drawCalls: number;
  vboSizeMb: number;
  webglStatus: 'ready' | 'simulating' | 'context_lost' | 'fallback_mode';
  autoHealingCount: number;
  shaderCompilationStatus: 'ok' | 'compiling' | 'error';
}
