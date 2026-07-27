import { ElementDef, ElementCategory } from '../types/powder';

// Helper to construct hex & RGB from HSL or custom palettes
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// 0 is ALWAYS Empty Air
const AIR: ElementDef = {
  id: 0,
  name: 'Air / Empty',
  category: 'Gases',
  color: '#000000',
  colorRgb: [0, 0, 0],
  density: 0,
  state: 'gas',
  description: 'Empty space or ambient air.',
};

// Core iconic elements (1-60 explicitly named with specific physical traits)
const CORE_ELEMENTS: Partial<ElementDef>[] = [
  { id: 1, name: 'Sand', category: 'Powders', color: '#e6c280', density: 10, state: 'movable_solid', description: 'Basic falling sand. Sinks in liquids.' },
  { id: 2, name: 'Water', category: 'Liquids', color: '#3388ff', density: 5, state: 'liquid', viscosity: 2, description: 'Flowing water. Extinguishes fire, dissolves salt, hydrates plants.' },
  { id: 3, name: 'Fire', category: 'Energetic & Fire', color: '#ff4400', density: -1, state: 'plasma', decayTime: 40, temperature: 800, flammable: false, description: 'Hot flickering fire. Ignites flammables, turns water into steam.' },
  { id: 4, name: 'Plant', category: 'Organics & Flora', color: '#22cc44', density: 100, state: 'solid', description: 'Organic plant material. Grows when fed water, burns readily.' },
  { id: 5, name: 'Acid', category: 'Acids & Corrosives', color: '#33ff33', density: 6, state: 'liquid', corrosive: true, viscosity: 1, description: 'Corrosive acid that melts most materials into toxic fumes.' },
  { id: 6, name: 'Lava', category: 'Energetic & Fire', color: '#ff6600', density: 8, state: 'liquid', viscosity: 7, temperature: 1200, description: 'Molten rock. Ignites nearby combustibles, solidifies into stone when touching water.' },
  { id: 7, name: 'Stone', category: 'Solids', color: '#888888', density: 50, state: 'solid', acidResistance: 0.8, description: 'Heavy indestructible rock barrier.' },
  { id: 8, name: 'Wood', category: 'Organics & Flora', color: '#8b5a2b', density: 30, state: 'solid', flammable: true, description: 'Combustible timber structure.' },
  { id: 9, name: 'Oil', category: 'Liquids', color: '#665533', density: 3, state: 'liquid', viscosity: 4, flammable: true, description: 'Highly flammable petroleum fluid. Floats on water.' },
  { id: 10, name: 'Gunpowder', category: 'Explosives', color: '#555555', density: 9, state: 'movable_solid', flammable: true, description: 'Explosive black powder. Detonates instantly upon spark.' },
  { id: 11, name: 'C4', category: 'Explosives', color: '#d1b894', density: 15, state: 'solid', flammable: true, description: 'High-yield explosive solid block.' },
  { id: 12, name: 'Fuse', category: 'Explosives', color: '#cc9933', density: 20, state: 'solid', flammable: true, description: 'Slow-burning pyrotechnic line.' },
  { id: 13, name: 'Ice', category: 'Solids', color: '#99ddff', density: 4, state: 'solid', temperature: -10, description: 'Cold frozen ice. Melts into water under heat.' },
  { id: 14, name: 'Steam', category: 'Gases', color: '#e0e0e0', density: -2, state: 'gas', temperature: 100, description: 'Hot rising vapor. Condenses into water when cooling.' },
  { id: 15, name: 'Smoke', category: 'Gases', color: '#777777', density: -1, state: 'gas', decayTime: 120, description: 'Rising plume generated from combustion.' },
  { id: 16, name: 'Glass', category: 'Solids', color: '#bbffff', density: 40, state: 'solid', acidResistance: 0.95, description: 'Transparent silica glass. Resistant to acid.' },
  { id: 17, name: 'Methane', category: 'Gases', color: '#aaffaa', density: -3, state: 'gas', flammable: true, description: 'Rising flammable gas. Explodes on contact with fire.' },
  { id: 18, name: 'Lightning', category: 'Plasma & Laser', color: '#ffff33', density: 0, state: 'plasma', decayTime: 5, temperature: 3000, description: 'High voltage energetic discharge.' },
  { id: 19, name: 'Salt', category: 'Powders', color: '#ffffff', density: 8, state: 'movable_solid', description: 'White crystalline powder. Melts ice and dissolves in water.' },
  { id: 20, name: 'Wax', category: 'Organics & Flora', color: '#ffffcc', density: 7, state: 'solid', flammable: true, temperature: 20, description: 'Paraffin wax. Melts when heated.' },
  { id: 21, name: 'Mercury', category: 'Metals & Alloys', color: '#cccccc', density: 13, state: 'liquid', viscosity: 1, description: 'Heavy liquid metal.' },
  { id: 22, name: 'Nitroglycerin', category: 'Explosives', color: '#ffcc00', density: 6, state: 'liquid', flammable: true, description: 'Extremely volatile explosive fluid.' },
  { id: 23, name: 'Antimatter', category: 'Radioactive & Cosmic', color: '#aa00ff', density: 0, state: 'movable_solid', description: 'Annihilates any matter it touches in an intense energy burst.' },
  { id: 24, name: 'Void', category: 'Tech & Special', color: '#111122', density: 0, state: 'solid', description: 'Black hole singularity that consumes all nearby particles.' },
  { id: 25, name: 'Cloning Powder', category: 'Tech & Special', color: '#ff00aa', density: 12, state: 'movable_solid', description: 'Replicates whatever element touches it.' },
  { id: 26, name: 'Thermite', category: 'Explosives', color: '#ff8833', density: 14, state: 'movable_solid', flammable: true, temperature: 2500, description: 'Burns at ultra-high temperatures, melting through stone and metal.' },
  { id: 27, name: 'Uranium', category: 'Radioactive & Cosmic', color: '#00ff66', density: 19, state: 'solid', description: 'Radioactive isotope emit heat & sparks.' },
  { id: 28, name: 'Plasma Torch', category: 'Plasma & Laser', color: '#00ffff', density: 0, state: 'plasma', decayTime: 10, temperature: 5000, description: 'Extreme concentrated plasma cutter.' },
  { id: 29, name: 'Titanium', category: 'Metals & Alloys', color: '#9999aa', density: 45, state: 'solid', acidResistance: 1.0, description: 'Indestructible heat-proof alloy.' },
  { id: 30, name: 'Superconductor', category: 'Tech & Special', color: '#00ccff', density: 35, state: 'solid', conductive: true, description: 'Zero resistance quantum matrix.' },
  { id: 31, name: 'Acid Lake', category: 'Acids & Corrosives', color: '#aaff00', density: 6, state: 'liquid', corrosive: true, viscosity: 3, description: 'Concentrated toxic corrosive fluid.' },
  { id: 32, name: 'Bio Slime', category: 'Organics & Flora', color: '#66ff33', density: 4, state: 'liquid', viscosity: 8, description: 'Sticky biological ooze.' },
  { id: 33, name: 'Coral', category: 'Organics & Flora', color: '#ff6699', density: 25, state: 'solid', description: 'Marine organism that expands slowly in water.' },
  { id: 34, name: 'Sprout', category: 'Organics & Flora', color: '#88ff00', density: 2, state: 'movable_solid', description: 'Growing seed particle.' },
  { id: 35, name: 'Napalm', category: 'Explosives', color: '#ff3300', density: 5, state: 'liquid', viscosity: 6, flammable: true, description: 'Sticky jellied incendiary chemical.' },
  { id: 36, name: 'Petrol', category: 'Liquids', color: '#ddaa33', density: 2, state: 'liquid', viscosity: 1, flammable: true, description: 'High volatility liquid fuel.' },
  { id: 37, name: 'Ash', category: 'Powders', color: '#aaaaaa', density: 1, state: 'movable_solid', description: 'Light leftover powder from burnt organic matter.' },
  { id: 38, name: 'Rust', category: 'Powders', color: '#b34700', density: 7, state: 'movable_solid', description: 'Corroded iron residue.' },
  { id: 39, name: 'Cryo Gel', category: 'Solids', color: '#66ffff', density: 8, state: 'liquid', viscosity: 9, temperature: -80, description: 'Freezing cryogenic gel that solidifies liquids.' },
  { id: 40, name: 'Supernova Spark', category: 'Radioactive & Cosmic', color: '#ffffaa', density: -5, state: 'plasma', decayTime: 60, description: 'Cosmic particle emitting light and energy.' },
  { id: 41, name: 'Obsidian', category: 'Solids', color: '#221133', density: 60, state: 'solid', acidResistance: 0.99, description: 'Volcanic glass formed from water and lava.' },
  { id: 42, name: 'Saltwater', category: 'Liquids', color: '#44aaff', density: 5, state: 'liquid', viscosity: 2, description: 'Saline aqueous solution.' },
  { id: 43, name: 'Molten Glass', category: 'Liquids', color: '#ff9933', density: 12, state: 'liquid', viscosity: 9, temperature: 900, description: 'Superheated liquid glass.' },
  { id: 44, name: 'Poison Gas', category: 'Gases', color: '#9933ff', density: -1, state: 'gas', corrosive: true, description: 'Toxic gas cloud.' },
  { id: 45, name: 'Laser Beam', category: 'Plasma & Laser', color: '#ff0055', density: 0, state: 'plasma', decayTime: 2, description: 'Directional high power photon ray.' },
  { id: 46, name: 'Magnetite', category: 'Metals & Alloys', color: '#444455', density: 18, state: 'movable_solid', description: 'Magnetic iron ore powder.' },
  { id: 47, name: 'Dust', category: 'Powders', color: '#d2b48c', density: 1, state: 'movable_solid', description: 'Fine particulate dust.' },
  { id: 48, name: 'Graphene', category: 'Tech & Special', color: '#1a1a1a', density: 2, state: 'solid', acidResistance: 1.0, description: 'Ultra-light high strength carbon lattice.' },
  { id: 49, name: 'Ember', category: 'Energetic & Fire', color: '#ffaa00', density: 2, state: 'movable_solid', decayTime: 80, temperature: 400, description: 'Glowing smoldering charcoal spark.' },
  { id: 50, name: 'Dark Matter', category: 'Radioactive & Cosmic', color: '#330044', density: 1000, state: 'solid', description: 'Ultra dense cosmic anchor.' }
];

