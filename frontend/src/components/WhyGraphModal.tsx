import React from 'react';
import { MaterialIcon } from './MaterialIcon';

interface WhyGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyGraphModal: React.FC<WhyGraphModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 flex flex-col gap-5 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <MaterialIcon name="psychology" size={20} filled />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Why a Graph Database for Wash-Trading Forensics?
              </h2>
              <span className="text-[11px] text-slate-400">CognoDB (openCypher) vs Relational SQL</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {/* Core Value Prop */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3.5 text-cyan-200 leading-relaxed">
          <p className="font-medium">
            Blockchain transactions are naturally connected graphs, not isolated rows in a table. In on-chain forensics, the most critical questions are about <strong>paths, cycles, and cluster topologies of arbitrary lengths</strong>.
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Relational / SQL */}
          <div className="bg-surface-elevated/40 border border-rose-500/30 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <MaterialIcon name="cancel" size={16} />
              <span>Relational Database (SQL)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Requires exponential recursive CTEs or cascading table self-joins (`JOIN transfers t1 ON ... JOIN transfers t2 ...`).
            </p>
            <div className="bg-background/80 p-2 rounded border border-border/60 font-mono text-[10px] text-slate-300">
              {`WITH RECURSIVE CycleCTE AS (
  SELECT from_wallet, to_wallet, 1 AS depth
  FROM transfers WHERE from_wallet = 'A'
  UNION ALL
  SELECT c.from_wallet, t.to_wallet, c.depth + 1
  FROM CycleCTE c JOIN transfers t ON ...
  WHERE c.depth <= 5
)
-- ⚠️ Slow exponential join explosion`}
            </div>
          </div>

          {/* Graph / openCypher */}
          <div className="bg-surface-elevated/40 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <MaterialIcon name="check_circle" size={16} />
              <span>Graph Database (CognoDB / Cypher)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Index-free adjacency traverses direct pointers in $O(k)$ time without join overhead.
            </p>
            <div className="bg-background/80 p-2 rounded border border-border/60 font-mono text-[10px] text-emerald-300">
              {`// ⚡ Multi-hop Cycle Detection in 1 Line
MATCH path = (w:Wallet)-[:TRANSFERRED*2..5]->(w)
WHERE ALL(r IN relationships(path) 
      WHERE r.amount > 1000)
RETURN nodes(path) AS ring, length(path);`}
            </div>
          </div>
        </div>

        {/* 3 Winning Architectural Advantages */}
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            Key Graph Advantages
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-border/60 flex flex-col gap-1">
              <div className="flex items-center gap-1 text-cyan-400 font-medium">
                <MaterialIcon name="bolt" size={14} />
                <span>Index-Free Adjacency</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Nodes directly reference neighbor memory pointers rather than scanning relational index B-trees.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-border/60 flex flex-col gap-1">
              <div className="flex items-center gap-1 text-purple-400 font-medium">
                <MaterialIcon name="alt_route" size={14} />
                <span>Variable-Length Paths</span>
              </div>
              <p className="text-[10px] text-slate-400">
                `*2..6` hop matching discovers deep laundering peeling chains without fixed schema assumptions.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-border/60 flex flex-col gap-1">
              <div className="flex items-center gap-1 text-amber-400 font-medium">
                <MaterialIcon name="groups" size={14} />
                <span>Sybil Fan-Out Clustering</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Aggregating common funder ancestors and bipartite swap relationships with single Cypher statements.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border/80">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors shadow-md text-xs"
          >
            Got it, back to graph
          </button>
        </div>
      </div>
    </div>
  );
};
