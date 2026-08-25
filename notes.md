# Wash Trading

> **A plain-English guide to understanding Wash Trading, Sybil Bot Farms, Peeling Chains, and On-Chain Forensics terminology.**

Wash trading is a form of market manipulation where an entity simultaneously buys and sells the same asset to create the illusion of high trading volume and activity.

In crypto, it works like this:

1. Alice sends 100 SOL of $PEPE to Bob
2. Bob sends the same 100 SOL of $PEPE back to Alice
3. Repeat across multiple wallets in a loop
The net transfer is zero — no real economic activity happened. But on-chain, it looks like there's heavy demand and volume for the token, tricking other traders into thinking it's popular.

**The Significance of Wash Trading**

- Creates false market activity
- Inflates fake volume to attract real buyers
- Artificially pumps token price
- Often used before a rug pull — once real buyers enter, the manipulators dump

## How RugGraph detects it

Your app looks for circular transaction cycles (e.g. 4-hop loops: A→B→C→D→A) with the same token and similar amounts — exactly the pattern visible in your "Wash-Trading Ring" scenario card.

### Scenario 1: The Wash-Trading Ring (Click button: Wash-Trading Ring)

**The Crime:** A scammer wants to make a worthless meme coin look super popular. So they pass $20,000 in a circle:

Wallet A → B → C → D → A.

It looks like $80,000 in volume occurred, but it’s just the same $20,000 moving in a circle.

**Why Graph is the Ideal Solution:**  In SQL, you'd have to write 4 self-joins. In Cypher, we just say:
cypher

```cypher
MATCH (start:Wallet)-[:TRANSFERRED*2..5]->(start)
```

CognoDB instantly finds the circle and computes the fake volume.

Common synonyms and related terms:

- Round-tripping — same money cycling back to the origin
- Self-trading — trading with yourself across wallets
- Churning — high-frequency wash trading (common in traditional finance)
- Painting the tape — classic stock market term for inflating volume
- Phantom trading — fake trades with no real counterpart
- Layering — similar concept in order-book manipulation
- Spoofing — related but different: placing fake orders to move price
- Pump and dump — the end goal wash trading often serves

In crypto specifically you'll also hear:

- Volume farming — creating fake volume to qualify for exchange listings or rewards
- Wash cycling — circular wash trades
- Sybil wash — wash trading across many bot wallets (overlaps with sybil attacks, which your app also detects)

## The Sybil Bot Farm

A Sybil Bot Farm is a scheme where one entity controls many wallet addresses ("bots") to artificially inflate demand, snipe tokens, or manipulate governance.

**How it works:**

1. Mastermind (one real person) creates 10–50 wallets
2. Funds each bot with a small amount of SOL from a single source
3. All bots simultaneously buy the same token at launch
4. Creates the illusion of organic, widespread interest
5. Mastermind later consolidates profits back to one wallet

**Why it's dangerous:**

- Sniping — bots front-run real buyers at token launch
- Fake community — makes a project look like it has many supporters
- Governance attacks — one person controls enough votes to pass proposals
- Airdrop farming — bots claim tokens meant for real users

**How RugGraph detects it:**

This app looks for the fan-out pattern: one address funding many wallets, all interacting with the same token. That's exactly what the `Mastermind funding 12 sniper bots on $MOON` description in the scenario card refers to — a popular 1-to-N funding structure.

The key signals:

- Single source funding multiple wallets
- All wallets interact with the same token
- Similar transaction amounts and timing
- Wallets have no other activity (created solely for this purpose)

### Scenario 2: The Sybil Bot Farm (Click button: Sybil Bot Cluster)

*8The Crime:** When a new token launches, one person secretly spins up 12 puppet wallets. The mastermind sends them SOL, and all 12 bots buy the token at the exact same millisecond to corner the market.

**Why Graph is the Ideal Solution:**  Cypher finds the common ancestor and aggregates downstream swaps with:

```cypher
MATCH (funder:Wallet)-[:FUNDED]->(sybil:Wallet)-[:SWAPPED]->(token:Token)
```

## Peeling Chain

A Peeling Chain is a money laundering technique where funds are "peeled" off in small increments through a sequence of wallets, making the trail harder to follow.

**How it works:**

1. Start with 500 SOL in Wallet A
2. Wallet A sends 490 SOL to Wallet B, keeps 10 SOL
3. Wallet B sends 480 SOL to Wallet C, keeps 10 SOL
4. Wallet C sends 470 SOL to Wallet D, keeps 10 SOL
5. ...continues for N hops...
6. Final wallet deposits to Binance CEX (off-ramp)

Each hop "peels" a small amount aside while moving the bulk forward.

**Why it's used:**

- Obfuscation — the trail spans many wallets, making tracing tedious
- Exchange integration — final destination is usually a CEX where funds can be cashed out
- Plausible deniability — each intermediate wallet can claim it's a normal transfer

**Key characteristics of peeling chains**

- Sequential chain — unlike wash trading (circular), this is a straight line
- Decreasing amounts — each hop carries slightly less than the previous
- Final hop = CEX — almost always ends at a known exchange deposit address

How RugGraph detects it

The app looks for long sequential paths (3+ hops) with decreasing amounts ending at a known CEX address. The "500 SOL chopped down sequentially to Binance CEX" description in the scenario card captures exactly this pattern.

### Scenario 3: The Peeling Chain (Click button: Peeling Chain)

**The Crime:** A hacker stole 500 SOL. To avoid automated exchange blacklists, they "peel" the funds: send 480 to a new wallet (keep 20), send 460 to another (keep 20), hopping 5 times before depositing into Binance.
**Why Graph is the Ideal Solution:** Variable-length path traversal [:TRANSFERRED*3..6] tracks the trail straight to the exit exchange.

## The Graph Filters & Query Parameters section

This sectionlets you refine what the graph displays and what queries run against CognoDB. It has three controls:

**Path Hop Length (min–max hops)**
Controls how many steps (edges) the analysis traverses between wallets.

- 2 hops = direct A→B relationships only
- 6 hops = deep chains like peeling or complex wash rings
- Narrowing this filters out noise and focuses on specific depth patterns

**Min Transfer Amount**
Filters out small, insignificant transactions.

- 0 SOL = show everything
- 5,000+ SOL = only large transfers worth investigating
- Useful for focusing on high-value laundering over trivial moves

**Show Flagged Anomaly Nodes Only**
Hides clean/organic wallets and shows only nodes already flagged by your backend analysis (wash traders, sybils, etc.)

**The "Run Cypher Query" / "Apply Filters" button:**

- Apply Filters (for preset scenarios) — re-fetches data from the backend with the new filter values
- Run Cypher Query (for custom scenarios) — sends the parameters as Cypher query constraints to CognoDB
In short: the scenario cards pick what pattern to look for, and these filters tune how strict the detection is.
