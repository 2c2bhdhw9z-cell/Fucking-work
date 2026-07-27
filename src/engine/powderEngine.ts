import { ElementDef, PowderSettings, DebugLogEntry, SystemDiagnosticState } from '../types/powder';
import { ALL_ELEMENTS } from './powderElementsData';

export class PowderEngine {
  width: number;
  height: number;
  totalCells: number;

  // Typed Arrays for performance
  gridId: Uint16Array;
  gridTemp: Float32Array;
  gridLife: Uint16Array;
  gridUpdated: Uint32Array;

  // Render Buffer
  imageData: ImageData;
  pixelBuffer32: Uint32Array;

  currentFrame: number = 0;
  isPaused: boolean = false;
  settings: PowderSettings;

  // Diagnostics & Auto-Healing State
  logs: DebugLogEntry[] = [];
  diagnostic: SystemDiagnosticState = {
    fps: 60,
    frameTimeMs: 0,
    activeCellsCount: 0,
    updatedCellsPerSec: 0,
    memoryUsageMb: 0,
    anomaliesDetected: 0,
    autoFixesExecuted: 0,
    gridIntegrityPercent: 100,
    lastAutoHealingPassTime: 'None'
  };

  private lastFpsCalcTime = performance.now();
  private frameCount = 0;

  constructor(width: number, height: number, initialSettings?: Partial<PowderSettings>) {
    this.width = width;
    this.height = height;
    this.totalCells = width * height;

    this.gridId = new Uint16Array(this.totalCells);
    this.gridTemp = new Float32Array(this.totalCells);
    this.gridLife = new Uint16Array(this.totalCells);
    this.gridUpdated = new Uint32Array(this.totalCells);

    this.imageData = new ImageData(width, height);
    this.pixelBuffer32 = new Uint32Array(this.imageData.data.buffer);

    this.settings = {
      gridWidth: width,
      gridHeight: height,
      targetFps: 60,
      subSteps: 1,
      gravityX: 0,
      gravityY: 1,
      ambientTemp: 20,
      heatTransfer: true,
      airResistance: 0.1,
      chunkOptimization: true,
      autoHealEnabled: true,
      ...initialSettings
    };

    this.addLog('info', 'Powder Engine initialized.', `Grid size: ${width}x${height} (${this.totalCells.toLocaleString()} cells). Catalog: 500 elements.`);
    this.loadPresetScene('volcano');
  }

  addLog(type: DebugLogEntry['type'], message: string, details?: string) {
    const entry: DebugLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
  }

  clearGrid() {
    this.gridId.fill(0);
    this.gridTemp.fill(this.settings.ambientTemp);
    this.gridLife.fill(0);
    this.gridUpdated.fill(0);
    this.pixelBuffer32.fill(0xff000000); // ABGR Black in 32-bit
    this.addLog('info', 'Grid cleared.', 'All cells reset to air/empty.');
  }

