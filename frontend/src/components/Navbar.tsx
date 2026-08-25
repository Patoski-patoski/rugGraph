import React from 'react';
import { MaterialIcon } from './MaterialIcon';
import { DatabaseHealth } from '../types/graph';

interface NavbarProps {
  health: DatabaseHealth | null;
  onOpenWhyGraph: () => void;
  onOpenSeedModal: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onOpenWhyGraph,
  onOpenSeedModal,
  isLoading,
}) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between z-30 relative">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
          <MaterialIcon name="hub" size={24} className="text-white" filled />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              RugGraph
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                openCypher
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-normal">
            On-Chain Wash Trading & Sybil Graph Intelligence
          </p>
        </div>
      </div>

      {/* Center Status: CognoDB Live Health */}
      <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-surface-elevated/70 border border-border/80 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="font-medium text-slate-200">
            {isHealthy ? 'CognoDB Active' : 'CognoDB Offline'}
          </span>
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400 font-mono">
          {isHealthy ? `${health.nodeCount} Nodes / ${health.relationshipCount} Edges` : 'Awaiting Connection'}
        </span>
        {isHealthy && (
          <>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono">{health.latencyMs}ms</span>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenWhyGraph}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-surface-elevated/80 hover:bg-surface-elevated border border-border hover:border-cyan-500/40 rounded-lg transition-all duration-150 shadow-sm"
        >
          <MaterialIcon name="lightbulb" size={18} className="text-amber-400" />
          <span>Why Graph DB?</span>
        </button>

        <button
          onClick={onOpenSeedModal}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-cyan-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 disabled:opacity-50 rounded-lg transition-all duration-150 shadow-md shadow-cyan-500/20"
        >
          <MaterialIcon name="database" size={18} filled />
          <span>Seed / Reset Data</span>
        </button>
      </div>
    </header>
  );
};