// Helper categories for systematic procedural generation of remaining 450 elements up to 500
const CATEGORY_LIST: ElementCategory[] = [
  'Solids', 'Powders', 'Liquids', 'Gases', 'Explosives', 'Energetic & Fire',
  'Organics & Flora', 'Metals & Alloys', 'Acids & Corrosives', 'Radioactive & Cosmic',
  'Plasma & Laser', 'Tech & Special', 'Custom Synthesis'
];

const PREFIXES = [
  'Nano', 'Hyper', 'Quantum', 'Plasma', 'Chrono', 'Bio', 'Thermo', 'Aether',
  'Cyber', 'Flux', 'Stellar', 'Void', 'Pyro', 'Cryo', 'Aero', 'Geom',
  'Titan', 'Helio', 'Magma', 'Neutron', 'Proto', 'Synthetic', 'Crystal', 'Arc'
];

const BASES = [
  'Dust', 'Fluid', 'Gel', 'Alloy', 'Crystal', 'Gas', 'Vapor', 'Slag',
  'Matrix', 'Spore', 'Fiber', 'Resin', 'Catalyst', 'Isotope', 'Powder', 'Plasma',
  'Acid', 'Emulsion', 'Shard', 'Node', 'Pulse', 'Spark', 'Solvent', 'Ooze'
];