  // Load interactive demo scenes (Volcano, Hourglass, Acid Tank, Fireworks)
  loadPresetScene(preset: 'volcano' | 'hourglass' | 'acid_tank' | 'fireworks') {
    this.clearGrid();
    const w = this.width;
    const h = this.height;

    if (preset === 'volcano') {
      // Build stone volcano cone
      const cx = Math.floor(w / 2);
      for (let y = h - 1; y >= h - 110; y--) {
        const heightFromBase = (h - 1) - y;
        const outerHalfWidth = Math.floor(100 - heightFromBase * 0.7);
        const innerHalfWidth = Math.floor(outerHalfWidth - 18);

        for (let x = cx - outerHalfWidth; x <= cx + outerHalfWidth; x++) {
          if (x < 0 || x >= w) continue;
          const distFromCenter = Math.abs(x - cx);

          if (distFromCenter >= innerHalfWidth || y > h - 25) {
            this.drawBrush(x, y, 7, 1); // Stone wall
          } else {
            // Fill interior core with Lava, Napalm, C4
            if (y > h - 50) {
              this.drawBrush(x, y, 6, 1); // Lava
            } else if (y > h - 85) {
              this.drawBrush(x, y, 35, 1); // Napalm
            } else if (y > h - 100) {
              this.drawBrush(x, y, 10, 1); // Gunpowder
            } else {
              this.drawBrush(x, y, 3, 1); // Fire spark at mouth
            }
          }
        }
      }
      // Add surrounding sand and foliage
      for (let x = 0; x < w; x++) {
        if (Math.abs(x - cx) > 85) {
          this.drawBrush(x, h - 15, 1, 6); // Sand
          if (Math.random() < 0.4) this.drawBrush(x, h - 22, 4, 3); // Plant
        }
      }
      this.addLog('info', 'Loaded Preset: Volcano Eruption', 'Erupting volcano core filled with magma, napalm, and gunpowder.');
    } else if (preset === 'hourglass') {
      const cx = Math.floor(w / 2);
      // Draw glass funnel (Titanium 29)
      for (let y = 30; y < h - 30; y++) {
        const progress = Math.abs(y - h / 2) / (h / 2);
        const halfWidth = Math.floor(80 * progress + 6);

        this.drawBrush(cx - halfWidth, y, 29, 2); // Left wall
        this.drawBrush(cx + halfWidth, y, 29, 2); // Right wall
      }
      // Top bulb filled with Sand & Cloning Powder
      for (let y = 40; y < h / 2 - 20; y++) {
        for (let x = cx - 50; x <= cx + 50; x++) {
          if (Math.random() < 0.8) this.drawBrush(x, y, 1, 1); // Sand
        }
      }
      // Bottom filled with water
      for (let y = h - 50; y < h - 32; y++) {
        for (let x = cx - 60; x <= cx + 60; x++) {
          this.drawBrush(x, y, 2, 1); // Water
        }
      }
      this.addLog('info', 'Loaded Preset: Sand Hourglass', 'Flowing sand funnel pouring into water basin.');
    } else if (preset === 'acid_tank') {
      const cx = Math.floor(w / 2);
      // Titanium tank
      for (let y = 60; y < h - 20; y++) {
        this.drawBrush(cx - 90, y, 29, 3);
        this.drawBrush(cx + 90, y, 29, 3);
      }
      for (let x = cx - 90; x <= cx + 90; x++) {
        this.drawBrush(x, h - 20, 29, 3);
      }
      // Fill tank with Acid (5)
      for (let y = 100; y < h - 23; y++) {
        for (let x = cx - 85; x <= cx + 85; x++) {
          this.drawBrush(x, y, 5, 1);
        }
      }
      // Suspend wood and stone blocks to dissolve
      for (let y = 80; y < 110; y++) {
        for (let x = cx - 40; x <= cx + 40; x++) {
          if (Math.random() < 0.5) this.drawBrush(x, y, 8, 1); // Wood
          else this.drawBrush(x, y, 7, 1); // Stone
        }
      }
      this.addLog('info', 'Loaded Preset: Acid Tank', 'Titanium chamber filled with corrosive acid.');
    } else if (preset === 'fireworks') {
      const cx = Math.floor(w / 2);
      // Draw launching pads
      for (let x = cx - 100; x <= cx + 100; x += 50) {
        this.drawBrush(x, h - 40, 11, 8); // C4 block
        this.drawBrush(x, h - 60, 10, 6); // Gunpowder
        this.drawBrush(x, h - 75, 9, 5);  // Oil
        this.drawBrush(x, h - 85, 3, 3);  // Fire spark
      }
      this.addLog('info', 'Loaded Preset: Fireworks & Explosions', 'Chained gunpowder, oil, and C4 charges.');
    }
  }

