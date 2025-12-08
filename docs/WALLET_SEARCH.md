# Wallet Search Functionality

This document describes the search behavior for wallet lists in Edge.

## Overview

The wallet search supports:
- **Multi-word search**: Space-delimited terms with AND logic
- **Field-specific matching**: Different fields use different matching strategies
- **Case-insensitive**: All searches are case-insensitive

---

## Field Matching Rules

### `startsWith` Fields (Asset Identification)

These fields only match if the search term appears at the **beginning** of the field value.

| Field | Applies To | Example |
|-------|-----------|---------|
| `currencyCode` | All items | "eth" matches "ETH", not "WETH" |
| `displayName` | All items | "bit" matches "Bitcoin", not "Stablebit" |
| `assetDisplayName` | Mainnet only | "ether" matches "Ethereum" |

**Rationale**: Prevents partial matches like "eth" matching "T**eth**er"

### `includes` Fields (Discovery/Context)

These fields match if the search term appears **anywhere** in the field value.

| Field | Applies To | Example |
|-------|-----------|---------|
| `chainDisplayName` | Mainnet only | "ase" matches "Base" |
| `wallet name` | All items | "savings" matches "My Savings Wallet" |
| `contractAddress` | Tokens only | "dac17f" matches "0x**dac17f**958d2..." |

**Rationale**: Allows broader discovery by network name, wallet name, or contract address

---

## Multi-Word Search (AND Logic)

When multiple words are entered (space-separated), **ALL terms must match** at least one field.

### Examples

| Search | Matches | Explanation |
|--------|---------|-------------|
| `base eth` | ETH on Base | "base" → chainDisplayName, "eth" → currencyCode |
| `eth base` | ETH on Base | Order doesn't matter |
| `btc savings` | BTC in "Savings" wallet | "btc" → currencyCode, "savings" → wallet name |
| `base btc` | Nothing | No wallet has both Base chain AND BTC currency |

---

## Mainnet vs Token Behavior

Some fields are **only searched for mainnet assets** (not tokens):

| Field | Mainnet | Tokens | Reason |
|-------|---------|--------|--------|
| `assetDisplayName` | ✅ | ❌ | Describes the chain's native asset, not tokens |
| `chainDisplayName` | ✅ | ❌ | Would match ALL tokens on that chain |
| `currencyCode` | ✅ | ✅ | Identifies the specific asset |
| `displayName` | ✅ | ✅ | Token's display name |
| `wallet name` | ✅ | ✅ | Find all assets in a wallet |
| `contractAddress` | N/A | ✅ | Only tokens have contracts |

### Why This Matters

Without this restriction, searching "eth" would match:
- ✅ ETH mainnet (via currencyCode)
- ❌ USDT on Ethereum (via chainDisplayName "Ethereum")
- ❌ USDC on Ethereum (via chainDisplayName "Ethereum")

This would defeat the purpose of the `startsWith` matching for asset identification.

---

## Wallet Name Behavior

Wallet name search uses `includes` and applies to **all items** (mainnet and tokens).

### Important Implication

If a wallet is named "My Ethereum", searching "eth" will match:
- The ETH mainnet asset (via currencyCode AND wallet name)
- All tokens on that wallet (via wallet name)

This is **intentional** - searching by wallet name should find everything in that wallet.

### Example

```
Wallet: "My Ethereum" (contains ETH, USDT, USDC)

Search "eth":
  → ETH mainnet ✅ (currencyCode starts with "eth")
  → USDT ✅ (wallet name "My Ethereum" contains "eth")
  → USDC ✅ (wallet name "My Ethereum" contains "eth")

Search "usdt":
  → USDT ✅ (currencyCode starts with "usdt")
  → ETH ❌
  → USDC ❌
```

---

## Case Studies

### Case 1: Finding ETH on Base Network

**Goal**: Find Ethereum on Base L2

```
Search: "base eth"

Evaluation for Base ETH wallet:
  Term "base":
    - currencyCode "ETH".startsWith("base") → false
    - displayName "Ethereum".startsWith("base") → false
    - assetDisplayName "Ethereum".startsWith("base") → false
    - chainDisplayName "Base".includes("base") → TRUE ✅
  
  Term "eth":
    - currencyCode "ETH".startsWith("eth") → TRUE ✅

Result: MATCH (both terms satisfied)
```

### Case 2: "eth" Should NOT Match Tether

**Goal**: Searching "eth" should find Ethereum, not Tether

```
Search: "eth"

Evaluation for Tether (USDT) on "Savings" wallet:
  Term "eth":
    - currencyCode "USDT".startsWith("eth") → false
    - displayName "Tether".startsWith("eth") → false
    - wallet name "Savings".includes("eth") → false
    - contractAddress "0xdac17f...".includes("eth") → false

Result: NO MATCH ✅

Evaluation for Ethereum mainnet:
  Term "eth":
    - currencyCode "ETH".startsWith("eth") → TRUE ✅

Result: MATCH ✅
```

### Case 3: "teth" SHOULD Match Tether

**Goal**: Partial match at start of display name

```
Search: "teth"

Evaluation for Tether (USDT):
  Term "teth":
    - currencyCode "USDT".startsWith("teth") → false
    - displayName "Tether".startsWith("teth") → TRUE ✅

Result: MATCH ✅
```

### Case 4: "steth" Should NOT Match WSTETH

**Goal**: Middle-of-word matches should not work for asset fields

```
Search: "steth"

Evaluation for Wrapped stETH (WSTETH):
  Term "steth":
    - currencyCode "WSTETH".startsWith("steth") → false (starts with "w")
    - displayName "Wrapped stETH".startsWith("steth") → false (starts with "w")

Result: NO MATCH ✅
```

### Case 5: Finding by Contract Address

**Goal**: Search by partial contract address

```
Search: "dac17f"

Evaluation for USDT (contract: 0xdac17f958d2ee523a2206206994597c13d831ec7):
  Term "dac17f":
    - contractAddress.includes("dac17f") → TRUE ✅

Result: MATCH ✅
```

---

## Edge Cases

### Empty/Whitespace Search

| Search | Result |
|--------|--------|
| `""` (empty) | Returns all items |
| `"   "` (whitespace only) | Returns all items |

### Multiple Spaces Between Terms

```
Search: "base   eth" (multiple spaces)
→ Treated as: ["base", "eth"]
→ Same result as "base eth"
```

### Special Characters

Contract addresses with `0x` prefix work normally:
```
Search: "0xdac17f"
→ Matches tokens with that contract address prefix
```

### No Matches

When no items match all search terms:
```
Search: "xyz123notfound"
→ Returns empty array []
```

---

## Summary Table

| Search Term | Matches | Does NOT Match |
|-------------|---------|----------------|
| `eth` | ETH, Ethereum | Tether, WETH |
| `teth` | Tether | ETH |
| `base eth` | ETH on Base | ETH on Ethereum, BTC |
| `bitcoin` | Bitcoin, BTC | Ethereum |
| `wsteth` | WSTETH, Wrapped stETH | stETH |
| `steth` | stETH | WSTETH |
| `savings` | All assets in "Savings" wallet | Assets in other wallets |
| `0xdac17f` | USDT (by contract) | Other tokens |


