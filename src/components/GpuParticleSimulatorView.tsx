import React, { useRef, useEffect, useState } from 'react';
import { WebglGpuParticleEngine } from '../engine/webglGpuEngine';
import { ParticlePresetType, ParticleColorPalette } from '../types/gpuParticle';
import {
  Trash2,
  Sliders,
  Compass,
  Wind,
  MousePointer,
  Palette,
  Sparkles,
  Shield,
  Zap,
  Activity
} from 'lucide-react';

interface GpuParticleSimulatorViewProps {
  gpuEngineRef: React.MutableRefObject<WebglGpuParticleEngine | null>;
  isActive?: boolean;
}

const PARTICLE_COUNT_PRESETS = [
  { label: '10K', count: 10000 },
  { label: '100K', count: 100000 },
  { label: '500K', count: 500000 },
  { label: '1M', count: 1000000 },
  { label: '2M', count: 2000000 },
  { label: '5M', count: 5000000 },
  { label: '10M', count: 10000000 }
];

const PRESETS_LIST: { label: string; id: ParticlePresetType; icon: string }[] = [
  { label: 'Floating Dust', id: 'floating_dust', icon: '✨' },
  { label: 'Floating Bubbles', id: 'floating_bubbles', icon: '🫧' },
  { label: 'Quantum Float', id: 'quantum_float', icon: '🔮' },
  { label: 'Galaxy Swirl', id: 'galaxy', icon: '🌌' },
  { label: 'Explosion Burst', id: 'explosion', icon: '💥' },
  { label: 'Fluid Fountain', id: 'fountain', icon: '⛲' },
  { label: 'Jet Stream', id: 'stream', icon: '🌊' },
  { label: 'Tornado Vortex', id: 'vortex', icon: '🌪️' },
  { label: 'Grid Drop', id: 'grid_drop', icon: '🌧️' }
];

const PALETTES_LIST: { label: string; id: ParticleColorPalette }[] = [
  { label: 'Cyberpunk Neon', id: 'cyberpunk' },
  { label: 'Rainbow Spectrum', id: 'rainbow' },
  { label: 'Fire & Plasma', id: 'fire_plasma' },
  { label: 'Cosmic Nebula', id: 'cosmic_nebula' },
  { label: 'Acid Toxic', id: 'acid_toxic' },
  { label: 'Ocean Depths', id: 'ocean_depths' },
  { label: 'Monochrome Gold', id: 'monochrome_gold' },
  { label: 'Velocity Heatmap', id: 'velocity_heatmap' }
];

