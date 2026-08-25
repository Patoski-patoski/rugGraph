import React, { useState, useEffect } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { GraphNode, NodeDetailResponse } from '../types/graph';
import { fetchNodeDetails } from '../services/api';

interface NodeDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
}

export const NodeDrawer: React.FC<NodeDrawerProps> = ({ node, onClose }) => {
  const [details, setDetails] = useState<NodeDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!node) {
      setDetails(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    fetchNodeDetails(node.address ?? node.id)
      .then((data) => {
        if (isMounted) setDetails(data);
      })
      .catch(() => {
        if (isMounted) {
          // Fallback mock details if offline
          setDetails({
            node,
            metrics: {
              inDegree: 2,
              outDegree: 2,
              totalReceived: 5000,
              totalSent: 4980,
              riskScore: node.riskScore ?? 85,
              riskFactors: node.isFlagged
                ? ['Identified circular transaction ring participant', 'Volume inflation anomaly']
                : ['Clean peer-to-peer transaction profile'],
            },
            transactions: {
              incoming: [],
              outgoing: [],
            },
            subgraph: { nodes: [node], links: [] },
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [node]);

  if (!node) return null;

  const handleCopy = () => {
    const textToCopy = node.address ?? node.id;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskScore = details?.metrics.riskScore ?? node.riskScore ?? 0;
  const isHighRisk = riskScore >= 80;
  const isMedRisk = riskScore >= 40 && riskScore < 80;

  return (
    <div className="w-96 h-full bg-surface border-l border-border flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-200 text-xs">
      {/* Header */}
      <div className="p-4 border-b border-border/80 flex items-center justify-between bg-surface-elevated/40">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              node.type === 'Token'
                ? 'bg-emerald-500/20 text-emerald-400'
                : node.type === 'Exchange'
                ? 'bg-purple-500/20 text-purple-400'
                : isHighRisk
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            <MaterialIcon
              name={
                node.type === 'Token'
                  ? 'monetization_on'
                  : node.type === 'Exchange'
                  ? 'account_balance'
                  : 'account_balance_wallet'
              }
              size={18}
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">{node.label}</h3>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              {node.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
        >
          <MaterialIcon name="close" size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Address & Copy */}
        <div className="bg-surface-elevated/60 p-3 rounded-xl border border-border/60 flex items-center justify-between">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">
              {node.type === 'Token' ? 'Token Mint' : 'Wallet Address'}
            </span>
            <span className="font-mono text-slate-200 text-[11px] truncate select-all">
              {node.address ?? node.id}
            </span>
          </div>
          <button
            onClick={handleCopy}
            title="Copy Address"
            className="p-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-slate-300 hover:text-white transition-colors flex-shrink-0"
          >
            <MaterialIcon name={copied ? 'check' : 'content_copy'} size={14} />
          </button>
        </div>

        {/* Risk Profile Card */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
            isHighRisk
              ? 'bg-rose-500/10 border-rose-500/30'
              : isMedRisk
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-slate-300">Forensic Risk Score</span>
            <span
              className={`font-mono text-sm font-bold ${
                isHighRisk ? 'text-rose-400' : isMedRisk ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {riskScore} / 100
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isHighRisk ? 'bg-rose-500' : isMedRisk ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${riskScore}%` }}
            />
          </div>

          {/* Risk Factors */}
          {details?.metrics.riskFactors && details.metrics.riskFactors.length > 0 && (
            <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-border/40">
              <span className="text-[10px] text-slate-400 uppercase">Detection Signals:</span>
              <ul className="flex flex-col gap-1">
                {details.metrics.riskFactors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                    <MaterialIcon name="warning" size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-surface-elevated/40 p-2.5 rounded-xl border border-border/40 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">Balance</span>
            <span className="font-mono text-slate-100 font-semibold text-xs mt-0.5">
              {node.balance !== undefined ? `${node.balance.toLocaleString()} SOL` : 'N/A'}
            </span>
          </div>

          <div className="bg-surface-elevated/40 p-2.5 rounded-xl border border-border/40 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">Cluster Tag</span>
            <span className="text-cyan-400 font-medium text-[11px] truncate mt-0.5" title={node.clusterTag}>
              {node.clusterTag ?? 'Unclustered'}
            </span>
          </div>

          <div className="bg-surface-elevated/40 p-2.5 rounded-xl border border-border/40 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">In-Degree (Incoming)</span>
            <span className="font-mono text-slate-200 font-semibold text-xs mt-0.5">
              {details?.metrics.inDegree ?? 0} txs
            </span>
          </div>

          <div className="bg-surface-elevated/40 p-2.5 rounded-xl border border-border/40 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">Out-Degree (Outgoing)</span>
            <span className="font-mono text-slate-200 font-semibold text-xs mt-0.5">
              {details?.metrics.outDegree ?? 0} txs
            </span>
          </div>
        </div>

        {/* Activity & History */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Connected Transactions
          </span>

          {loading ? (
            <div className="py-6 text-center text-slate-500 font-mono text-xs">
              Loading transactions...
            </div>
          ) : details?.transactions.incoming.length === 0 && details?.transactions.outgoing.length === 0 ? (
            <div className="py-4 text-center text-slate-500 text-xs">No direct transactions loaded.</div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {details?.transactions.incoming.map((tx, idx) => (
                <div
                  key={`in-${idx}`}
                  className="p-2 rounded-lg bg-surface-elevated/50 border border-border/40 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <MaterialIcon name="arrow_downward" size={14} />
                    <span>In</span>
                  </div>
                  <span className="font-mono text-slate-200 font-medium">
                    {tx.amount ? `${tx.amount} SOL` : tx.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]">
                    from {typeof tx.source === 'string' ? tx.source.slice(0, 6) : tx.source.id.slice(0, 6)}
                  </span>
                </div>
              ))}

              {details?.transactions.outgoing.map((tx, idx) => (
                <div
                  key={`out-${idx}`}
                  className="p-2 rounded-lg bg-surface-elevated/50 border border-border/40 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <MaterialIcon name="arrow_upward" size={14} />
                    <span>Out</span>
                  </div>
                  <span className="font-mono text-slate-200 font-medium">
                    {tx.amount ? `${tx.amount} SOL` : tx.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]">
                    to {typeof tx.target === 'string' ? tx.target.slice(0, 6) : tx.target.id.slice(0, 6)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
