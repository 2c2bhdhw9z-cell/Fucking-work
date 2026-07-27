import React, { useState } from 'react';
import { PowderEngine } from '../engine/powderEngine';
import { WebglGpuParticleEngine } from '../engine/webglGpuEngine';
import { Bug, Wrench, ShieldCheck, Play, RotateCcw, RefreshCw, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface DebugMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  powderEngineRef: React.MutableRefObject<PowderEngine | null>;
  gpuEngineRef: React.MutableRefObject<WebglGpuParticleEngine | null>;
}

export const DebugMenuModal: React.FC<DebugMenuModalProps> = ({
  isOpen,
  onClose,
  powderEngineRef,
  gpuEngineRef
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'autofix' | 'logs'>('manual');
  const [, forceUpdate] = useState({});

  if (!isOpen) return null;

  const powder = powderEngineRef.current;
  const gpu = gpuEngineRef.current;

  // Trigger manual repair routines
  const handlePurgeCells = () => {
    if (powder) {
      powder.manualPurgeCorruptCells();
      forceUpdate({});
    }
  };

  const handleDensityRebalance = () => {
    if (powder) {
      powder.manualBalanceDensity();
      forceUpdate({});
    }
  };

  const handleStepFrames = (steps: number) => {
    if (powder) {
      powder.manualStepFrame(steps);
      forceUpdate({});
    }
  };

  const handleGpuReset = () => {
    if (gpu) {
      gpu.manualResetBuffers();
      forceUpdate({});
    }
  };

  const handleGpuRecompile = () => {
    if (gpu) {
      gpu.manualRecompileShaders();
      forceUpdate({});
    }
  };

  return (
    <div id="debug-menu-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Debug & Diagnostic System</h2>
              <p className="text-xs text-slate-400">Manual fixes, frame stepping, and self-healing diagnostic automation.</p>
            </div>
          </div>
          <button
            id="btn-close-debug-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Manual Fixes & Steps
            </span>
          </button>

          <button
            onClick={() => setActiveTab('autofix')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'autofix'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Auto-Fix Diagnostics
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'logs'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            System Logs ({powder?.logs.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {activeTab === 'manual' && (
            <div className="space-y-6">
              {/* Powder Engine Manual Fixes */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Powder Simulation Manual Tools
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    id="btn-debug-step-1"
                    onClick={() => handleStepFrames(1)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-2 border border-slate-700"
                  >
                    <Play className="w-4 h-4 text-amber-400" />
                    <span>Step +1 Frame Forward</span>
                  </button>

                  <button
                    id="btn-debug-step-5"
                    onClick={() => handleStepFrames(5)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-2 border border-slate-700"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Step +5 Frames Forward</span>
                  </button>

                  <button
                    id="btn-debug-purge-cells"
                    onClick={handlePurgeCells}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-2 border border-slate-700"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Purge NaNs & Fix Cell Bounds</span>
                  </button>

                  <button
                    id="btn-debug-rebalance-density"
                    onClick={handleDensityRebalance}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-2 border border-slate-700"
                  >
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    <span>Rebalance Fluid Density Matrix</span>
                  </button>
                </div>
              </div>

              {/* GPU Engine Manual Fixes */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  10M GPU Engine Manual Tools
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    id="btn-debug-gpu-reset"
                    onClick={handleGpuReset}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-2 border border-slate-700"
                  >
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    <span>Reset GPU VBO Buffers</span>
                  </button>

                  <button
                    id="btn-debug-gpu-recompile"
                    onClick={handleGpuRecompile}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-2 border border-slate-700"
                  >
                    <Wrench className="w-4 h-4 text-purple-400" />
                    <span>Recompile WebGL Shaders</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'autofix' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Self-Healing Diagnostic Engine Status
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                    ONLINE & PROTECTING
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Grid Integrity</div>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      {powder?.diagnostic.gridIntegrityPercent || 100}%
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Anomalies Detected</div>
                    <div className="text-lg font-bold font-mono text-amber-400">
                      {powder?.diagnostic.anomaliesDetected || 0}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Auto-Fixes Ran</div>
                    <div className="text-lg font-bold font-mono text-cyan-400">
                      {(powder?.diagnostic.autoFixesExecuted || 0) + (gpu?.stats.autoHealingCount || 0)}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Last Auto-Pass</div>
                    <div className="text-xs font-bold font-mono text-slate-200 mt-1">
                      {powder?.diagnostic.lastAutoHealingPassTime || 'Active'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-[11px] max-h-96 overflow-y-auto">
              {powder?.logs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 font-bold uppercase">{log.type}</span>
                    <span className="text-slate-500">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-200 font-bold">{log.message}</div>
                  {log.details && <div className="text-slate-400">{log.details}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
