import React from 'react';
import { Flame, Zap, Activity, Settings, Bug, ShieldCheck, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'powder' | 'gpu' | 'diagnostics';
  setActiveTab: (tab: 'powder' | 'gpu' | 'diagnostics') => void;
  powderFps: number;
  gpuFps: number;
  powderCellCount: number;
  gpuParticleCount: number;
  openPerformanceMenu: () => void;
  openDebugMenu: () => void;
  autoFixesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  powderFps,
  gpuFps,
  powderCellCount,
  gpuParticleCount,
  openPerformanceMenu,
  openDebugMenu,
  autoFixesCount
}) => {
  return (
    <header id="main-header" className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-cyan-500 p-0.5 shadow-lg shadow-orange-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Powder & GPU Particle Simulator
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
              500 Elements • 10M GPU Particles
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            Ultra High-Performance Physics, Reactions & GPU Compute Shaders
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
        <button
          id="btn-tab-powder"
          onClick={() => setActiveTab('powder')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'powder'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Powder Sim</span>
          <span className="font-mono text-[10px] opacity-80">({powderFps > 0 ? `${powderFps} FPS` : 'Idle'})</span>
        </button>

        <button
          id="btn-tab-gpu"
          onClick={() => setActiveTab('gpu')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'gpu'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>10M GPU Simulator</span>
          <span className="font-mono text-[10px] opacity-80">({gpuFps > 0 ? `${gpuFps} FPS` : 'Idle'})</span>
        </button>

        <button
          id="btn-tab-diagnostics"
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'diagnostics'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Diagnostics</span>
        </button>
      </div>

      {/* Action Buttons & System Status */}
      <div className="flex items-center gap-2">
        {/* Performance Settings Button */}
        <button
          id="btn-open-perf-menu"
          onClick={openPerformanceMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          title="Performance Settings"
        >
          <Settings className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">Performance</span>
        </button>

        {/* Debug & Auto-Fix Menu Button */}
        <button
          id="btn-open-debug-menu"
          onClick={openDebugMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors relative"
          title="Debug & Auto-Fix Menu"
        >
          <Bug className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Debug Menu</span>
          {autoFixesCount > 0 && (
            <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-slate-950 font-mono font-bold text-[10px]">
              {autoFixesCount}
            </span>
          )}
        </button>

        {/* Auto Healing Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Auto-Fix Active</span>
        </div>
      </div>
    </header>
  );
};
