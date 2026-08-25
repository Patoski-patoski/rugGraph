import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ScenarioSelector } from './components/ScenarioSelector';
import { FilterPanel } from './components/FilterPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeDrawer } from './components/NodeDrawer';
import { WhyGraphModal } from './components/WhyGraphModal';
import { SeedModal } from './components/SeedModal';
import {
  GraphData,
  GraphNode,
  ScenarioType,
  DatabaseHealth,
  GraphStats,
} from './types/graph';
import {
  fetchHealth,
  fetchStats,
  fetchOverview,
  fetchWashRings,
  fetchSybilClusters,
  fetchPeelingChains,
} from './services/api';

export const App: React.FC = () => {
  // Database & Analytics State
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [stats, setStats] = useState<GraphStats>({
    totalWallets: 0,
    totalTokens: 0,
    totalExchanges: 0,
    totalTransfers: 0,
    totalSwaps: 0,
    detectedWashRings: 0,
    detectedSybilFarms: 0,
  });

  // Graph Visualization State
  const [scenario, setScenario] = useState<ScenarioType>('ALL');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter State
  const [minHops, setMinHops] = useState<number>(2);
  const [maxHops, setMaxHops] = useState<number>(5);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isWhyGraphOpen, setIsWhyGraphOpen] = useState<boolean>(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState<boolean>(false);

  // Load Health & Stats periodically
  const refreshHealthAndStats = useCallback(async () => {
    const [h, s] = await Promise.all([fetchHealth(), fetchStats()]);
    setHealth(h);
    setStats(s);
  }, []);

  useEffect(() => {
    refreshHealthAndStats();
    const interval = setInterval(refreshHealthAndStats, 10000);
    return () => clearInterval(interval);
  }, [refreshHealthAndStats]);

  // Load Graph by Scenario
  const loadGraph = useCallback(async () => {
    setIsLoading(true);
    try {
      if (scenario === 'WASH_RING') {
        const rings = await fetchWashRings({ minHops, maxHops, minAmount });
        if (rings.length > 0) {
          const allNodes = new Map<string, GraphNode>();
          const allLinks = [];
          for (const r of rings) {
            for (const n of r.graph.nodes) allNodes.set(n.id, n);
            allLinks.push(...r.graph.links);
          }
          setGraphData({ nodes: Array.from(allNodes.values()), links: allLinks });
        } else {
          setGraphData({ nodes: [], links: [] });
        }
      } else if (scenario === 'SYBIL_FARM') {
        const clusters = await fetchSybilClusters({ minWallets: 3 });
        if (clusters.length > 0) {
          const allNodes = new Map<string, GraphNode>();
          const allLinks = [];
          for (const c of clusters) {
            for (const n of c.graph.nodes) allNodes.set(n.id, n);
            allLinks.push(...c.graph.links);
          }
          setGraphData({ nodes: Array.from(allNodes.values()), links: allLinks });
        } else {
          setGraphData({ nodes: [], links: [] });
        }
      } else if (scenario === 'PEELING_CHAIN') {
        const chains = await fetchPeelingChains({ minHops: Math.max(minHops, 3), minStartAmount: minAmount });
        if (chains.length > 0) {
          const allNodes = new Map<string, GraphNode>();
          const allLinks = [];
          for (const c of chains) {
            for (const n of c.graph.nodes) allNodes.set(n.id, n);
            allLinks.push(...c.graph.links);
          }
          setGraphData({ nodes: Array.from(allNodes.values()), links: allLinks });
        } else {
          setGraphData({ nodes: [], links: [] });
        }
      } else {
        // ALL (Full Network Overview)
        const overview = await fetchOverview({
          limitNodes: 200,
          filterFlaggedOnly,
        });
        setGraphData(overview);
      }
    } catch {
      // Fallback empty on error
      setGraphData({ nodes: [], links: [] });
    } finally {
      setIsLoading(false);
    }
  }, [scenario, minHops, maxHops, minAmount, filterFlaggedOnly]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const handleResetFilters = () => {
    setMinHops(2);
    setMaxHops(5);
    setMinAmount(0);
    setFilterFlaggedOnly(false);
    setSearchQuery('');
  };

  // Filtered Graph Data by Search Query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return graphData;
    const query = searchQuery.toLowerCase().trim();

    const matchedNodes = graphData.nodes.filter((n) => {
      const matchLabel = n.label.toLowerCase().includes(query);
      const matchAddress = n.address?.toLowerCase().includes(query) ?? false;
      const matchSymbol = n.symbol?.toLowerCase().includes(query) ?? false;
      const matchTag = n.clusterTag?.toLowerCase().includes(query) ?? false;
      return matchLabel || matchAddress || matchSymbol || matchTag;
    });

    const matchedNodeIds = new Set(matchedNodes.map((n) => n.id));
    const matchedLinks = graphData.links.filter((l) => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return matchedNodeIds.has(sourceId) && matchedNodeIds.has(targetId);
    });

    return {
      nodes: matchedNodes,
      links: matchedLinks,
    };
  }, [graphData, searchQuery]);

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        health={health}
        onOpenWhyGraph={() => setIsWhyGraphOpen(true)}
        onOpenSeedModal={() => setIsSeedModalOpen(true)}
        isLoading={isLoading}
      />

      {/* Main Forensic Dashboard */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Side: Controls & Scenario Switcher */}
        <div className="w-[420px] flex flex-col gap-4 overflow-y-auto pr-1 flex-shrink-0 z-10">
          <ScenarioSelector
            currentScenario={scenario}
            onSelectScenario={(s) => {
              setScenario(s);
              setSelectedNode(null);
            }}
            stats={{
              washRings: stats.detectedWashRings,
              sybilFarms: stats.detectedSybilFarms,
            }}
          />

          <FilterPanel
            minHops={minHops}
            setMinHops={setMinHops}
            maxHops={maxHops}
            setMaxHops={setMaxHops}
            minAmount={minAmount}
            setMinAmount={setMinAmount}
            filterFlaggedOnly={filterFlaggedOnly}
            setFilterFlaggedOnly={setFilterFlaggedOnly}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onApply={loadGraph}
            onReset={handleResetFilters}
            isCustomScenario={scenario !== 'ALL'}
          />

          {/* Quick Graph Stats Pill */}
          <div className="bg-surface/70 border border-border/70 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Rendered Graph:</span>
            <span className="font-mono text-cyan-400 font-semibold">
              {filteredData.nodes.length} Nodes / {filteredData.links.length} Edges
            </span>
          </div>
        </div>

        {/* Center: Graph Canvas Area */}
        <div className="flex-1 h-full relative">
          <GraphCanvas
            data={filteredData}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            hoverNode={hoverNode}
            setHoverNode={setHoverNode}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Slide-over Node Inspector */}
        {selectedNode && (
          <NodeDrawer
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {/* Modals */}
      <WhyGraphModal
        isOpen={isWhyGraphOpen}
        onClose={() => setIsWhyGraphOpen(false)}
      />

      <SeedModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onRefreshGraph={() => {
          refreshHealthAndStats();
          loadGraph();
        }}
      />
    </div>
  );
};
