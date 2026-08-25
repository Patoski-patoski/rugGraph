import React from 'react';
import { MaterialIcon } from './MaterialIcon';
import { ScenarioType } from '../types/graph';

interface ScenarioSelectorProps {
  currentScenario: ScenarioType;
  onSelectScenario: (scenario: ScenarioType) => void;
  stats: {
    washRings: number;
    sybilFarms: number;
  };
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  currentScenario,
  onSelectScenario,
  stats,
}) => {
  const scenarios: Array<{
    id: ScenarioType;
    label: string;
    description: string;
    icon: string;
    badge?: string;
    badgeColor?: string;
    activeColor: string;
  }> = [
    {
      id: 'WASH_RING',
      label: 'Wash-Trading Ring',
      description: '4-Hop circular money loop inflating $PEPE volume',
      icon: 'sync',
      badge: stats.washRings > 0 ? `${stats.washRings} Ring` : 'Multi-Hop Loop',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      activeColor: 'border-rose-500 bg-rose-500/10 text-rose-300 shadow-rose-500/10',
    },
    {
      id: 'SYBIL_FARM',
      label: 'Sybil Bot Cluster',
      description: '1 Mastermind funding 12 sniper bots on $MOON',
      icon: 'smart_toy',
      badge: stats.sybilFarms > 0 ? `${stats.sybilFarms} Farm` : '1-to-N Fan-Out',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      activeColor: 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-amber-500/10',
    },
    {
      id: 'PEELING_CHAIN',
      label: 'Peeling Chain',
      description: '500 SOL chopped down sequentially to Binance CEX',
      icon: 'alt_route',
      badge: 'Laundering Route',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      activeColor: 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-purple-500/10',
    },
    {
      id: 'ALL',
      label: 'Full Network Overview',
      description: 'Combined ecosystem: Organic traders & flagged clusters',
      icon: 'grain',
      badge: 'Full Graph',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      activeColor: 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-cyan-500/10',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Forensic Scenarios
        </span>
        <span className="text-[10px] text-slate-500">1-Click Presets</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {scenarios.map((s) => {
          const isActive = currentScenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectScenario(s.id)}
              className={`text-left p-3 rounded-xl border transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? `${s.activeColor} shadow-md`
                  : 'bg-surface/60 hover:bg-surface-elevated/80 border-border/80 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <MaterialIcon
                    name={s.icon}
                    size={20}
                    className={isActive ? 'text-white' : 'text-slate-400'}
                  />
                  <span className="font-semibold text-xs tracking-tight text-white">
                    {s.label}
                  </span>
                </div>
                {s.badge && (
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${s.badgeColor}`}
                  >
                    {s.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {s.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
