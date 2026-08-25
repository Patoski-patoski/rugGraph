export type NodeType = 'Wallet' | 'Token' | 'Exchange';
export type LinkType = 'TRANSFERRED' | 'SWAPPED' | 'FUNDED';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  name?: string | undefined;
  address?: string | undefined;
  symbol?: string | undefined;
  balance?: number | undefined;
  riskScore?: number | undefined;
  isFlagged?: boolean | undefined;
  clusterTag?: string | undefined;
  role?: string | undefined;
  firstSeen?: string | undefined;
  lastSeen?: string | undefined;
  // D3 force simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: LinkType;
  amount?: number | undefined;
  tokenSymbol?: string | undefined;
  signature?: string | undefined;
  timestamp?: string | undefined;
  inputAmount?: number | undefined;
  outputAmount?: number | undefined;
  dex?: string | undefined;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface WashRingResult {
  ringId: string;
  hopCount: number;
  totalVolume: number;
  tokenSymbol: string;
  originAddress: string;
  wallets: string[];
  graph: GraphData;
}

export interface SybilClusterResult {
  funderAddress: string;
  funderLabel: string;
  targetSymbol: string;
  sybilCount: number;
  totalFundedAmount: number;
  botAddresses: string[];
  graph: GraphData;
}

export interface PeelingChainResult {
  chainId: string;
  hopCount: number;
  startAmount: number;
  finalAmount: number;
  originAddress: string;
  destinationAddress: string;
  destinationLabel: string;
  graph: GraphData;
}

export interface NodeDetailResponse {
  node: GraphNode;
  metrics: {
    inDegree: number;
    outDegree: number;
    totalReceived: number;
    totalSent: number;
    riskScore: number;
    riskFactors: string[];
  };
  transactions: {
    incoming: GraphLink[];
    outgoing: GraphLink[];
  };
  subgraph: GraphData;
}

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'disconnected';
  uri: string;
  nodeCount: number;
  relationshipCount: number;
  latencyMs: number;
  message?: string | undefined;
}

export interface GraphStats {
  totalWallets: number;
  totalTokens: number;
  totalExchanges: number;
  totalTransfers: number;
  totalSwaps: number;
  detectedWashRings: number;
  detectedSybilFarms: number;
}

export type ScenarioType = 'ALL' | 'WASH_RING' | 'SYBIL_FARM' | 'PEELING_CHAIN';
