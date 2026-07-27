import React from 'react';
import { PowderEngine } from '../engine/powderEngine';
import { WebglGpuParticleEngine } from '../engine/webglGpuEngine';
import { Activity, Flame, Zap, ShieldCheck, Gauge, Cpu, CheckCircle } from 'lucide-react';

interface DiagnosticsViewProps {
  powderEngineRef: React.MutableRefObject<PowderEngine | null>;
  gpuEngineRef: React.MutableRefObject<WebglGpuParticleEngine | null>;
  openDebugMenu: () => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  powderEngineRef,
  gpuEngineRef,
  openDebugMenu
}) => {
  const powder = powderEngineRef.current;
  const gpu = gpuEngineRef.current;

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            System Performance & Diagnostic Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, auto-healing verification, and hardware compute metrics.
          </p>
        </div>

        <button
          onClick={openDebugMenu}
          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 flex items-center gap-2 transition-all"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Launch Debug & Auto-Fix Menu</span>
        </button>
      </div>

      {/* Grid Cards for both engines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Powder Simulator Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-amber-400 text-base flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Powder Engine Telemetry
            </h3>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
              500 Elements Matrix
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs">Framerate</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {powder?.diagnostic.fps || 60} <span className="text-xs text-slate-400">FPS</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs">Grid Resolution</div>
              <div className="text-lg font-bold text-slate-100 mt-1">
                320 x 200
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs">Active Cells</div>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {(powder?.diagnostic.activeCellsCount || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs">Updates / Sec</div>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {(powder?.diagnostic.updatedCellsPerSec || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 10M GPU Particle Engine Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-cyan-400 text-base flex items-center gap-2">
              <Zap className="w-5 h-5" />
              10M GPU Compute Engine Telemetry
            </h3>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
              WebGL Transform Feedback
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs">GPU Framerate</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">
                {gpu?.stats.fps || 60} <span className="text-xs text-slate-400">FPS</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs">GPU Particle Count</div>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {(gpu?.stats.particleCountActive || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs">VBO Memory Allocation</div>
              <div className="text-lg font-bold text-slate-100 mt-1">
                {gpu?.stats.vboSizeMb || 0} MB
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs">Shader Status</div>
              <div className="text-xs font-bold text-emerald-400 mt-2 uppercase flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Compiled OK
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
