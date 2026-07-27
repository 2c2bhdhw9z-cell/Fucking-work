import React, { useState, useMemo } from 'react';
import { ElementDef, ElementCategory } from '../types/powder';
import { ALL_ELEMENTS } from '../engine/powderElementsData';
import { Search, X, Layers, Flame, Droplets, Wind, ShieldAlert, Zap, Compass } from 'lucide-react';

interface ElementPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElementId: number;
  onSelectElement: (id: number) => void;
}

const CATEGORIES: ElementCategory[] = [
  'Solids',
  'Powders',
  'Liquids',
  'Gases',
  'Explosives',
  'Energetic & Fire',
  'Organics & Flora',
  'Metals & Alloys',
  'Acids & Corrosives',
  'Radioactive & Cosmic',
  'Plasma & Laser',
  'Tech & Special',
  'Custom Synthesis'
];

export const ElementPickerModal: React.FC<ElementPickerModalProps> = ({
  isOpen,
  onClose,
  selectedElementId,
  onSelectElement
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredElements = useMemo(() => {
    return ALL_ELEMENTS.filter((elem) => {
      if (!elem) return false;
      const matchesSearch =
        elem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        elem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        elem.id.toString() === searchQuery;

      const matchesCat =
        selectedCategory === 'All' || elem.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div id="element-picker-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              500 Reaction Elements Catalog
            </h2>
            <p className="text-xs text-slate-400">
              Select from solids, liquids, gases, explosives, plasma, and energetic synthesis compounds.
            </p>
          </div>
          <button
            id="btn-close-element-picker"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-element-search"
              type="text"
              placeholder="Search 500 elements by name, category, ID, or reaction type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown/Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All (500)
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Elements Grid View */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filteredElements.map((elem) => {
            const isSelected = elem.id === selectedElementId;
            return (
              <button
                key={elem.id}
                id={`btn-select-element-${elem.id}`}
                onClick={() => {
                  onSelectElement(elem.id);
                  onClose();
                }}
                className={`p-2 sm:p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all group relative overflow-hidden h-[54px] ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/50'
                    : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800'
                }`}
              >
                {/* Element Visual Color Swatch "Image" */}
                <div
                  className="w-7 h-7 rounded-lg border border-white/20 shadow-inner flex items-center justify-center shrink-0"
                  style={{ backgroundColor: elem.color }}
                >
                  <span className="text-[9px] font-mono font-bold text-black/70 drop-shadow-sm">
                    {elem.id}
                  </span>
                </div>

                {/* Name & Short Description */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                      {elem.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate leading-tight">
                    {elem.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredElements.length} of 500 elements</span>
          <span>Click any element to equip brush</span>
        </div>
      </div>
    </div>
  );
};
