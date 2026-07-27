import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PowderEngine } from '../engine/powderEngine';
import { ElementDef } from '../types/powder';
import { ALL_ELEMENTS } from '../engine/powderElementsData';
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Paintbrush,
  Layers,
  Circle,
  Square,
  Sparkles,
  Info,
  Compass,
  Zap,
  Gauge
} from 'lucide-react';

interface PowderSimulatorViewProps {
  engineRef: React.MutableRefObject<PowderEngine | null>;
  selectedElementId: number;
  setSelectedElementId: (id: number) => void;
  openElementPicker: () => void;
  isActive?: boolean;
}

// Quick access elements for the bottom bar
const QUICK_ELEMENT_IDS = [
  0,  // Air/Erase
  1,  // Sand
  2,  // Water
  3,  // Fire
  4,  // Plant
  5,  // Acid
  6,  // Lava
  7,  // Stone
  8,  // Wood
  9,  // Oil
  10, // Gunpowder
  11, // C4
  13, // Ice
  14, // Steam
  17, // Methane
  18, // Lightning
  23, // Antimatter
  24, // Void
  25, // Cloning Powder
  29, // Titanium
  35  // Napalm
];

export const PowderSimulatorView: React.FC<PowderSimulatorViewProps> = ({
  engineRef,
  selectedElementId,
  setSelectedElementId,
  openElementPicker,
  isActive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushSize, setBrushSize] = useState<number>(8); // 1-30 px
  const [brushShape, setBrushShape] = useState<'circle' | 'square' | 'spray'>('circle');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  // Refs to avoid stale closures in the animation loop
  const isPausedRef = useRef<boolean>(false);
  const isActiveRef = useRef<boolean>(isActive);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // Inspector Hover State
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    element: ElementDef;
    temp: number;
  } | null>(null);

  const [gravityMode, setGravityMode] = useState<'down' | 'zero' | 'up' | 'left' | 'right'>('down');

  // Animation Frame Loop — runs once, reads latest state via refs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize Engine if needed (320x200 pixel grid scaled up)
    if (!engineRef.current) {
      engineRef.current = new PowderEngine(320, 200);
    }
    const engine = engineRef.current;

    // Omit { alpha: false } — causes rendering glitches on iOS Safari
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderLoop = () => {
      if (isActiveRef.current) {
        if (!isPausedRef.current) {
          engine.step();
        }

        // Draw pixel buffer to canvas
        ctx.putImageData(engine.imageData, 0, 0);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []); // Run once on mount — state accessed via refs to avoid stale closures

  // Handle Mouse / Touch Drawing
  // Accounts for object-contain letterboxing so coords map to the actual rendered content
  const processPointerPos = useCallback(
    (clientX: number, clientY: number, draw: boolean) => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return;

      const rect = canvas.getBoundingClientRect();

      // Compute the actual rendered content area inside the element
      // (object-contain may add letterbox bars on sides or top/bottom)
      const canvasAspect = engine.width / engine.height;
      const elemAspect = rect.width / rect.height;

      let contentW: number, contentH: number, offsetX: number, offsetY: number;
      if (elemAspect > canvasAspect) {
        // Wider element → letterbox on left/right
        contentH = rect.height;
        contentW = rect.height * canvasAspect;
        offsetX = (rect.width - contentW) / 2;
        offsetY = 0;
      } else {
        // Taller element → letterbox on top/bottom
        contentW = rect.width;
        contentH = rect.width / canvasAspect;
        offsetX = 0;
        offsetY = (rect.height - contentH) / 2;
      }

      const x = Math.floor(((clientX - rect.left) - offsetX) * (engine.width / contentW));
      const y = Math.floor(((clientY - rect.top) - offsetY) * (engine.height / contentH));

      // Update Hover Inspector
      if (x >= 0 && x < engine.width && y >= 0 && y < engine.height) {
        const idx = y * engine.width + x;
        const elemId = engine.gridId[idx];
        const elem = ALL_ELEMENTS[elemId] || ALL_ELEMENTS[0];
        setHoveredCell({
          x,
          y,
          element: elem,
          temp: engine.gridTemp[idx] || 20
        });
      } else {
        setHoveredCell(null);
      }

      // Draw if mouse/touch pressed
      if (draw) {
        engine.drawBrush(x, y, selectedElementId, brushSize, brushShape);
      }
    },
    [brushSize, brushShape, selectedElementId, engineRef]
  );

  // Register non-passive touch listeners so e.preventDefault() works on iOS Safari
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setIsMouseDown(true);
      if (e.touches.length > 0) {
        processPointerPos(e.touches[0].clientX, e.touches[0].clientY, true);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        processPointerPos(e.touches[0].clientX, e.touches[0].clientY, true);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsMouseDown(false);
      setHoveredCell(null);
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [processPointerPos]);

  const handleCanvasPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Skip touch-generated pointer events — handled by native touch listeners above
      if (e.pointerType === 'touch') return;
      processPointerPos(e.clientX, e.clientY, isMouseDown || e.buttons === 1);
    },
    [processPointerPos, isMouseDown]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType !== 'touch') setIsMouseDown(false);
    },
    []
  );

  const setGravity = (mode: 'down' | 'zero' | 'up' | 'left' | 'right') => {
    setGravityMode(mode);
    if (!engineRef.current) return;
    if (mode === 'down') {
      engineRef.current.settings.gravityX = 0;
      engineRef.current.settings.gravityY = 1;
    } else if (mode === 'zero') {
      engineRef.current.settings.gravityX = 0;
      engineRef.current.settings.gravityY = 0;
    } else if (mode === 'up') {
      engineRef.current.settings.gravityX = 0;
      engineRef.current.settings.gravityY = -1;
    } else if (mode === 'left') {
      engineRef.current.settings.gravityX = -1;
      engineRef.current.settings.gravityY = 0;
    } else if (mode === 'right') {
      engineRef.current.settings.gravityX = 1;
      engineRef.current.settings.gravityY = 0;
    }
  };

  const selectedElem = ALL_ELEMENTS[selectedElementId] || ALL_ELEMENTS[1];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs z-10">
        {/* Play/Pause/Step/Clear Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-powder-play-pause"
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all ${
              isPaused
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            id="btn-powder-step"
            onClick={() => engineRef.current?.manualStepFrame(1)}
            disabled={!isPaused}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 flex items-center gap-1 transition-colors"
            title="Step +1 Frame"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Step Frame</span>
          </button>

          <button
            id="btn-powder-clear"
            onClick={() => engineRef.current?.clearGrid()}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Grid</span>
          </button>
        </div>

        {/* Preset Scenes Loader Bar for Mobile / Touch Users */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          <span className="text-slate-400 font-bold text-[10px] uppercase mr-1 hidden md:inline">Scenes:</span>
          {[
            { id: 'volcano', label: '🌋 Volcano' },
            { id: 'hourglass', label: '⏳ Hourglass' },
            { id: 'acid_tank', label: '🧪 Acid Tank' },
            { id: 'fireworks', label: '🎆 Fireworks' }
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => engineRef.current?.loadPresetScene(sc.id as any)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-slate-200 text-xs font-semibold shrink-0 border border-slate-700/60 transition-all"
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Brush Controls: Size 1-30 & Shape */}
        <div className="flex items-center gap-3 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 font-medium hidden sm:inline">Brush:</span>
            <input
              id="slider-brush-size"
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-16 sm:w-20 accent-amber-500 cursor-pointer"
            />
            <span className="font-mono text-amber-400 font-bold text-xs w-6">{brushSize}px</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setBrushShape('circle')}
              className={`p-1 rounded ${brushShape === 'circle' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Circle Brush"
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setBrushShape('square')}
              className={`p-1 rounded ${brushShape === 'square' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Square Brush"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setBrushShape('spray')}
              className={`p-1 rounded ${brushShape === 'spray' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Spray Brush"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Gravity Parameter Control */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <Compass className="w-4 h-4 text-cyan-400 ml-1 mr-0.5" />
          {(['down', 'zero', 'up', 'left', 'right'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setGravity(mode)}
              className={`px-1.5 py-0.5 rounded-lg uppercase text-[10px] font-mono font-bold transition-all ${
                gravityMode === mode
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center p-2 bg-slate-950 overflow-hidden select-none">
        <canvas
          id="canvas-powder-simulation"
          ref={canvasRef}
          width={320}
          height={200}
          onPointerDown={(e) => {
            if (e.pointerType === 'touch') return;
            setIsMouseDown(true);
            handleCanvasPointer(e);
          }}
          onPointerUp={handlePointerUp}
          onPointerMove={handleCanvasPointer}
          onPointerLeave={(e) => {
            if (e.pointerType === 'touch') return;
            setIsMouseDown(false);
            setHoveredCell(null);
          }}
          className="w-full h-full max-w-full max-h-full object-contain rounded-xl border border-slate-800 shadow-2xl cursor-crosshair touch-none"
          style={{ imageRendering: 'pixelated', touchAction: 'none' }}
        />

        {/* Hover Inspector Tooltip */}
        {hoveredCell && (
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl pointer-events-none flex items-center gap-3 text-xs z-20">
            <span
              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: hoveredCell.element.color }}
            />
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                {hoveredCell.element.name}
                <span className="text-[10px] text-amber-400 font-mono">
                  #{hoveredCell.element.id}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono mt-0.5">
                <span>Pos: ({hoveredCell.x}, {hoveredCell.y})</span>
                <span>Category: {hoveredCell.element.category}</span>
                <span>Temp: {hoveredCell.temp.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Quick-Element Selection Palette & 500 Elements Launcher */}
      <div className="bg-slate-900/90 backdrop-blur border-t border-slate-800 p-2.5 flex items-center justify-between gap-3 z-10 overflow-x-auto">
        {/* Selected Element Indicator */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <span
            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: selectedElem.color }}
          />
          <div>
            <div className="text-xs font-bold text-white">{selectedElem.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              #{selectedElem.id} • {selectedElem.category}
            </div>
          </div>
        </div>

        {/* Quick Access Palette Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar flex-1">
          {QUICK_ELEMENT_IDS.map((id) => {
            const elem = ALL_ELEMENTS[id];
            if (!elem) return null;
            const isSelected = id === selectedElementId;
            return (
              <button
                key={id}
                id={`btn-quick-element-${id}`}
                onClick={() => setSelectedElementId(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/20"
                  style={{ backgroundColor: elem.color }}
                />
                <span>{elem.name}</span>
              </button>
            );
          })}
        </div>

        {/* Catalog Modal Trigger Button */}
        <button
          id="btn-open-catalog-modal"
          onClick={openElementPicker}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 shrink-0 transition-all"
        >
          <Layers className="w-4 h-4" />
          <span>All 500 Elements</span>
        </button>
      </div>
    </div>
  );
};