export const GpuParticleSimulatorView: React.FC<GpuParticleSimulatorViewProps> = ({
  gpuEngineRef,
  isActive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Control parameters state
  const [particleCount, setParticleCount] = useState<number>(500000);
  const [gravityX, setGravityX] = useState<number>(0);
  const [gravityY, setGravityY] = useState<number>(0);
  const [friction, setFriction] = useState<number>(0.992);
  const [turbulence, setTurbulence] = useState<number>(0.25);
  const [particleRepulsion, setParticleRepulsion] = useState<number>(0.05);
  const [floatBuoyancy, setFloatBuoyancy] = useState<number>(0.0);
  const [bounceElasticity, setBounceElasticity] = useState<number>(0.85);
  const [hasObstacles, setHasObstacles] = useState<boolean>(false);

  const [mouseForce, setMouseForce] = useState<number>(16);
  const [mouseRadius, setMouseRadius] = useState<number>(180);
  const [particleSize, setParticleSize] = useState<number>(3.0);
  const [particleOpacity, setParticleOpacity] = useState<number>(0.85);
  const [selectedPalette, setSelectedPalette] = useState<ParticleColorPalette>('cyberpunk');
  const [boundaryMode, setBoundaryMode] = useState<'bounce' | 'wrap'>('bounce');

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showTouchHint, setShowTouchHint] = useState<boolean>(true);

  const mousePosRef = useRef<[number, number]>([-1000, -1000]);
  const currentPresetRef = useRef<ParticlePresetType>('floating_dust');
  const isActiveRef = useRef<boolean>(isActive);

  const [currentPreset, setCurrentPreset] = useState<ParticlePresetType>('floating_dust');
  const [touchMode, setTouchMode] = useState<number>(4); // 4 = Collide (Elastic Bounce) default!

  useEffect(() => {
    currentPresetRef.current = currentPreset;
  }, [currentPreset]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Canvas Resize Handler
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.floor(entry.contentRect.width || window.innerWidth);
        const height = Math.floor(entry.contentRect.height || window.innerHeight);

        if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
          canvas.width = width;
          canvas.height = height;

          if (gpuEngineRef.current) {
            gpuEngineRef.current.spawnPreset(currentPreset);
          }
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [gpuEngineRef, currentPreset]);

  // Initialize Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth || window.innerWidth;
      canvas.height = parent.clientHeight || window.innerHeight;
    }

    try {
      if (!gpuEngineRef.current) {
        gpuEngineRef.current = new WebglGpuParticleEngine(canvas, {
          particleCount: particleCount
        });
      }
    } catch (err) {
      console.error('Failed to initialize WebGL GPU particle engine:', err);
    }

    let animId: number;

    const renderLoop = () => {
      const engine = gpuEngineRef.current;
      if (engine && isActiveRef.current) {
        engine.render(mousePosRef.current, currentPresetRef.current);
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      if (gpuEngineRef.current) {
        gpuEngineRef.current.destroy();
        gpuEngineRef.current = null;
      }
    };
  }, [gpuEngineRef]);

  // Sync real-time parameter changes to Engine
  useEffect(() => {
    const engine = gpuEngineRef.current;
    if (!engine) return;

    engine.settings.gravityX = gravityX;
    engine.settings.gravityY = gravityY;
    engine.settings.friction = friction;
    engine.settings.turbulence = turbulence;
    engine.settings.particleRepulsion = particleRepulsion;
    engine.settings.floatBuoyancy = floatBuoyancy;
    engine.settings.bounceElasticity = bounceElasticity;
    engine.settings.hasObstacles = hasObstacles;
    engine.settings.mouseForce = mouseForce;
    engine.settings.mouseRadius = mouseRadius;
    engine.settings.particleSize = particleSize;
    engine.settings.particleOpacity = particleOpacity;
    engine.settings.palette = selectedPalette;
    engine.settings.boundaryMode = boundaryMode;
    engine.touchMode = touchMode;
  }, [
    gpuEngineRef,
    gravityX,
    gravityY,
    friction,
    turbulence,
    particleRepulsion,
    floatBuoyancy,
    bounceElasticity,
    hasObstacles,
    mouseForce,
    mouseRadius,
    particleSize,
    particleOpacity,
    selectedPalette,
    boundaryMode,
    touchMode
  ]);

  const handleParticleCountChange = (count: number) => {
    setParticleCount(count);
    const engine = gpuEngineRef.current;
    if (engine) {
      engine.allocateGpuBuffers(count);
      engine.spawnPreset(currentPreset);
    }
  };

  const getCanvasCoords = (clientX: number, clientY: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [-1000, -1000];
    const rect = canvas.getBoundingClientRect();
    return [clientX - rect.left, clientY - rect.top];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    mousePosRef.current = getCanvasCoords(e.clientX, e.clientY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasCoords(e.clientX, e.clientY);
    mousePosRef.current = [x, y];
    setShowTouchHint(false);
    gpuEngineRef.current?.burstAt(x, y);
  };

  const handlePointerUp = () => {
    mousePosRef.current = [-1000, -1000];
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 p-2.5 flex items-center justify-between gap-2 text-xs z-20">
        {/* Spawn Preset Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full no-scrollbar">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1 hidden sm:inline shrink-0">
            Presets:
          </span>
          {PRESETS_LIST.map((preset) => (
            <button
              key={preset.id}
              id={`btn-gpu-preset-${preset.id}`}
              onClick={() => {
                setCurrentPreset(preset.id);
                gpuEngineRef.current?.spawnPreset(preset.id);
                setShowTouchHint(false);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-slate-200 border flex items-center gap-1.5 font-medium shrink-0 transition-all text-xs ${
                currentPreset === preset.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700/80'
              }`}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-toggle-parameters-drawer"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs border ${
              isDrawerOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Controls</span>
          </button>

          <button
            id="btn-gpu-clear"
            onClick={() => gpuEngineRef.current?.clearParticles()}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1.5 transition-colors text-xs shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden xs:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Parameter Drawer */}
      <div ref={containerRef} className="flex-1 relative flex overflow-hidden">
        {/* WebGL Canvas Container */}
        <div className="flex-1 relative bg-slate-950 w-full h-full">
          <canvas
            id="canvas-gpu-particles"
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />

          {/* Banner Overlay */}
          {showTouchHint && (
            <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none px-4 z-20">
              <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-full px-4 py-2 text-xs font-semibold text-cyan-300 shadow-2xl flex items-center gap-2 animate-bounce">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Drag to bounce particles off your cursor shield!</span>
              </div>
            </div>
          )}

          {/* Active Particle Stats Badge */}
          <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono flex items-center gap-3 shadow-xl pointer-events-none z-10">
            <div>
              <span className="text-slate-400">Particles:</span>{' '}
              <span className="font-bold text-cyan-400 text-sm">
                {particleCount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Physics:</span>{' '}
              <span className="font-bold text-emerald-400">Collisions & Float</span>
            </div>
          </div>
        </div>

        {/* Parameter Drawer */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-md border-l border-slate-800 p-4 overflow-y-auto flex flex-col gap-4 text-xs z-30 shadow-2xl transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Physics & Collision Controls
            </h3>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Particle Count Preset Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span>Particle Capacity LOD:</span>
              <span className="font-mono text-cyan-400 font-bold">
                {particleCount.toLocaleString()}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PARTICLE_COUNT_PRESETS.map((p) => (
                <button
                  key={p.count}
                  id={`btn-preset-count-${p.label}`}
                  onClick={() => handleParticleCountChange(p.count)}
                  className={`py-1.5 rounded-lg font-mono font-bold text-xs transition-all ${
                    particleCount === p.count
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Touch / Collision Mode */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Touch / Cursor Collision Mode:</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: 'Collide', mode: 4 },
                { label: 'Repel', mode: 1 },
                { label: 'Attract', mode: 0 },
                { label: 'Swirl', mode: 2 },
                { label: 'Burst', mode: 3 }
              ].map((m) => (
                <button
                  key={m.mode}
                  id={`btn-touch-mode-${m.label.toLowerCase()}`}
                  onClick={() => setTouchMode(m.mode)}
                  className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                    touchMode === m.mode
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inter-Particle Collision Repulsion & Float Buoyancy */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                Inter-Particle Collision Repulsion:
              </span>
              <span className="font-mono text-cyan-400">{particleRepulsion.toFixed(2)}</span>
            </label>
            <input
              id="slider-particle-repulsion"
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={particleRepulsion}
              onChange={(e) => setParticleRepulsion(parseFloat(e.target.value))}
              className="accent-cyan-500 cursor-pointer"
            />

            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Upward Anti-Gravity Buoyancy Float:
              </span>
              <span className="font-mono text-amber-400">{floatBuoyancy.toFixed(2)}</span>
            </label>
            <input
              id="slider-float-buoyancy"
              type="range"
              min="-2.0"
              max="2.0"
              step="0.1"
              value={floatBuoyancy}
              onChange={(e) => setFloatBuoyancy(parseFloat(e.target.value))}
              className="accent-amber-500 cursor-pointer"
            />

            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                Bounce Restitution Elasticity:
              </span>
              <span className="font-mono text-emerald-400">{bounceElasticity.toFixed(2)}</span>
            </label>
            <input
              id="slider-bounce-elasticity"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={bounceElasticity}
              onChange={(e) => setBounceElasticity(parseFloat(e.target.value))}
              className="accent-emerald-500 cursor-pointer"
            />

            <label className="text-slate-300 font-semibold flex items-center justify-between cursor-pointer pt-1">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-400" />
                Bouncing Solid Obstacle Barriers:
              </span>
              <input
                type="checkbox"
                checked={hasObstacles}
                onChange={(e) => setHasObstacles(e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </label>
          </div>

          {/* Turbulence & Damping */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-purple-400" />
                Fluid Turbulence:
              </span>
              <span className="font-mono text-purple-400">{turbulence.toFixed(2)}</span>
            </label>
            <input
              id="slider-turbulence"
              type="range"
              min="0.0"
              max="2.5"
              step="0.05"
              value={turbulence}
              onChange={(e) => setTurbulence(parseFloat(e.target.value))}
              className="accent-purple-500 cursor-pointer"
            />

            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-slate-400" />
                Friction / Air Resistance:
              </span>
              <span className="font-mono text-slate-300">{friction.toFixed(3)}</span>
            </label>
            <input
              id="slider-friction"
              type="range"
              min="0.850"
              max="1.000"
              step="0.002"
              value={friction}
              onChange={(e) => setFriction(parseFloat(e.target.value))}
              className="accent-slate-400 cursor-pointer"
            />
          </div>

          {/* Color Palette */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Color Palette Map:</span>
            </label>
            <select
              id="select-color-palette"
              value={selectedPalette}
              onChange={(e) => setSelectedPalette(e.target.value as ParticleColorPalette)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
            >
              {PALETTES_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
