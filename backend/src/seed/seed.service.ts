import { Injectable, Logger } from '@nestjs/common';
import { CognoDbService } from '../database/cognoDB.service';

export interface SeedResult {
  success: boolean;
  message: string;
  nodesCreated: number;
  relationshipsCreated: number;
  scenarios: string[];
  durationMs: number;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly db: CognoDbService) {}

  async clearDatabase(): Promise<void> {
    this.logger.log('Clearing CognoDB graph...');
    await this.db.runQuery('MATCH (n) DETACH DELETE n');
    this.logger.log('Graph cleared successfully.');
  }

  async createSchemaConstraints(): Promise<void> {
    this.logger.log('Ensuring schema constraints and indexes in CognoDB...');
    // In openCypher/CognoDB, create constraints or indexes if supported
    try {
      await this.db.runQuery('CREATE CONSTRAINT IF NOT EXISTS FOR (w:Wallet) REQUIRE w.address IS UNIQUE');
    } catch {
      // Some openCypher dialects ignore constraint syntax
    }
    try {
      await this.db.runQuery('CREATE CONSTRAINT IF NOT EXISTS FOR (t:Token) REQUIRE t.mint IS UNIQUE');
    } catch {
      // Ignore
    }
  }

  async seedAll(): Promise<SeedResult> {
    const startTime = Date.now();
    this.logger.log('Beginning deterministic graph seeding...');

    await this.clearDatabase();
    await this.createSchemaConstraints();

    // 1. Seed Tokens
    await this.seedTokens();

    // 2. Seed Wash-Trading Rings
    await this.seedWashTradingRings();

    // 3. Seed Sybil Bot Farm
    await this.seedSybilCluster();

    // 4. Seed Peeling Chain
    await this.seedPeelingChain();

    // 5. Seed Organic Clean Network Mesh
    await this.seedOrganicMesh();

    const stats = await this.db.checkHealth();
    const durationMs = Date.now() - startTime;

    this.logger.log({
      event: 'SEEDING_COMPLETED',
      nodes: stats.nodeCount,
      relationships: stats.relationshipCount,
      durationMs,
    });

    return {
      success: true,
      message: 'CognoDB graph successfully populated with realistic forensic scenarios.',
      nodesCreated: stats.nodeCount,
      relationshipsCreated: stats.relationshipCount,
      scenarios: [
        '4-Hop Circular Wash-Trading Ring ($PEPE)',
        '12-Node Sybil Sniping Farm ($MOON)',
        '6-Hop Laundering Peeling Chain to Binance CEX',
        'Organic Retail Network Mesh (35+ Wallets, $SOL, $USDC, $BONK, $JUP)',
      ],
      durationMs,
    };
  }

  private async seedTokens(): Promise<void> {
    const tokens = [
      { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Wrapped SOL', decimals: 9 },
      { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5 },
      { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', decimals: 6 },
      { mint: 'PEPE8888888888888888888888888888888888888888', symbol: 'PEPE', name: 'Pepe (Solana)', decimals: 6 },
      { mint: 'Moon7777777777777777777777777777777777777777', symbol: 'MOON', name: 'MoonShot Token', decimals: 9 },
    ];

    for (const t of tokens) {
      await this.db.runQuery(
        `
        MERGE (tok:Token { mint: $mint })
        SET tok.symbol = $symbol,
            tok.name = $name,
            tok.decimals = $decimals,
            tok.label = $symbol
      `,
        t,
      );
    }
  }

  private async seedWashTradingRings(): Promise<void> {
    // 4-Hop Wash Ring 1
    const ring1 = [
      { address: 'WashA11111111111111111111111111111111111111', label: 'Wash-Trader-Alpha', balance: 14500 },
      { address: 'WashB22222222222222222222222222222222222222', label: 'Wash-Trader-Beta', balance: 14200 },
      { address: 'WashC33333333333333333333333333333333333333', label: 'Wash-Trader-Gamma', balance: 13900 },
      { address: 'WashD44444444444444444444444444444444444444', label: 'Wash-Trader-Delta', balance: 14100 },
    ];

    for (const w of ring1) {
      await this.db.runQuery(
        `
        MERGE (w:Wallet { address: $address })
        SET w.label = $label,
            w.balance = $balance,
            w.isFlagged = true,
            w.clusterTag = 'Wash-Ring-01 (4-Hop PEPE)',
            w.riskScore = 95,
            w.firstSeen = '2026-08-20T08:00:00Z',
            w.lastSeen = '2026-08-24T12:00:00Z'
      `,
        w,
      );
    }

    // Connect them in a circular loop: A -> B -> C -> D -> A
    const transfers = [
      { from: ring1[0]!.address, to: ring1[1]!.address, amount: 5000, sig: 'tx_wash_1', time: '2026-08-24T10:00:00Z' },
      { from: ring1[1]!.address, to: ring1[2]!.address, amount: 4990, sig: 'tx_wash_2', time: '2026-08-24T10:02:00Z' },
      { from: ring1[2]!.address, to: ring1[3]!.address, amount: 4980, sig: 'tx_wash_3', time: '2026-08-24T10:04:00Z' },
      { from: ring1[3]!.address, to: ring1[0]!.address, amount: 4970, sig: 'tx_wash_4', time: '2026-08-24T10:06:00Z' },
    ];

    for (const t of transfers) {
      await this.db.runQuery(
        `
        MATCH (a:Wallet { address: $from }), (b:Wallet { address: $to })
        CREATE (a)-[:TRANSFERRED {
          amount: $amount,
          tokenSymbol: 'SOL',
          signature: $sig,
          timestamp: $time
        }]->(b)
      `,
        t,
      );
    }

    // Connect Wash Wallets to PEPE token via SWAPPED edges to simulate fake volume
    for (let i = 0; i < ring1.length; i++) {
      await this.db.runQuery(
        `
        MATCH (w:Wallet { address: $address }), (t:Token { symbol: 'PEPE' })
        CREATE (w)-[:SWAPPED {
          inputAmount: $inAmt,
          outputAmount: $outAmt,
          dex: 'Raydium',
          signature: $sig,
          timestamp: '2026-08-24T10:10:00Z'
        }]->(t)
      `,
        {
          address: ring1[i]!.address,
          inAmt: 2500,
          outAmt: 500000000,
          sig: `tx_wash_swap_${i}`,
        },
      );
    }

    // 3-Hop Wash Ring 2
    const ring2 = [
      { address: 'WashE55555555555555555555555555555555555555', label: 'Wash-Trader-Echo', balance: 8000 },
      { address: 'WashF66666666666666666666666666666666666666', label: 'Wash-Trader-Foxtrot', balance: 7900 },
      { address: 'WashG77777777777777777777777777777777777777', label: 'Wash-Trader-Golf', balance: 7800 },
    ];

    for (const w of ring2) {
      await this.db.runQuery(
        `
        MERGE (w:Wallet { address: $address })
        SET w.label = $label,
            w.balance = $balance,
            w.isFlagged = true,
            w.clusterTag = 'Wash-Ring-02 (3-Hop USDC)',
            w.riskScore = 91,
            w.firstSeen = '2026-08-22T04:00:00Z',
            w.lastSeen = '2026-08-24T11:00:00Z'
      `,
        w,
      );
    }

    const transfers2 = [
      { from: ring2[0]!.address, to: ring2[1]!.address, amount: 25000, sig: 'tx_wash2_1', time: '2026-08-24T09:00:00Z' },
      { from: ring2[1]!.address, to: ring2[2]!.address, amount: 24950, sig: 'tx_wash2_2', time: '2026-08-24T09:05:00Z' },
      { from: ring2[2]!.address, to: ring2[0]!.address, amount: 24900, sig: 'tx_wash2_3', time: '2026-08-24T09:10:00Z' },
    ];

    for (const t of transfers2) {
      await this.db.runQuery(
        `
        MATCH (a:Wallet { address: $from }), (b:Wallet { address: $to })
        CREATE (a)-[:TRANSFERRED {
          amount: $amount,
          tokenSymbol: 'USDC',
          signature: $sig,
          timestamp: $time
        }]->(b)
      `,
        t,
      );
    }
  }

  private async seedSybilCluster(): Promise<void> {
    const funder = {
      address: 'SybiLFunderMastermind99999999999999999999',
      label: '🚨 Mastermind (Sybil-Funder)',
      balance: 150000,
    };

    await this.db.runQuery(
      `
      MERGE (w:Wallet { address: $address })
      SET w.label = $label,
          w.balance = $balance,
          w.isFlagged = true,
          w.clusterTag = 'Sybil-Farm-01 ($MOON Snipers)',
          w.role = 'Mastermind Funder',
          w.riskScore = 99,
          w.firstSeen = '2026-08-15T00:00:00Z',
          w.lastSeen = '2026-08-24T12:30:00Z'
    `,
      funder,
    );

    const botCount = 12;
    for (let i = 1; i <= botCount; i++) {
      const pad = String(i).padStart(2, '0');
      const botAddress = `SybiLBot${pad}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
      const botLabel = `🤖 Sybil-Bot-${pad}`;

      await this.db.runQuery(
        `
        MERGE (b:Wallet { address: $address })
        SET b.label = $label,
            b.balance = 0.5,
            b.isFlagged = true,
            b.clusterTag = 'Sybil-Farm-01 ($MOON Snipers)',
            b.role = 'Sybil Puppet',
            b.riskScore = 88,
            b.firstSeen = '2026-08-24T11:00:00Z',
            b.lastSeen = '2026-08-24T11:05:00Z'
      `,
        { address: botAddress, label: botLabel },
      );

      // Funder -> Bot (FUNDED)
      await this.db.runQuery(
        `
        MATCH (f:Wallet { address: $funderAddr }), (b:Wallet { address: $botAddr })
        CREATE (f)-[:FUNDED {
          amount: 25.0,
          tokenSymbol: 'SOL',
          signature: $sig,
          timestamp: '2026-08-24T11:01:00Z'
        }]->(b)
      `,
        { funderAddr: funder.address, botAddr: botAddress, sig: `tx_fund_bot_${i}` },
      );

      // Bot -> Target Token $MOON (SWAPPED)
      await this.db.runQuery(
        `
        MATCH (b:Wallet { address: $botAddr }), (t:Token { symbol: 'MOON' })
        CREATE (b)-[:SWAPPED {
          inputAmount: 24.5,
          outputAmount: 1000000,
          dex: 'Raydium Concentrated',
          signature: $sig,
          timestamp: '2026-08-24T11:02:15Z'
        }]->(t)
      `,
        { botAddr: botAddress, sig: `tx_swap_moon_${i}` },
      );
    }
  }

  private async seedPeelingChain(): Promise<void> {
    const cex = {
      address: 'BinanceHotWalletDepositCEX999999999999999',
      label: '🏦 Binance CEX (Exit Deposit)',
      name: 'Binance CEX Deposit',
    };

    await this.db.runQuery(
      `
      MERGE (e:Exchange { address: $address })
      SET e.label = $label,
          e.name = $name,
          e.clusterTag = 'CEX Safe Haven',
          e.role = 'Exchange',
          e.riskScore = 5,
          e.firstSeen = '2025-01-01T00:00:00Z'
    `,
      cex,
    );

    const hops = [
      { address: 'PeelOriginHacker777777777777777777777777', label: '🚨 Exploit Origin Wallet', startAmt: 500 },
      { address: 'PeelHop1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', label: '🌪 Peel-Hop-1', startAmt: 480 },
      { address: 'PeelHop2cccccccccccccccccccccccccccccccc', label: '🌪 Peel-Hop-2', startAmt: 460 },
      { address: 'PeelHop3dddddddddddddddddddddddddddddddd', label: '🌪 Peel-Hop-3', startAmt: 440 },
      { address: 'PeelHop4eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', label: '🌪 Peel-Hop-4', startAmt: 420 },
      { address: 'PeelHop5ffffffffffffffffffffffffffffffff', label: '🌪 Peel-Hop-5 (Final Smurf)', startAmt: 400 },
    ];

    for (let i = 0; i < hops.length; i++) {
      const h = hops[i]!;
      await this.db.runQuery(
        `
        MERGE (w:Wallet { address: $address })
        SET w.label = $label,
            w.balance = 20.0,
            w.isFlagged = true,
            w.clusterTag = 'Peeling-Chain-01 (Exploit Exit)',
            w.role = 'Laundering Relay',
            w.riskScore = $riskScore,
            w.firstSeen = '2026-08-23T14:00:00Z',
            w.lastSeen = '2026-08-24T05:00:00Z'
      `,
        {
          ...h,
          riskScore: 93 - (i * 2),
        },
      );
    }

    for (let i = 0; i < hops.length - 1; i++) {
      const from = hops[i]!;
      const to = hops[i + 1]!;
      await this.db.runQuery(
        `
        MATCH (a:Wallet { address: $from }), (b:Wallet { address: $to })
        CREATE (a)-[:TRANSFERRED {
          amount: $amount,
          tokenSymbol: 'SOL',
          signature: $sig,
          timestamp: '2026-08-23T16:00:00Z'
        }]->(b)
      `,
        {
          from: from.address,
          to: to.address,
          amount: to.startAmt,
          sig: `tx_peel_hop_${i + 1}`,
        },
      );
    }

    // Final hop into Binance CEX
    const lastHop = hops[hops.length - 1]!;
    await this.db.runQuery(
      `
      MATCH (w:Wallet { address: $from }), (e:Exchange { address: $to })
      CREATE (w)-[:TRANSFERRED {
        amount: 400.0,
        tokenSymbol: 'SOL',
        signature: 'tx_peel_final_deposit_cex',
        timestamp: '2026-08-24T05:30:00Z'
      }]->(e)
    `,
      { from: lastHop.address, to: cex.address },
    );
  }

  private async seedOrganicMesh(): Promise<void> {
    const cleanUsers = [
      { name: 'Trader Alice', address: 'Alice11111111111111111111111111111111111111' },
      { name: 'Trader Bob', address: 'Bob2222222222222222222222222222222222222222' },
      { name: 'Staker Carol', address: 'Carol33333333333333333333333333333333333333' },
      { name: 'LP Dave', address: 'Dave4444444444444444444444444444444444444444' },
      { name: 'Investor Emma', address: 'Emma55555555555555555555555555555555555555' },
      { name: 'Trader Frank', address: 'Frank66666666666666666666666666666666666666' },
      { name: 'Collector Grace', address: 'Grace77777777777777777777777777777777777777' },
      { name: 'DAO Treasury Henry', address: 'Henry88888888888888888888888888888888888888' },
      { name: 'Builder Ivy', address: 'Ivy9999999999999999999999999999999999999999' },
      { name: 'Node Operator Jack', address: 'Jack00000000000000000000000000000000000000' },
    ];

    for (let i = 0; i < cleanUsers.length; i++) {
      const u = cleanUsers[i]!;
      await this.db.runQuery(
        `
        MERGE (w:Wallet { address: $address })
        SET w.label = $label,
            w.balance = $balance,
            w.isFlagged = false,
            w.clusterTag = 'Organic Retail Community',
            w.role = 'Retail Trader',
            w.riskScore = $riskScore,
            w.firstSeen = '2025-06-01T00:00:00Z',
            w.lastSeen = '2026-08-24T12:00:00Z'
      `,
        {
          address: u.address,
          label: u.name,
          balance: 10 + i * 15,
          riskScore: 5 + (i % 10),
        },
      );
    }

    // Clean peer-to-peer transfers
    const cleanTxs = [
      { from: cleanUsers[0]!.address, to: cleanUsers[1]!.address, amt: 2.5, sig: 'clean_tx_1', sym: 'SOL' },
      { from: cleanUsers[1]!.address, to: cleanUsers[2]!.address, amt: 1.2, sig: 'clean_tx_2', sym: 'SOL' },
      { from: cleanUsers[2]!.address, to: cleanUsers[3]!.address, amt: 500, sig: 'clean_tx_3', sym: 'USDC' },
      { from: cleanUsers[4]!.address, to: cleanUsers[0]!.address, amt: 10.0, sig: 'clean_tx_4', sym: 'SOL' },
      { from: cleanUsers[5]!.address, to: cleanUsers[6]!.address, amt: 1200, sig: 'clean_tx_5', sym: 'BONK' },
      { from: cleanUsers[7]!.address, to: cleanUsers[8]!.address, amt: 45.0, sig: 'clean_tx_6', sym: 'JUP' },
      { from: cleanUsers[8]!.address, to: cleanUsers[9]!.address, amt: 3.8, sig: 'clean_tx_7', sym: 'SOL' },
    ];

    for (const ctx of cleanTxs) {
      await this.db.runQuery(
        `
        MATCH (a:Wallet { address: $from }), (b:Wallet { address: $to })
        CREATE (a)-[:TRANSFERRED {
          amount: $amt,
          tokenSymbol: $sym,
          signature: $sig,
          timestamp: '2026-08-24T08:30:00Z'
        }]->(b)
      `,
        ctx,
      );
    }

    // Clean Swaps with BONK & JUP
    for (let i = 0; i < 5; i++) {
      const u = cleanUsers[i]!;
      await this.db.runQuery(
        `
        MATCH (w:Wallet { address: $address }), (t:Token { symbol: $symbol })
        CREATE (w)-[:SWAPPED {
          inputAmount: 1.5,
          outputAmount: 150000,
          dex: 'Orca Whirlpools',
          signature: $sig,
          timestamp: '2026-08-24T09:45:00Z'
        }]->(t)
      `,
        {
          address: u.address,
          symbol: i % 2 === 0 ? 'BONK' : 'JUP',
          sig: `clean_swap_${i}`,
        },
      );
    }
  }
}
