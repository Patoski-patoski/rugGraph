import React from 'react';
import { MaterialIcon } from './MaterialIcon';

interface FilterPanelProps {
  minHops: number;
  setMinHops: (val: number) => void;
  maxHops: number;
  setMaxHops: (val: number) => void;
  minAmount: number;
  setMinAmount: (val: number) => void;
  filterFlaggedOnly: boolean;
  setFilterFlaggedOnly: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
  isCustomScenario: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  minHops,
  setMinHops,
  maxHops,
  setMaxHops,
  minAmount,
  setMinAmount,
  filterFlaggedOnly,
  setFilterFlaggedOnly,
  searchQuery,
  setSearchQuery,
  onApply,
  onReset,
  isCustomScenario,
}) => {
  return (
    <div className="bg-surface/90 backdrop-blur-md border border-border rounded-xl p-4 flex flex-col gap-4 shadow-lg text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <MaterialIcon name="tune" size={18} className="text-cyan-400" />
          <span>Graph Filters & Query Parameters</span>
        </div>
        <button
          onClick={onReset}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:underline text-[11px]"
        >
          <MaterialIcon name="restart_alt" size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MaterialIcon
          name="search"
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search wallet address, token symbol, or tag..."
          className="w-full bg-surface-elevated border border-border rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors font-mono text-[11px]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <MaterialIcon name="close" size={14} />
          </button>
        )}
      </div>

      {/* Filters — Vertical Stack */}
      <div className="flex flex-col gap-3">
        {/* Hop Range */}
        <div className="flex flex-col gap-1.5 bg-surface-elevated/40 p-2.5 rounded-lg border border-border/50">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-medium text-slate-400">Path Hop Length:</span>
            <span className="font-mono text-cyan-400 font-semibold">
              {minHops} – {maxHops} hops
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="2"
              max="6"
              value={minHops}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinHops(val);
                if (val > maxHops) setMaxHops(val);
              }}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
            <input
              type="range"
              min="2"
              max="6"
              value={maxHops}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxHops(val);
                if (val < minHops) setMinHops(val);
              }}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>2 hops (Direct Pair)</span>
            <span>6 hops (Deep Peeling)</span>
          </div>
        </div>

        {/* Min Volume */}
        <div className="flex flex-col gap-1.5 bg-surface-elevated/40 p-2.5 rounded-lg border border-border/50">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-medium text-slate-400">Min Transfer Amount:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {minAmount > 0 ? `${minAmount.toLocaleString()} SOL` : 'All Amounts'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0 SOL</span>
            <span>5,000+ SOL</span>
          </div>
        </div>

        {/* Toggles & Execute */}
        <div className="flex flex-col gap-2.5 bg-surface-elevated/40 p-2.5 rounded-lg border border-border/50">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={filterFlaggedOnly}
              onChange={(e) => setFilterFlaggedOnly(e.target.checked)}
              className="rounded bg-surface-elevated border-border text-cyan-500 focus:ring-cyan-500/20 w-4 h-4 accent-cyan-500"
            />
            <span className="text-[11px] font-medium">Show Flagged Anomaly Nodes Only</span>
          </label>

          <button
            onClick={onApply}
            className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all duration-150 flex items-center justify-center gap-1 shadow-md shadow-cyan-600/20"
          >
            <MaterialIcon name="play_arrow" size={16} filled />
            <span>{isCustomScenario ? 'Run Cypher Query' : 'Apply Filters'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
