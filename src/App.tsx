import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { PowderSimulatorView } from './components/PowderSimulatorView';
import { GpuParticleSimulatorView } from './components/GpuParticleSimulatorView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { ElementPickerModal } from './components/ElementPickerModal';
import { PerformanceMenuModal } from './components/PerformanceMenuModal';
import { DebugMenuModal } from './components/DebugMenuModal';

import { PowderEngine } from './engine/powderEngine';
import { WebglGpuParticleEngine } from './engine/webglGpuEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'powder' | 'gpu' | 'diagnostics'>('powder');
  const [selectedElementId, setSelectedElementId] = useState<number>(1); // Sand default

  // Modals state
  const [isElementPickerOpen, setIsElementPickerOpen] = useState<boolean>(false);
  const [isPerformanceMenuOpen, setIsPerformanceMenuOpen] = useState<boolean>(false);
  const [isDebugMenuOpen, setIsDebugMenuOpen] = useState<boolean>(false);

  // Engine References
  const powderEngineRef = useRef<PowderEngine | null>(null);
  const gpuEngineRef = useRef<WebglGpuParticleEngine | null>(null);

  // Telemetry getters for Header
  const powderFps = activeTab === 'powder' ? (powderEngineRef.current?.diagnostic.fps || 60) : 0;
  const gpuFps = activeTab === 'gpu' ? (gpuEngineRef.current?.stats.fps || 60) : 0;
  const powderCellCount = powderEngineRef.current?.diagnostic.activeCellsCount || 0;
  const gpuParticleCount = gpuEngineRef.current?.stats.particleCountActive || 500000;
  const autoFixesCount = (powderEngineRef.current?.diagnostic.autoFixesExecuted || 0) + (gpuEngineRef.current?.stats.autoHealingCount || 0);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden select-none">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        powderFps={powderFps}
        gpuFps={gpuFps}
        powderCellCount={powderCellCount}
        gpuParticleCount={gpuParticleCount}
        openPerformanceMenu={() => setIsPerformanceMenuOpen(true)}
        openDebugMenu={() => setIsDebugMenuOpen(true)}
        autoFixesCount={autoFixesCount}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 flex flex-col w-full h-full ${activeTab === 'powder' ? 'flex' : 'hidden'}`}>
          <PowderSimulatorView
            engineRef={powderEngineRef}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
            openElementPicker={() => setIsElementPickerOpen(true)}
            isActive={activeTab === 'powder'}
          />
        </div>

        <div className={`flex-1 flex flex-col w-full h-full ${activeTab === 'gpu' ? 'flex' : 'hidden'}`}>
          <GpuParticleSimulatorView
            gpuEngineRef={gpuEngineRef}
            isActive={activeTab === 'gpu'}
          />
        </div>

        {activeTab === 'diagnostics' && (
          <DiagnosticsView
            powderEngineRef={powderEngineRef}
            gpuEngineRef={gpuEngineRef}
            openDebugMenu={() => setIsDebugMenuOpen(true)}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <ElementPickerModal
        isOpen={isElementPickerOpen}
        onClose={() => setIsElementPickerOpen(false)}
        selectedElementId={selectedElementId}
        onSelectElement={(id) => setSelectedElementId(id)}
      />

      <PerformanceMenuModal
        isOpen={isPerformanceMenuOpen}
        onClose={() => setIsPerformanceMenuOpen(false)}
        powderEngineRef={powderEngineRef}
        gpuEngineRef={gpuEngineRef}
      />

      <DebugMenuModal
        isOpen={isDebugMenuOpen}
        onClose={() => setIsDebugMenuOpen(false)}
        powderEngineRef={powderEngineRef}
        gpuEngineRef={gpuEngineRef}
      />
    </div>
  );
}
