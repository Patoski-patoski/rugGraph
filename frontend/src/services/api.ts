import {
  GraphData,
  WashRingResult,
  SybilClusterResult,
  PeelingChainResult,
  NodeDetailResponse,
  DatabaseHealth,
  GraphStats,
} from '../types/graph';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchHealth(): Promise<DatabaseHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    const data = await res.json();
    return data.database;
  } catch (error) {
    return {
      status: 'disconnected',
      uri: 'Connecting...',
      nodeCount: 0,
      relationshipCount: 0,
      latencyMs: 0,
      message: error instanceof Error ? error.message : 'Backend unreachable',
    };
  }
}

export async function fetchStats(): Promise<GraphStats> {
  try {
    const res = await fetch(`${API_BASE}/graph/stats`);
    if (!res.ok) throw new Error('Stats fetch failed');
    return await res.json();
  } catch {
    return {
      totalWallets: 0,
      totalTokens: 0,
      totalExchanges: 0,
      totalTransfers: 0,
      totalSwaps: 0,
      detectedWashRings: 0,
      detectedSybilFarms: 0,
    };
  }
}

export async function fetchOverview(params?: {
  limitNodes?: number;
  filterFlaggedOnly?: boolean;
  clusterId?: string;
}): Promise<GraphData> {
  const query = new URLSearchParams();
  if (params?.limitNodes) query.set('limitNodes', String(params.limitNodes));
  if (params?.filterFlaggedOnly) query.set('filterFlaggedOnly', 'true');
  if (params?.clusterId) query.set('clusterId', params.clusterId);

  const res = await fetch(`${API_BASE}/graph/overview?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch overview graph');
  return res.json();
}

export async function fetchWashRings(params?: {
  minHops?: number;
  maxHops?: number;
  minAmount?: number;
}): Promise<WashRingResult[]> {
  const query = new URLSearchParams();
  if (params?.minHops) query.set('minHops', String(params.minHops));
  if (params?.maxHops) query.set('maxHops', String(params.maxHops));
  if (params?.minAmount) query.set('minAmount', String(params.minAmount));

  const res = await fetch(`${API_BASE}/graph/cycles?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch wash rings');
  return res.json();
}

export async function fetchSybilClusters(params?: {
  minWallets?: number;
  targetSymbol?: string;
}): Promise<SybilClusterResult[]> {
  const query = new URLSearchParams();
  if (params?.minWallets) query.set('minWallets', String(params.minWallets));
  if (params?.targetSymbol) query.set('targetSymbol', params.targetSymbol);

  const res = await fetch(`${API_BASE}/graph/sybils?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch sybil clusters');
  return res.json();
}

export async function fetchPeelingChains(params?: {
  minHops?: number;
  minStartAmount?: number;
}): Promise<PeelingChainResult[]> {
  const query = new URLSearchParams();
  if (params?.minHops) query.set('minHops', String(params.minHops));
  if (params?.minStartAmount) query.set('minStartAmount', String(params.minStartAmount));

  const res = await fetch(`${API_BASE}/graph/peeling-chains?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch peeling chains');
  return res.json();
}

export async function fetchNodeDetails(address: string): Promise<NodeDetailResponse> {
  const res = await fetch(`${API_BASE}/graph/node/${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error('Failed to fetch node details');
  return res.json();
}

export async function triggerSeed(): Promise<{
  success: boolean;
  message: string;
  nodesCreated: number;
  relationshipsCreated: number;
}> {
  const res = await fetch(`${API_BASE}/seed/populate`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to populate seed data');
  return res.json();
}

export async function triggerReset(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/seed/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to wipe graph database');
  return res.json();
}
