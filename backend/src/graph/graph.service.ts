import { Injectable, Logger } from '@nestjs/common';
import { CognoDbService } from '../database/cognoDB.service';
import { InvalidPathRangeException } from '../common/exceptions/graph/invalid-path-range.exception';
import { NodeNotFoundException } from '../common/exceptions/graph/node-not-found.exception';
import type { FindCyclesQueryDto } from './dto/find-cycles.dto';
import type { FindSybilsQueryDto } from './dto/find-sybils.dto';
import type { FindPeelingChainsQueryDto } from './dto/find-peeling-chains.dto';
import type { GraphOverviewQueryDto } from './dto/graph-overview.dto';
import type {
  GraphData,
  GraphNode,
  GraphLink,
  WashRingResult,
  SybilClusterResult,
  PeelingChainResult,
  NodeDetailResponse,
  GraphStats,
} from './graph.types';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(private readonly db: CognoDbService) {}

  private parseNode(raw: Record<string, unknown>): GraphNode {
    const labels = Array.isArray(raw['labels']) ? (raw['labels'] as string[]) : [];
    const type = labels.includes('Token')
      ? 'Token'
      : labels.includes('Exchange')
      ? 'Exchange'
      : 'Wallet';

    const id = String(raw['address'] ?? raw['mint'] ?? raw['elementId'] ?? 'unknown');
    const label = String(
      raw['clusterTag'] ??
        raw['name'] ??
        raw['symbol'] ??
        raw['label'] ??
        (raw['address'] ? `${String(raw['address']).slice(0, 4)}...${String(raw['address']).slice(-4)}` : id),
    );

    return {
      id,
      label,
      type,
      name: typeof raw['name'] === 'string' ? raw['name'] : undefined,
      address: typeof raw['address'] === 'string' ? raw['address'] : undefined,
      symbol: typeof raw['symbol'] === 'string' ? raw['symbol'] : undefined,
      balance: typeof raw['balance'] === 'number' ? raw['balance'] : undefined,
      riskScore: typeof raw['riskScore'] === 'number' ? raw['riskScore'] : 0,
      isFlagged: Boolean(raw['isFlagged']),
      clusterTag: typeof raw['clusterTag'] === 'string' ? raw['clusterTag'] : undefined,
      role: typeof raw['role'] === 'string' ? raw['role'] : undefined,
      firstSeen: typeof raw['firstSeen'] === 'string' ? raw['firstSeen'] : undefined,
      lastSeen: typeof raw['lastSeen'] === 'string' ? raw['lastSeen'] : undefined,
    };
  }

  private parseLink(raw: Record<string, unknown>, sourceId?: string, targetId?: string): GraphLink {
    const type = (raw['type'] as 'TRANSFERRED' | 'SWAPPED' | 'FUNDED') ?? 'TRANSFERRED';
    const id = String(raw['signature'] ?? raw['elementId'] ?? `${sourceId}->${targetId}-${Date.now()}`);

    return {
      id,
      source: sourceId ?? String(raw['source'] ?? ''),
      target: targetId ?? String(raw['target'] ?? ''),
      type,
      amount: typeof raw['amount'] === 'number' ? raw['amount'] : undefined,
      tokenSymbol: typeof raw['tokenSymbol'] === 'string' ? raw['tokenSymbol'] : undefined,
      signature: typeof raw['signature'] === 'string' ? raw['signature'] : undefined,
      timestamp: typeof raw['timestamp'] === 'string' ? raw['timestamp'] : undefined,
      inputAmount: typeof raw['inputAmount'] === 'number' ? raw['inputAmount'] : undefined,
      outputAmount: typeof raw['outputAmount'] === 'number' ? raw['outputAmount'] : undefined,
      dex: typeof raw['dex'] === 'string' ? raw['dex'] : undefined,
    };
  }

  /**
   * 1. Wash-Trading Ring Detector (Multi-Hop Cycle Query)
   */
  async detectWashRings(query: FindCyclesQueryDto): Promise<WashRingResult[]> {
    const minHops = query.minHops ?? 2;
    const maxHops = query.maxHops ?? 5;
    const minAmount = query.minAmount ?? 0;
    const limit = query.limit ?? 20;

    if (minHops > maxHops) {
      throw new InvalidPathRangeException(minHops, maxHops);
    }

    const varHopsMin = Math.max(1, minHops - 1);
    const varHopsMax = Math.max(1, maxHops - 1);

    const cypher = `
      MATCH (start:Wallet)-[r0:TRANSFERRED]->(mid:Wallet)-[path:TRANSFERRED*${varHopsMin}..${varHopsMax}]->(start)
      WHERE ALL(r IN relationships(path) WHERE r.amount >= $minAmount) AND r0.amount >= $minAmount
      WITH start, r0, mid, path, nodes(path) AS pathNodes, relationships(path) AS pathRels, (length(path) + 1) AS hopCount
      RETURN 
        start.address AS originAddress,
        hopCount,
        [start, mid] + pathNodes[0..-1] AS rawNodes,
        [r0] + pathRels AS rawRels,
        [start.address, mid.address] + [n IN pathNodes[0..-1] | n.address] AS walletAddresses,
        (r0.amount + reduce(total = 0.0, r IN pathRels | total + r.amount)) AS totalVolume,
        r0.tokenSymbol AS tokenSymbol
      ORDER BY totalVolume DESC, hopCount ASC
      LIMIT $limit
    `;

    const records = await this.db.runQuery<{
      originAddress: string;
      hopCount: number;
      rawNodes: Array<Record<string, unknown>>;
      rawRels: Array<Record<string, unknown>>;
      walletAddresses: string[];
      totalVolume: number;
      tokenSymbol: string;
    }>(cypher, { minAmount, limit });

    const seenRings = new Set<string>();
    const results: WashRingResult[] = [];

    for (const record of records) {
      const distinctAddresses = Array.from(new Set(record.walletAddresses)).sort().join('::');
      if (seenRings.has(distinctAddresses)) {
        continue;
      }
      seenRings.add(distinctAddresses);

      const nodeMap = new Map<string, GraphNode>();
      for (const rawNode of record.rawNodes) {
        if (rawNode) {
          const node = this.parseNode(rawNode);
          nodeMap.set(node.id, node);
        }
      }

      const links: GraphLink[] = [];
      const rawNodes = record.rawNodes;
      for (let i = 0; i < record.rawRels.length; i++) {
        const rawRel = record.rawRels[i]!;
        const sourceNode = rawNodes[i];
        const targetNode = rawNodes[i + 1] ?? rawNodes[0];

        const sourceId = String(sourceNode?.['address'] ?? sourceNode?.['elementId']);
        const targetId = String(targetNode?.['address'] ?? targetNode?.['elementId']);

        links.push(this.parseLink(rawRel, sourceId, targetId));
      }

      results.push({
        ringId: `ring-${record.originAddress.slice(0, 6)}-${record.hopCount}hop`,
        hopCount: record.hopCount,
        totalVolume: Math.round(record.totalVolume * 100) / 100,
        tokenSymbol: record.tokenSymbol ?? 'SOL',
        originAddress: record.originAddress,
        wallets: Array.from(new Set(record.walletAddresses)),
        graph: {
          nodes: Array.from(nodeMap.values()),
          links,
        },
      });
    }

    this.logger.log({ event: 'WASH_RINGS_DETECTED', count: results.length });
    return results;
  }

  /**
   * 2. Sybil Farm & Cluster Detector
   */
  async detectSybilClusters(query: FindSybilsQueryDto): Promise<SybilClusterResult[]> {
    const minWallets = query.minWallets ?? 3;
    const targetSymbol = query.targetSymbol ?? null;
    const limit = query.limit ?? 20;

    const cypher = `
      MATCH (funder:Wallet)-[f:FUNDED]->(sybil:Wallet)-[s:SWAPPED]->(t:Token)
      WHERE ($targetSymbol IS NULL OR t.symbol = $targetSymbol)
      WITH funder, t, collect(DISTINCT sybil) AS sybilList, collect(DISTINCT f) AS fundingRels, collect(DISTINCT s) AS swapRels
      WHERE size(sybilList) >= $minWallets
      RETURN 
        funder,
        t,
        size(sybilList) AS sybilCount,
        sybilList,
        fundingRels,
        swapRels,
        reduce(total = 0.0, r IN fundingRels | total + r.amount) AS totalFundedAmount
      ORDER BY sybilCount DESC
      LIMIT $limit
    `;

    const records = await this.db.runQuery<{
      funder: Record<string, unknown>;
      t: Record<string, unknown>;
      sybilCount: number;
      sybilList: Array<Record<string, unknown>>;
      fundingRels: Array<Record<string, unknown>>;
      swapRels: Array<Record<string, unknown>>;
      totalFundedAmount: number;
    }>(cypher, { targetSymbol, minWallets, limit });

    const results: SybilClusterResult[] = [];

    for (const record of records) {
      const funderNode = this.parseNode(record.funder);
      const tokenNode = this.parseNode(record.t);

      const nodeMap = new Map<string, GraphNode>();
      nodeMap.set(funderNode.id, funderNode);
      nodeMap.set(tokenNode.id, tokenNode);

      const links: GraphLink[] = [];
      const botAddresses: string[] = [];

      for (const rawSybil of record.sybilList) {
        const botNode = this.parseNode(rawSybil);
        nodeMap.set(botNode.id, botNode);
        if (botNode.address) {
          botAddresses.push(botNode.address);
        }
      }

      for (let i = 0; i < record.fundingRels.length; i++) {
        const fRel = record.fundingRels[i]!;
        const targetAddress = botAddresses[i] ?? botAddresses[0];
        links.push(this.parseLink(fRel, funderNode.id, targetAddress));
      }

      for (let i = 0; i < record.swapRels.length; i++) {
        const sRel = record.swapRels[i]!;
        const sourceAddress = botAddresses[i] ?? botAddresses[0];
        links.push(this.parseLink(sRel, sourceAddress, tokenNode.id));
      }

      results.push({
        funderAddress: funderNode.address ?? funderNode.id,
        funderLabel: funderNode.label,
        targetSymbol: tokenNode.symbol ?? String(record.t['symbol'] ?? 'TOKEN'),
        sybilCount: record.sybilCount,
        totalFundedAmount: Math.round(record.totalFundedAmount * 100) / 100,
        botAddresses,
        graph: {
          nodes: Array.from(nodeMap.values()),
          links,
        },
      });
    }

    this.logger.log({ event: 'SYBIL_CLUSTERS_DETECTED', count: results.length });
    return results;
  }

  /**
   * 3. Peeling Chain Detector
   */
  async detectPeelingChains(query: FindPeelingChainsQueryDto): Promise<PeelingChainResult[]> {
    const minHops = query.minHops ?? 3;
    const minStartAmount = query.minStartAmount ?? 100;
    const limit = query.limit ?? 10;

    const varHopsMin = Math.max(1, minHops - 1);

    const cypher = `
      MATCH (origin:Wallet)-[r0:TRANSFERRED]->(h1:Wallet)-[path:TRANSFERRED*${varHopsMin}..5]->(dest:Exchange)
      WHERE r0.amount >= $minStartAmount
      WITH origin, r0, h1, path, dest, nodes(path) AS pathNodes, relationships(path) AS pathRels, (length(path) + 1) AS hopCount
      RETURN 
        origin.address AS originAddress,
        dest.address AS destinationAddress,
        dest.label AS destinationLabel,
        r0.amount AS startAmount,
        last(pathRels).amount AS finalAmount,
        hopCount,
        [origin, h1] + pathNodes AS rawNodes,
        [r0] + pathRels AS rawRels
      ORDER BY hopCount DESC, startAmount DESC
      LIMIT $limit
    `;

    const records = await this.db.runQuery<{
      originAddress: string;
      destinationAddress: string;
      destinationLabel: string;
      startAmount: number;
      finalAmount: number;
      hopCount: number;
      rawNodes: Array<Record<string, unknown>>;
      rawRels: Array<Record<string, unknown>>;
    }>(cypher, { minStartAmount, limit });

    const results: PeelingChainResult[] = [];
    const seenChains = new Set<string>();

    for (const record of records) {
      const key = `${record.originAddress}->${record.destinationAddress}`;
      if (seenChains.has(key)) {
        continue;
      }
      seenChains.add(key);

      const nodeMap = new Map<string, GraphNode>();
      for (const rawNode of record.rawNodes) {
        if (rawNode) {
          const node = this.parseNode(rawNode);
          nodeMap.set(node.id, node);
        }
      }

      const links: GraphLink[] = [];
      const rawNodes = record.rawNodes;
      for (let i = 0; i < record.rawRels.length; i++) {
        const rawRel = record.rawRels[i]!;
        const sourceNode = rawNodes[i];
        const targetNode = rawNodes[i + 1];

        const sourceId = String(sourceNode?.['address'] ?? sourceNode?.['elementId']);
        const targetId = String(targetNode?.['address'] ?? targetNode?.['elementId']);

        links.push(this.parseLink(rawRel, sourceId, targetId));
      }

      results.push({
        chainId: `peel-${record.originAddress.slice(0, 6)}->${record.destinationAddress.slice(0, 6)}`,
        hopCount: record.hopCount,
        startAmount: record.startAmount,
        finalAmount: record.finalAmount,
        originAddress: record.originAddress,
        destinationAddress: record.destinationAddress,
        destinationLabel: record.destinationLabel ?? 'CEX Deposit',
        graph: {
          nodes: Array.from(nodeMap.values()),
          links,
        },
      });
    }

    this.logger.log({ event: 'PEELING_CHAINS_DETECTED', count: results.length });
    return results;
  }

  /**
   * 4. Full Graph Overview
   */
  async getGraphOverview(query: GraphOverviewQueryDto): Promise<GraphData> {
    const limitNodes = query.limitNodes ?? 150;
    const filterFlaggedOnly = query.filterFlaggedOnly ?? false;
    const clusterId = query.clusterId ?? null;

    const cypher = `
      MATCH (n)
      WHERE ($filterFlaggedOnly = false OR n.isFlagged = true)
        AND ($clusterId IS NULL OR n.clusterTag CONTAINS $clusterId)
      WITH n LIMIT $limitNodes
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN 
        collect(DISTINCT n) AS nodes,
        collect(DISTINCT {
          rel: r,
          source: coalesce(n.address, n.mint, elementId(n)),
          target: coalesce(m.address, m.mint, elementId(m))
        }) AS rels
    `;

    const records = await this.db.runQuery<{
      nodes: Array<Record<string, unknown>>;
      rels: Array<{
        rel: Record<string, unknown> | null;
        source: string;
        target: string;
      }>;
    }>(cypher, { limitNodes, filterFlaggedOnly, clusterId });

    const rawNodes = records[0]?.nodes ?? [];
    const rawRels = records[0]?.rels ?? [];

    const nodeMap = new Map<string, GraphNode>();
    for (const raw of rawNodes) {
      const node = this.parseNode(raw);
      nodeMap.set(node.id, node);
    }

    const links: GraphLink[] = [];
    for (const item of rawRels) {
      if (!item.rel || !item.source || !item.target) {
        continue;
      }
      if (nodeMap.has(item.source) && nodeMap.has(item.target)) {
        links.push(this.parseLink(item.rel, item.source, item.target));
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      links,
    };
  }

  /**
   * 5. Node Inspector & Risk Profile
   */
  async getNodeDetails(address: string): Promise<NodeDetailResponse> {
    const nodeCypher = `
      MATCH (n)
      WHERE n.address = $address OR n.mint = $address
      RETURN n LIMIT 1
    `;

    const nodeRecords = await this.db.runQuery<{ n: Record<string, unknown> }>(nodeCypher, { address });
    const rawNode = nodeRecords[0]?.n;

    if (!rawNode) {
      throw new NodeNotFoundException('Node', address);
    }

    const node = this.parseNode(rawNode);

    const txCypher = `
      MATCH (target) WHERE target.address = $address OR target.mint = $address
      OPTIONAL MATCH (source)-[inRel]->(target)
      OPTIONAL MATCH (target)-[outRel]->(dest)
      RETURN 
        collect(DISTINCT { rel: inRel, neighbor: source }) AS incoming,
        collect(DISTINCT { rel: outRel, neighbor: dest }) AS outgoing
    `;

    const txRecords = await this.db.runQuery<{
      incoming: Array<{ rel: Record<string, unknown> | null; neighbor: Record<string, unknown> | null }>;
      outgoing: Array<{ rel: Record<string, unknown> | null; neighbor: Record<string, unknown> | null }>;
    }>(txCypher, { address });

    const inList = txRecords[0]?.incoming ?? [];
    const outList = txRecords[0]?.outgoing ?? [];

    const incomingLinks: GraphLink[] = [];
    const outgoingLinks: GraphLink[] = [];
    const subgraphNodes = new Map<string, GraphNode>();
    subgraphNodes.set(node.id, node);

    let totalReceived = 0;
    let totalSent = 0;

    for (const item of inList) {
      if (item.rel && item.neighbor) {
        const neighborNode = this.parseNode(item.neighbor);
        subgraphNodes.set(neighborNode.id, neighborNode);
        const link = this.parseLink(item.rel, neighborNode.id, node.id);
        incomingLinks.push(link);
        if (link.amount) {
          totalReceived += link.amount;
        }
      }
    }

    for (const item of outList) {
      if (item.rel && item.neighbor) {
        const neighborNode = this.parseNode(item.neighbor);
        subgraphNodes.set(neighborNode.id, neighborNode);
        const link = this.parseLink(item.rel, node.id, neighborNode.id);
        outgoingLinks.push(link);
        if (link.amount) {
          totalSent += link.amount;
        }
      }
    }

    const riskFactors: string[] = [];
    if (node.isFlagged) riskFactors.push('Flagged by automated heuristic detection');
    if (node.clusterTag?.includes('Wash')) riskFactors.push('Participant in circular wash-trading loop');
    if (node.clusterTag?.includes('Sybil')) riskFactors.push('Identified as automated sybil farm node');
    if (node.clusterTag?.includes('Peel')) riskFactors.push('Involved in rapid peeling-chain fund routing');
    if (incomingLinks.length > 5 && outgoingLinks.length <= 1) riskFactors.push('High fan-in consolidation pattern');

    return {
      node,
      metrics: {
        inDegree: incomingLinks.length,
        outDegree: outgoingLinks.length,
        totalReceived: Math.round(totalReceived * 100) / 100,
        totalSent: Math.round(totalSent * 100) / 100,
        riskScore: node.riskScore ?? (riskFactors.length > 0 ? 85 : 10),
        riskFactors,
      },
      transactions: {
        incoming: incomingLinks,
        outgoing: outgoingLinks,
      },
      subgraph: {
        nodes: Array.from(subgraphNodes.values()),
        links: [...incomingLinks, ...outgoingLinks],
      },
    };
  }

  /**
   * 6. Global Stats
   */
  async getStats(): Promise<GraphStats> {
    const statsCypher = `
      MATCH (w:Wallet) WITH count(w) AS totalWallets
      MATCH (t:Token) WITH totalWallets, count(t) AS totalTokens
      MATCH (e:Exchange) WITH totalWallets, totalTokens, count(e) AS totalExchanges
      MATCH ()-[r:TRANSFERRED]->() WITH totalWallets, totalTokens, totalExchanges, count(r) AS totalTransfers
      MATCH ()-[s:SWAPPED]->() WITH totalWallets, totalTokens, totalExchanges, totalTransfers, count(s) AS totalSwaps
      OPTIONAL MATCH (w1:Wallet { isFlagged: true }) WHERE w1.clusterTag CONTAINS 'Wash'
      WITH totalWallets, totalTokens, totalExchanges, totalTransfers, totalSwaps, count(DISTINCT w1) AS flaggedWash
      OPTIONAL MATCH (w2:Wallet { isFlagged: true }) WHERE w2.clusterTag CONTAINS 'Sybil'
      RETURN 
        totalWallets,
        totalTokens,
        totalExchanges,
        totalTransfers,
        totalSwaps,
        flaggedWash,
        count(DISTINCT w2) AS flaggedSybil
    `;

    const records = await this.db.runQuery<{
      totalWallets: number;
      totalTokens: number;
      totalExchanges: number;
      totalTransfers: number;
      totalSwaps: number;
      flaggedWash: number;
      flaggedSybil: number;
    }>(statsCypher);

    const row = records[0];
    return {
      totalWallets: row?.totalWallets ?? 0,
      totalTokens: row?.totalTokens ?? 0,
      totalExchanges: row?.totalExchanges ?? 0,
      totalTransfers: row?.totalTransfers ?? 0,
      totalSwaps: row?.totalSwaps ?? 0,
      detectedWashRings: row?.flaggedWash ?? 0,
      detectedSybilFarms: row?.flaggedSybil ?? 0,
    };
  }
}
