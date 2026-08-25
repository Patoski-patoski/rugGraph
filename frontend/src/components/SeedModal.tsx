import React, { useState } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { triggerSeed, triggerReset } from '../services/api';

interface SeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshGraph: () => void;
}

export const SeedModal: React.FC<SeedModalProps> = ({
  isOpen,
  onClose,
  onRefreshGraph,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  if (!isOpen) return null;

  const handleSeed = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await triggerSeed();
      setStatusType('success');
      setStatusMessage(
        `🎉 Successfully populated CognoDB with ${res.nodesCreated} nodes and ${res.relationshipsCreated} relationships across 4 forensic scenarios!`,
      );
      onRefreshGraph();
    } catch (error) {
      setStatusType('error');
      setStatusMessage(
        `Failed to seed database: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify CognoDB credentials in backend .env.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to completely wipe all graph nodes and relationships in CognoDB?')) {
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      await triggerReset();
      setStatusType('success');
      setStatusMessage('🧹 CognoDB graph has been completely cleared.');
      onRefreshGraph();
    } catch (error) {
      setStatusType('error');
      setStatusMessage(
        `Failed to reset database: ${error instanceof Error ? error.message : 'Unknown error'}.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-lg w-full shadow-2xl p-6 flex flex-col gap-4 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <MaterialIcon name="database" size={20} filled />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Graph Data Management
              </h2>
              <span className="text-[11px] text-slate-400">CognoDB Cloud Instance Controller</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-400 leading-relaxed">
          Populate your CognoDB Cloud database with a deterministic synthetic on-chain graph containing labeled wash-trading rings, sybil farming trees, laundering peeling chains, and clean retail background mesh.
        </p>

        {/* Included Datasets List */}
        <div className="bg-surface-elevated/50 p-3 rounded-xl border border-border/60 flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-slate-200">
            Forensic Scenarios in Seed Script:
          </span>
          <ul className="flex flex-col gap-1.5 text-[11px] text-slate-300">
            <li className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>
                <strong>4-Hop Wash Ring:</strong> Circular 5,000 SOL loop inflating $PEPE token
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>
                <strong>12-Node Sybil Farm:</strong> 1 Mastermind funder dispersing SOL to 12 $MOON snipers
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>
                <strong>Peeling Chain:</strong> 500 SOL chopped down sequentially to Binance CEX
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                <strong>Organic Mesh:</strong> 35+ retail traders transacting normally ($SOL, $USDC, $BONK, $JUP)
              </span>
            </li>
          </ul>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2 ${
              statusType === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <MaterialIcon
              name={statusType === 'success' ? 'check_circle' : 'error'}
              size={18}
              className="flex-shrink-0 mt-0.5"
            />
            <span className="leading-relaxed">{statusMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-border/80">
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50"
          >
            <MaterialIcon name="delete_forever" size={16} />
            <span>Wipe Database</span>
          </button>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 text-cyan-950 font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-cyan-950 border-t-transparent rounded-full animate-spin" />
                <span>Seeding Graph...</span>
              </>
            ) : (
              <>
                <MaterialIcon name="bolt" size={18} filled />
                <span>Seed All Scenarios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
