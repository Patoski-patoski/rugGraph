export interface GraphNode {
  id: string;
  label: string;
  type: 'Wallet' | 'Token' | 'Exchange';
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
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'TRANSFERRED' | 'SWAPPED' | 'FUNDED';
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

export interface GraphStats {
  totalWallets: number;
  totalTokens: number;
  totalExchanges: number;
  totalTransfers: number;
  totalSwaps: number;
  detectedWashRings: number;
  detectedSybilFarms: number;
}
