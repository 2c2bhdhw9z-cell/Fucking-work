import React from 'react';
import { PowderEngine } from '../engine/powderEngine';
import { WebglGpuParticleEngine } from '../engine/webglGpuEngine';
import { Gauge, Settings, Zap, Shield, X, Sliders } from 'lucide-react';

interface PerformanceMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  powderEngineRef: React.MutableRefObject<PowderEngine | null>;
  gpuEngineRef: React.MutableRefObject<WebglGpuParticleEngine | null>;
}

export const PerformanceMenuModal: React.FC<PerformanceMenuModalProps> = ({
  isOpen,
  onClose,
  powderEngineRef,
  gpuEngineRef
}) => {
  if (!isOpen) return null;

  const powder = powderEngineRef.current;
  const gpu = gpuEngineRef.current;

  return (
    <div id="performance-menu-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Engine Performance Settings</h2>
          </div>
          <button
            id="btn-close-perf-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Powder Engine Tuning */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
              <Sliders className="w-4 h-4" />
              Powder Engine Settings
            </h3>

            {powder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Sub-Steps per Frame:</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 4].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => (powder.settings.subSteps = sub)}
                        className={`flex-1 py-1.5 rounded-lg font-mono font-bold border transition-colors ${
                          powder.settings.subSteps === sub
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {sub}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">Ambient Temperature (°C):</label>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    defaultValue={powder.settings.ambientTemp}
                    onChange={(e) => (powder.settings.ambientTemp = parseInt(e.target.value))}
                    className="accent-amber-500 cursor-pointer mt-1"
                  />
                </div>

                <div className="flex items-center justify-between col-span-2 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-300 font-semibold">Auto-Healing Integrity Pass:</span>
                  <input
                    type="checkbox"
                    defaultChecked={powder.settings.autoHealEnabled}
                    onChange={(e) => (powder.settings.autoHealEnabled = e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* GPU Engine Tuning */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="font-bold text-cyan-400 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4" />
              10M GPU Particle Engine Settings
            </h3>

            {gpu && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-300 font-semibold">Auto Adapt Quality (FPS Lock 60):</label>
                  <p className="text-slate-400 text-[11px]">
                    Automatically scales particle count LOD up/down when frame rendering falls below 30 FPS.
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="checkbox"
                      defaultChecked={gpu.settings.autoAdaptQuality}
                      onChange={(e) => (gpu.settings.autoAdaptQuality = e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                    <span className="text-slate-200 font-medium">Enable Dynamic FPS Quality Scaler</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:brightness-110"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