// Build full 500 element registry
export function generate500Elements(): ElementDef[] {
  const elementsMap: ElementDef[] = new Array(501);

  // 1. Air
  elementsMap[0] = AIR;

  // 2. Put explicit core elements (1-50)
  CORE_ELEMENTS.forEach(item => {
    if (!item.id) return;
    const rgb = item.colorRgb || [
      parseInt(item.color!.slice(1, 3), 16),
      parseInt(item.color!.slice(3, 5), 16),
      parseInt(item.color!.slice(5, 7), 16)
    ];
    elementsMap[item.id] = {
      id: item.id,
      name: item.name || `Element #${item.id}`,
      category: item.category || 'Powders',
      color: item.color || '#ffffff',
      colorRgb: rgb,
      density: item.density ?? 10,
      state: item.state || 'movable_solid',
      viscosity: item.viscosity,
      flammable: item.flammable ?? false,
      ignitionTemp: item.ignitionTemp,
      corrosive: item.corrosive ?? false,
      acidResistance: item.acidResistance ?? 0,
      decayTime: item.decayTime,
      conductive: item.conductive ?? false,
      temperature: item.temperature ?? 20,
      gravityMultiplier: item.gravityMultiplier ?? (item.state === 'gas' ? -1 : 1),
      description: item.description || 'Interactive simulation element.'
    };
  });

  // 3. Systematically fill elements 51 to 500 to ensure full 500 unique elements
  for (let i = 51; i <= 500; i++) {
    const catIndex = (i - 51) % CATEGORY_LIST.length;
    const category = CATEGORY_LIST[catIndex];
    const prefix = PREFIXES[(i * 7) % PREFIXES.length];
    const base = BASES[(i * 13) % BASES.length];
    const name = `${prefix} ${base} #${i}`;

    const hue = (i * 137.5) % 360; // Golden angle color distribution for maximum visual variety
    const sat = 60 + ((i * 17) % 35);
    const light = 35 + ((i * 23) % 40);
    const rgb = hslToRgb(hue, sat, light);
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);

    let state: ElementDef['state'] = 'movable_solid';
    let density = 10;
    let flammable = false;
    let corrosive = false;
    let viscosity = undefined;

    if (category === 'Liquids' || category === 'Acids & Corrosives') {
      state = 'liquid';
      density = 3 + (i % 8);
      viscosity = 1 + (i % 9);
      if (category === 'Acids & Corrosives') corrosive = true;
    } else if (category === 'Gases') {
      state = 'gas';
      density = -1 - (i % 4);
    } else if (category === 'Solids' || category === 'Metals & Alloys') {
      state = 'solid';
      density = 25 + (i % 50);
    } else if (category === 'Plasma & Laser' || category === 'Energetic & Fire') {
      state = 'plasma';
      density = 0;
      flammable = true;
    } else if (category === 'Explosives') {
      state = (i % 2 === 0) ? 'movable_solid' : 'solid';
      density = 12;
      flammable = true;
    }

    elementsMap[i] = {
      id: i,
      name,
      category,
      color: hex,
      colorRgb: rgb,
      density,
      state,
      viscosity,
      flammable,
      corrosive,
      acidResistance: corrosive ? 0 : 0.2,
      temperature: state === 'plasma' ? 1000 : 20,
      gravityMultiplier: state === 'gas' ? -1 : 1,
      description: `Synthesized ${category.toLowerCase()} element with reactive particle dynamics.`
    };
  }

  return elementsMap;
}

export const ALL_ELEMENTS = generate500Elements();

// Fast lookup maps
export const ELEMENT_BY_ID = ALL_ELEMENTS;
