import { GraphService } from './graph.service';
import { CognoDbService } from '../database/cognoDB.service';
import { InvalidPathRangeException } from '../common/exceptions/graph/invalid-path-range.exception';
import { NodeNotFoundException } from '../common/exceptions/graph/node-not-found.exception';

describe('GraphService', () => {
  let service: GraphService;
  let mockDb: {
    runQuery: jest.Mock;
    checkHealth: jest.Mock;
  };

  beforeEach(() => {
    mockDb = {
      runQuery: jest.fn(),
      checkHealth: jest.fn(),
    };

    service = new GraphService(mockDb as unknown as CognoDbService);
  });

  describe('detectWashRings', () => {
    it('should throw InvalidPathRangeException if minHops > maxHops', async () => {
      await expect(
        service.detectWashRings({ minHops: 5, maxHops: 2 }),
      ).rejects.toThrow(InvalidPathRangeException);
    });

    it('should detect wash rings and parse nodes/links correctly', async () => {
      mockDb.runQuery.mockResolvedValue([
        {
          originAddress: 'WashA111',
          hopCount: 2,
          rawNodes: [
            { address: 'WashA111', labels: ['Wallet'], label: 'Wash-Trader-A', riskScore: 90 },
            { address: 'WashB222', labels: ['Wallet'], label: 'Wash-Trader-B', riskScore: 90 },
          ],
          rawRels: [
            { type: 'TRANSFERRED', amount: 500, tokenSymbol: 'SOL', signature: 'sig1' },
            { type: 'TRANSFERRED', amount: 500, tokenSymbol: 'SOL', signature: 'sig2' },
          ],
          walletAddresses: ['WashA111', 'WashB222', 'WashA111'],
          totalVolume: 1000,
          tokenSymbol: 'SOL',
        },
      ]);

      const rings = await service.detectWashRings({ minHops: 2, maxHops: 4 });
      expect(rings).toHaveLength(1);
      expect(rings[0]?.totalVolume).toBe(1000);
      expect(rings[0]?.hopCount).toBe(2);
      expect(rings[0]?.graph.nodes).toHaveLength(2);
      expect(rings[0]?.graph.links).toHaveLength(2);
    });
  });

  describe('detectSybilClusters', () => {
    it('should return sybil clusters with bot addresses', async () => {
      mockDb.runQuery.mockResolvedValue([
        {
          funder: { address: 'Funder999', labels: ['Wallet'], label: 'Mastermind' },
          t: { symbol: 'MOON', labels: ['Token'], label: 'MOON' },
          sybilCount: 2,
          sybilList: [
            { address: 'Bot1', labels: ['Wallet'], label: 'Sybil-1' },
            { address: 'Bot2', labels: ['Wallet'], label: 'Sybil-2' },
          ],
          fundingRels: [{ amount: 10, target: 'Bot1' }, { amount: 10, target: 'Bot2' }],
          swapRels: [{ inputAmount: 9.5, source: 'Bot1' }, { inputAmount: 9.5, source: 'Bot2' }],
          totalFundedAmount: 20,
        },
      ]);

      const clusters = await service.detectSybilClusters({ minWallets: 2 });
      expect(clusters).toHaveLength(1);
      expect(clusters[0]?.sybilCount).toBe(2);
      expect(clusters[0]?.botAddresses).toEqual(['Bot1', 'Bot2']);
    });
  });

  describe('getNodeDetails', () => {
    it('should throw NodeNotFoundException when node does not exist', async () => {
      mockDb.runQuery.mockResolvedValueOnce([]); // no node found

      await expect(service.getNodeDetails('NonExistentAddress')).rejects.toThrow(
        NodeNotFoundException,
      );
    });

    it('should return node metrics, risk factors, and transactions', async () => {
      mockDb.runQuery
        .mockResolvedValueOnce([
          {
            n: {
              address: 'Wallet123',
              labels: ['Wallet'],
              clusterTag: 'Wash-Ring-01',
              isFlagged: true,
              riskScore: 92,
            },
          },
        ])
        .mockResolvedValueOnce([
          {
            incoming: [
              {
                rel: { type: 'TRANSFERRED', amount: 50 },
                neighbor: { address: 'Sender1', labels: ['Wallet'] },
              },
            ],
            outgoing: [],
          },
        ]);

      const details = await service.getNodeDetails('Wallet123');
      expect(details.node.address).toBe('Wallet123');
      expect(details.metrics.inDegree).toBe(1);
      expect(details.metrics.totalReceived).toBe(50);
      expect(details.metrics.riskFactors.length).toBeGreaterThan(0);
    });
  });
});
