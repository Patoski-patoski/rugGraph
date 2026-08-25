import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { GraphData, GraphNode, GraphLink } from '../types/graph';
import { MaterialIcon } from './MaterialIcon';

interface GraphCanvasProps {
  data: GraphData;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
  hoverNode: GraphNode | null;
  setHoverNode: (node: GraphNode | null) => void;
  isLoading: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  data,
  selectedNode,
  onSelectNode,
  hoverNode,
  setHoverNode,
  isLoading,
}) => {
  const fgRef = useRef<ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-fit on data change
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 50);
      }, 500);
    }
  }, [data]);

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.3, 300);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.3, 300);
    }
  };

  const handleFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 40);
    }
  };

  const handleCenter = () => {
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 400);
    }
  };

  // Node Canvas Painter
  const paintNode = useCallback(
    (node: NodeObject<GraphNode>, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoverNode?.id === node.id;
      const isFlagged = node.isFlagged || (node.riskScore ?? 0) >= 80;

      // Radius by type
      let radius = 6;
      if (node.type === 'Token') radius = 8;
      if (node.type === 'Exchange') radius = 8;
      if (node.role?.includes('Mastermind') || node.role?.includes('Funder')) radius = 9;

      // Halo / Glow for Flagged & Selected Nodes
      if (isSelected || isHovered || isFlagged) {
        ctx.beginPath();
        ctx.arc(x, y, radius + (isSelected ? 5 : 3), 0, 2 * Math.PI, false);
        ctx.fillStyle = isSelected
          ? 'rgba(56, 189, 248, 0.4)'
          : isFlagged
          ? 'rgba(244, 63, 94, 0.3)'
          : 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      }

      // Base Node Color
      let nodeColor = '#38bdf8'; // Cyan for clean wallets
      if (node.type === 'Token') nodeColor = '#34d399'; // Emerald for Tokens
      else if (node.type === 'Exchange') nodeColor = '#a855f7'; // Purple for CEX
      else if (isFlagged) nodeColor = '#f43f5e'; // Rose for Flagged Wallets
      else if ((node.riskScore ?? 0) > 40) nodeColor = '#fbbf24'; // Amber for suspicious

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw Label Text
      const fontSize = Math.max(10 / globalScale, 3.5);
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const labelText = node.label || node.id.slice(0, 6);
      const textWidth = ctx.measureText(labelText).width;
      const labelY = y + radius + fontSize * 0.9;

      // Label background pill for readability
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(
        x - textWidth / 2 - 2,
        labelY - fontSize / 2 - 1,
        textWidth + 4,
        fontSize + 2,
      );

      ctx.fillStyle = isFlagged ? '#fca5a5' : '#e2e8f0';
      ctx.fillText(labelText, x, labelY);
    },
    [selectedNode, hoverNode],
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#090d16] rounded-2xl overflow-hidden border border-border flex items-center justify-center shadow-inner"
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Querying CognoDB Graph...</span>
        </div>
      ) : data.nodes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-slate-500 p-8 text-center">
          <MaterialIcon name="bubble_chart" size={48} className="text-slate-600" />
          <p className="text-sm font-medium text-slate-400">No nodes in the current query view</p>
          <p className="text-xs max-w-sm">
            Try adjusting your hop filters or click &quot;Seed / Reset Data&quot; to populate CognoDB with realistic forensic scenarios.
          </p>
        </div>
      ) : (
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          nodeId="id"
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as GraphNode;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, 12, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkDirectionalArrowLength={4.5}
          linkDirectionalArrowRelPos={0.9}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={2}
          linkColor={(link) => {
            const l = link as GraphLink;
            if (l.type === 'TRANSFERRED') return 'rgba(56, 189, 248, 0.45)'; // Cyan
            if (l.type === 'SWAPPED') return 'rgba(168, 85, 247, 0.45)'; // Purple
            if (l.type === 'FUNDED') return 'rgba(251, 191, 36, 0.55)'; // Amber
            return 'rgba(148, 163, 184, 0.3)';
          }}
          linkWidth={(link) => {
            const l = link as GraphLink;
            if ((l.amount ?? 0) > 1000) return 2.5;
            return 1.2;
          }}
          onNodeClick={(node) => onSelectNode(node as GraphNode)}
          onNodeHover={(node) => setHoverNode(node ? (node as GraphNode) : null)}
          onBackgroundClick={() => onSelectNode(null)}
          cooldownTicks={120}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          backgroundColor="#090d16"
        />
      )}

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-surface/90 backdrop-blur-md border border-border p-1 rounded-xl shadow-xl z-10">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-surface-elevated rounded-lg transition-colors"
        >
          <MaterialIcon name="zoom_in" size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-surface-elevated rounded-lg transition-colors"
        >
          <MaterialIcon name="zoom_out" size={18} />
        </button>
        <button
          onClick={handleFit}
          title="Fit to Screen"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-surface-elevated rounded-lg transition-colors"
        >
          <MaterialIcon name="fit_screen" size={18} />
        </button>
        <button
          onClick={handleCenter}
          title="Center Graph"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-surface-elevated rounded-lg transition-colors"
        >
          <MaterialIcon name="filter_center_focus" size={18} />
        </button>
      </div>

      {/* Canvas Legend */}
      <div className="absolute bottom-4 left-4 bg-surface/85 backdrop-blur-md border border-border/80 px-3 py-2 rounded-xl text-[10px] text-slate-300 flex items-center gap-4 shadow-lg pointer-events-none z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Flagged / Wash Trader</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Clean Wallet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Token Mint</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>CEX Deposit</span>
        </div>
      </div>
    </div>
  );
};
