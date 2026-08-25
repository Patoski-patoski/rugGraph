# RugGraph — Interview Guide

## What I Built

RugGraph is a web application that visualizes cryptocurrency transaction networks to detect financial fraud. It maps out how wallets, tokens, and exchanges are connected, then highlights three specific types of suspicious activity — wash trading, sybil bot farms, and money laundering chains — using an interactive graph visualization.

**Tech stack:** React (frontend), NestJS + Bun (backend), CognoDB (graph database).

---

## The Problem

On blockchain networks, every transaction is public. But raw transaction data is just a giant list of "wallet A sent X to wallet B." It's nearly impossible for a human to spot fraud patterns in that list — you need to see the **relationships** between transactions. That's where a graph database comes in.

---

## Three Types of Fraud Detected

### 1. Wash-Trading Ring

**What it is:** A scammer makes a worthless token look popular by moving the same money in a circle.

**Example:** Alice sends \$20,000 of $PEPE to Bob, Bob sends it to Carol, Carol sends it to Dave, Dave sends it back to Alice. One loop. \$80,000 in apparent volume, but it's the same \$20,000 recycling.

**Why it matters:** Real traders see "high volume" and buy in, thinking the token is in demand. The scammer then dumps the token and runs with their money.

**How the app finds it:** The app looks for circular paths — wallets connected in a loop where the same token and similar amounts appear at each step.

**Button in the app:** "Wash-Trading Ring" (shows a 4-hop circular pattern).

---

### 2. Sybil Bot Cluster

**What it is:** One person secretly controls many wallets to fake widespread interest in a token.

**Example:** A "mastermind" creates 12 wallets, funds each with SOL, and all 12 buy the same token at the exact same moment. To an outside observer, it looks like 12 independent people are excited about this token. In reality, it's one person manipulating the market.

**Why it matters:** It creates fake demand, inflates the token price, and crowds out real buyers. It's also used to game airdrops (free token giveaways meant for real users).

**How the app finds it:** The app looks for a "fan-out" pattern — one wallet funding many other wallets that all interact with the same token.

**Button in the app:** "Sybil Bot Cluster" (shows a 1-to-12 fan-out).

---

### 3. Peeling Chain

**What it is:** A money laundering technique where stolen or illicit funds are "peeled" off in small amounts through a series of wallets to hide the trail.

**Example:** A hacker steals 500 SOL. They send 480 to Wallet B (keeping 20), Wallet B sends 460 to Wallet C (keeping 20), and so on — hopping through 5+ wallets before finally depositing into Binance (a real-world exchange where crypto becomes cash).

**Why it matters:** Each hop makes it harder to trace the money back to the original theft. By the time it reaches the exchange, it looks like clean funds.

**How the app finds it:** The app traces long chains of transactions where amounts decrease at each step and the final destination is a known exchange deposit address.

**Button in the app:** "Peeling Chain" (shows the sequential path to Binance).

---

## Why a Graph Database?

The key insight: these fraud patterns are **relationship problems**, not data problems.

- **Wash trading** = finding circles in the network
- **Sybil farms** = finding fan-out trees from one parent
- **Peeling chains** = finding long sequential paths to an endpoint

A traditional database (like MySQL or PostgreSQL) would need complex, slow queries with multiple self-joins to find these patterns. A graph database is built for exactly this — it stores relationships as first-class citizens and can traverse them instantly.

**One example:** Finding a circular wash-trade loop across 5 wallets is a single line in a graph query language (Cypher): "find any path that starts and ends at the same wallet, traversing 2 to 5 edges." In SQL, that would require 4+ self-joins and a recursive common table expression — much slower, harder to write, and fragile.

---

## How the App Works

1. **Seed the database** with synthetic (fake but realistic) transaction data
2. **Pick a scenario** using the buttons at the top (Wash Ring, Sybil Cluster, Peeling Chain, or Full Network)
3. **Adjust filters** — hop depth, minimum transaction amount, or show only flagged wallets
4. **Explore the graph** — click any node (wallet, token, exchange) to see its details, transaction history, and risk score
5. The app renders an interactive force-directed graph where **nodes** are entities and **edges** are transactions

---

## Key Terminology

| Term | Meaning |
|------|---------|
| **Wallet** | A blockchain address (like a bank account number) |
| **Token** | A cryptocurrency (like $PEPE, $MOON) |
| **Edge/Relationship** | A transaction between two wallets |
| **Hop** | One step in a chain (A→B = 1 hop) |
| **CEX** | Centralized Exchange (Binance, Coinbase) — where crypto becomes cash |
| **Risk Score** | A 0–100 score based on how suspicious a wallet's behavior is |
| **Flagged** | Wallets the system has identified as potentially fraudulent |