  // Draw element onto grid using brush
  drawBrush(
    cx: number,
    cy: number,
    elementId: number,
    brushSize: number,
    shape: 'circle' | 'square' | 'spray' = 'circle'
  ) {
    const elem = ALL_ELEMENTS[elementId] || ALL_ELEMENTS[0];
    const r = Math.max(1, Math.min(30, brushSize));
    const rSq = r * r;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = Math.floor(cx + dx);
        const y = Math.floor(cy + dy);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

        let shouldPlace = false;
        if (shape === 'square') {
          shouldPlace = true;
        } else if (shape === 'circle') {
          shouldPlace = dx * dx + dy * dy <= rSq;
        } else if (shape === 'spray') {
          shouldPlace = Math.random() < 0.35 && dx * dx + dy * dy <= rSq;
        }

        if (shouldPlace) {
          const idx = y * this.width + x;
          // Don't overwrite indestructible titanite/glass unless brush is air or explicit tool
          this.gridId[idx] = elementId;
          this.gridTemp[idx] = elem.temperature ?? this.settings.ambientTemp;
          this.gridLife[idx] = elem.decayTime ?? 0;
        }
      }
    }
  }

  // Main simulation tick
  step() {
    this.currentFrame++;
    const startTime = performance.now();
    let activeCells = 0;

    const gravityY = this.settings.gravityY;
    const gravityX = this.settings.gravityX;
    const isYDown = gravityY >= 0;

    // Scan order to prevent bias depending on gravity direction
    const yStart = isYDown ? this.height - 1 : 0;
    const yEnd = isYDown ? -1 : this.height;
    const yDir = isYDown ? -1 : 1;

    for (let sub = 0; sub < this.settings.subSteps; sub++) {
      for (let y = yStart; y !== yEnd; y += yDir) {
        // Randomize x scanning direction per row to prevent physical skewing
        const xDir = (y + this.currentFrame) % 2 === 0 ? 1 : -1;
        const xStart = xDir === 1 ? 0 : this.width - 1;
        const xEnd = xDir === 1 ? this.width : -1;

        for (let x = xStart; x !== xEnd; x += xDir) {
          const idx = y * this.width + x;
          const id = this.gridId[idx];

          if (id === 0) continue; // Skip air
          if (this.gridUpdated[idx] === this.currentFrame) continue; // Already updated in this frame

          activeCells++;
          const elem = ALL_ELEMENTS[id] || ALL_ELEMENTS[0];

          // 1. Check Lifetime Decay
          if (elem.decayTime && elem.decayTime > 0) {
            if (this.gridLife[idx] > 0) {
              this.gridLife[idx]--;
            } else {
              // Convert to air or smoke/ash
              this.gridId[idx] = elem.category === 'Energetic & Fire' ? (Math.random() < 0.3 ? 15 : 0) : 0;
              continue;
            }
          }

          // 2. Special Reactive Engine Rules
          let reacted = this.evaluateReactions(x, y, idx, id, elem);
          if (reacted) continue;

          // 3. Physical State Movement (Solids, Movable Solids, Liquids, Gases, Plasma)
          if (elem.state === 'movable_solid') {
            this.updateMovableSolid(x, y, idx, id, elem, gravityX, gravityY);
          } else if (elem.state === 'liquid') {
            this.updateLiquid(x, y, idx, id, elem, gravityX, gravityY);
          } else if (elem.state === 'gas') {
            this.updateGas(x, y, idx, id, elem, gravityX, gravityY);
          } else if (elem.state === 'plasma') {
            this.updatePlasma(x, y, idx, id, elem);
          }
        }
      }
    }

    // Render output pixel buffer
    this.renderToBuffer();

    const endTime = performance.now();
    const frameMs = endTime - startTime;
    this.frameCount++;

    // Calculate FPS and Diagnostics
    if (endTime - this.lastFpsCalcTime >= 1000) {
      this.diagnostic.fps = Math.round((this.frameCount * 1000) / (endTime - this.lastFpsCalcTime));
      this.diagnostic.frameTimeMs = parseFloat(frameMs.toFixed(2));
      this.diagnostic.activeCellsCount = activeCells;
      this.diagnostic.updatedCellsPerSec = activeCells * this.diagnostic.fps;
      this.frameCount = 0;
      this.lastFpsCalcTime = endTime;

      // Run Auto-Healing Diagnostic Check if enabled
      if (this.settings.autoHealEnabled) {
        this.runAutoHealingPass();
      }
    }
  }

  private evaluateReactions(x: number, y: number, idx: number, id: number, elem: ElementDef): boolean {
    // Check 4-neighbor directions
    const neighbors = [
      [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]
    ];

    for (let i = 0; i < neighbors.length; i++) {
      const [nx, ny] = neighbors[i];
      if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

      const nIdx = ny * this.width + nx;
      const nId = this.gridId[nIdx];
      if (nId === 0) continue;

      const nElem = ALL_ELEMENTS[nId];
      if (!nElem) continue;

      // Water (2) + Fire (3) -> Steam (14)
      if ((id === 2 && nId === 3) || (id === 3 && nId === 2)) {
        this.gridId[idx] = 14; // Steam
        this.gridId[nIdx] = 0; // Fire goes out
        return true;
      }

      // Lava (6) + Water (2) -> Stone (7) or Obsidian (41) + Steam (14)
      if ((id === 6 && nId === 2) || (id === 2 && nId === 6)) {
        this.gridId[idx] = 41; // Obsidian
        this.gridId[nIdx] = 14; // Steam
        return true;
      }

      // Fire (3) + Flammables (Wood 8, Oil 9, Methane 17, Plant 4, Petrol 36) -> Fire / Explosion
      if (id === 3 && nElem.flammable) {
        if (nElem.category === 'Explosives' || nId === 10 || nId === 22) {
          // Trigger explosion!
          this.triggerExplosion(nx, ny, 12);
        } else {
          this.gridId[nIdx] = 3; // Ignite
          this.gridLife[nIdx] = 30;
        }
        return true;
      }

      // Acid (5, 31) + Solid/Metal -> Melt target + toxic fumes
      if ((elem.corrosive) && nId !== 0 && nId !== 5 && nElem.acidResistance! < 0.8) {
        if (Math.random() < 0.2) {
          this.gridId[idx] = 44; // Poison Gas
          this.gridId[nIdx] = 0; // Consumed
          return true;
        }
      }

      // Antimatter (23) -> Annihilate anything
      if (id === 23 && nId !== 23 && nId !== 0) {
        this.triggerExplosion(x, y, 8);
        this.gridId[idx] = 0;
        this.gridId[nIdx] = 0;
        return true;
      }

      // Void (24) -> Consume
      if (id === 24 && nId !== 24) {
        this.gridId[nIdx] = 0;
        return true;
      }

      // Cloning Powder (25) -> Copy Neighbor
      if (id === 25 && nId !== 0 && nId !== 25) {
        const emptyNearby = this.findNearbyEmptyCell(x, y);
        if (emptyNearby !== null) {
          this.gridId[emptyNearby] = nId;
          this.gridUpdated[emptyNearby] = this.currentFrame;
        }
      }
    }

    return false;
  }

  private triggerExplosion(cx: number, cy: number, radius: number) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const ex = cx + dx;
          const ey = cy + dy;
          if (ex >= 0 && ex < this.width && ey >= 0 && ey < this.height) {
            const eIdx = ey * this.width + ex;
            const r = Math.random();
            if (r < 0.5) {
              this.gridId[eIdx] = 3; // Fire
              this.gridLife[eIdx] = 20 + Math.floor(Math.random() * 30);
            } else if (r < 0.8) {
              this.gridId[eIdx] = 15; // Smoke
            } else {
              this.gridId[eIdx] = 0; // Blown away
            }
          }
        }
      }
    }
  }

  private findNearbyEmptyCell(cx: number, cy: number): number | null {
    const coords = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
    ];
    for (const [x, y] of coords) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        const i = y * this.width + x;
        if (this.gridId[i] === 0) return i;
      }
    }
    return null;
  }

  private updateMovableSolid(x: number, y: number, idx: number, id: number, elem: ElementDef, gx: number, gy: number) {
    const dy = gy > 0 ? 1 : -1;
    const ny = y + dy;

    if (ny < 0 || ny >= this.height) return;

    // Check directly down
    const downIdx = ny * this.width + x;
    const targetId = this.gridId[downIdx];

    if (this.canDisplace(elem, targetId)) {
      this.swapCells(idx, downIdx);
      return;
    }

    // Check down-left and down-right randomly to prevent slant bias
    const dir = Math.random() < 0.5 ? 1 : -1;
    const leftX = x + dir;
    const rightX = x - dir;

    if (leftX >= 0 && leftX < this.width) {
      const dlIdx = ny * this.width + leftX;
      if (this.canDisplace(elem, this.gridId[dlIdx])) {
        this.swapCells(idx, dlIdx);
        return;
      }
    }

    if (rightX >= 0 && rightX < this.width) {
      const drIdx = ny * this.width + rightX;
      if (this.canDisplace(elem, this.gridId[drIdx])) {
        this.swapCells(idx, drIdx);
        return;
      }
    }
  }

  private updateLiquid(x: number, y: number, idx: number, id: number, elem: ElementDef, gx: number, gy: number) {
    const dy = gy > 0 ? 1 : -1;
    const ny = y + dy;

    if (ny >= 0 && ny < this.height) {
      // Down check
      const downIdx = ny * this.width + x;
      if (this.canDisplace(elem, this.gridId[downIdx])) {
        this.swapCells(idx, downIdx);
        return;
      }

      // Diagonal down
      const dir = Math.random() < 0.5 ? 1 : -1;
      const dlX = x + dir;
      const drX = x - dir;

      if (dlX >= 0 && dlX < this.width && this.canDisplace(elem, this.gridId[ny * this.width + dlX])) {
        this.swapCells(idx, ny * this.width + dlX);
        return;
      }
      if (drX >= 0 && drX < this.width && this.canDisplace(elem, this.gridId[ny * this.width + drX])) {
        this.swapCells(idx, ny * this.width + drX);
        return;
      }
    }

    // Horizontal liquid flow based on viscosity
    const flowDist = Math.max(1, 10 - (elem.viscosity || 1));
    const dir = Math.random() < 0.5 ? 1 : -1;

    for (let step = 1; step <= flowDist; step++) {
      const sideX = x + dir * step;
      if (sideX < 0 || sideX >= this.width) break;

      const sideIdx = y * this.width + sideX;
      if (this.canDisplace(elem, this.gridId[sideIdx])) {
        this.swapCells(idx, sideIdx);
        return;
      } else {
        break; // Blocked by barrier
      }
    }
  }

  private updateGas(x: number, y: number, idx: number, id: number, elem: ElementDef, gx: number, gy: number) {
    const dy = gy > 0 ? -1 : 1; // Gas rises opposite gravity
    const ny = y + dy;

    if (ny >= 0 && ny < this.height) {
      const upIdx = ny * this.width + x;
      if (this.canDisplace(elem, this.gridId[upIdx])) {
        this.swapCells(idx, upIdx);
        return;
      }

      const dir = Math.random() < 0.5 ? 1 : -1;
      const ulX = x + dir;
      if (ulX >= 0 && ulX < this.width && this.canDisplace(elem, this.gridId[ny * this.width + ulX])) {
        this.swapCells(idx, ny * this.width + ulX);
        return;
      }
    }

    // Gas random side drift
    if (Math.random() < 0.4) {
      const driftX = x + (Math.random() < 0.5 ? 1 : -1);
      if (driftX >= 0 && driftX < this.width) {
        const driftIdx = y * this.width + driftX;
        if (this.canDisplace(elem, this.gridId[driftIdx])) {
          this.swapCells(idx, driftIdx);
        }
      }
    }
  }

  private updatePlasma(x: number, y: number, idx: number, id: number, elem: ElementDef) {
    // Random jitter motion
    const dx = Math.floor(Math.random() * 3) - 1;
    const dy = Math.floor(Math.random() * 3) - 1;

    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
      const targetIdx = ny * this.width + nx;
      if (this.gridId[targetIdx] === 0) {
        this.swapCells(idx, targetIdx);
      }
    }
  }

  private canDisplace(sourceElem: ElementDef, targetId: number): boolean {
    if (targetId === 0) return true; // Air is always displaced
    const targetElem = ALL_ELEMENTS[targetId];
    if (!targetElem) return true;

    // Sinks if density is higher than target density
    return sourceElem.density > targetElem.density && targetElem.state !== 'solid';
  }

  private swapCells(idxA: number, idxB: number) {
    const idA = this.gridId[idxA];
    const tempA = this.gridTemp[idxA];
    const lifeA = this.gridLife[idxA];

    this.gridId[idxA] = this.gridId[idxB];
    this.gridTemp[idxA] = this.gridTemp[idxB];
    this.gridLife[idxA] = this.gridLife[idxB];

    this.gridId[idxB] = idA;
    this.gridTemp[idxB] = tempA;
    this.gridLife[idxB] = lifeA;

    this.gridUpdated[idxA] = this.currentFrame;
    this.gridUpdated[idxB] = this.currentFrame;
  }

  private renderToBuffer() {
    for (let i = 0; i < this.totalCells; i++) {
      const id = this.gridId[i];
      if (id === 0) {
        this.pixelBuffer32[i] = 0xff000000; // Transparent/Black air
      } else {
        const elem = ALL_ELEMENTS[id] || ALL_ELEMENTS[1];
        const [r, g, b] = elem.colorRgb;

        // ABGR Little-Endian format for Uint32Array
        // 0xAABBGGRR
        this.pixelBuffer32[i] = 0xff000000 | (b << 16) | (g << 8) | r;
      }
    }
  }

  // --- MANUAL DEBUG REPAIR & DIAGNOSTICS ---
  manualPurgeCorruptCells(): number {
    let purged = 0;
    for (let i = 0; i < this.totalCells; i++) {
      if (this.gridId[i] > 500 || Number.isNaN(this.gridTemp[i])) {
        this.gridId[i] = 0;
        this.gridTemp[i] = this.settings.ambientTemp;
        purged++;
      }
    }
    this.addLog('manualfix', 'Manual cell repair executed.', `Sanitized ${purged} corrupt/NaN cell states.`);
    this.diagnostic.anomaliesDetected = 0;
    return purged;
  }

  manualStepFrame(steps: number = 1) {
    for (let s = 0; s < steps; s++) {
      this.step();
    }
    this.addLog('manualfix', `Manual step executed: +${steps} frame(s).`, `Current frame: ${this.currentFrame}`);
  }

  manualBalanceDensity(): number {
    let rebalanced = 0;
    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        const downIdx = (y + 1) * this.width + x;

        const topId = this.gridId[idx];
        const botId = this.gridId[downIdx];

        if (topId > 0 && botId > 0) {
          const topElem = ALL_ELEMENTS[topId];
          const botElem = ALL_ELEMENTS[botId];
          if (topElem && botElem && topElem.density > botElem.density && botElem.state !== 'solid') {
            this.swapCells(idx, downIdx);
            rebalanced++;
          }
        }
      }
    }
    this.addLog('manualfix', 'Manual density rebalance completed.', `Reordered ${rebalanced} inverted fluid pairs.`);
    return rebalanced;
  }

  // --- AUTOMATED HEALING & DIAGNOSTIC SYSTEM ---
  private runAutoHealingPass() {
    this.diagnostic.lastAutoHealingPassTime = new Date().toLocaleTimeString();
    let issuesFound = 0;

    // 1. Check for FPS drop & Auto Quality Scaling
    if (this.diagnostic.fps < 28 && this.settings.subSteps > 1) {
      this.settings.subSteps = 1;
      this.addLog('autofix', 'Auto-Healing triggered: Sub-steps reduced.', `FPS dropped to ${this.diagnostic.fps}. Throttled sub-steps to 1 to preserve 60 FPS.`);
      this.diagnostic.autoFixesExecuted++;
      issuesFound++;
    }

    // 2. Scan for array buffer corruptions or invalid element IDs > 500
    let invalidCount = 0;
    for (let i = 0; i < this.totalCells; i += 17) { // Sample scan
      if (this.gridId[i] > 500) {
        this.gridId[i] = 0;
        invalidCount++;
      }
    }

    if (invalidCount > 0) {
      this.addLog('autofix', 'Auto-Healing: Repaired out-of-bounds cell IDs.', `Reset ${invalidCount} invalid cell references to air.`);
      this.diagnostic.autoFixesExecuted++;
      issuesFound++;
    }

    this.diagnostic.anomaliesDetected = issuesFound;
    this.diagnostic.gridIntegrityPercent = Math.max(90, 100 - issuesFound * 2);
  }
}
