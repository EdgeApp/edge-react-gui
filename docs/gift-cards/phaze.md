## Phaze Gift Cards Integration

### Overview

This document summarizes the Phaze Non‑Custodial API integration and the corresponding GUI plugin design for gift cards.

### API Summary

- Base URL (sandbox default): `https://api.rewardsevolved.com/sandbox`
- Required headers per endpoint:
  - **API-Key**: Application API key
  - **user-api-key**: Present for user-specific endpoints (set after registration)
  - **public-key**: Optional when requested by partner
  - Content-Type: `application/json` for POST bodies

Endpoints we use:
- GET `/crypto/tokens` → supported tokens and networks
- GET `/crypto/user?email=...` → lookup existing user by email (returns `userApiKey`)
- POST `/crypto/user` → register user; returns `userApiKey` and user record
- GET `/gift-cards/:country` → list gift card brands/products by country (paginated)
- GET `/gift-cards/full/:country` → list all gift card brands (no pagination)
- POST `/crypto/order` → create an order/quote for purchase
- GET `/crypto/orders/status` → retrieve order status by `quoteId` (paging supported)

Error envelope observed:
- `{ error: string, httpStatusCode?: number }`

### Type Cleaners and Hardened Types

Defined in `src/plugins/gift-cards/phazeGiftCardTypes.ts`:
- Init/options: `asPhazeInitOptions`
- Tokens: `asPhazeToken`, `asPhazeTokensResponse`
- Country list: `asPhazeCountryList`
- User:
  - Request: `PhazeRegisterUserRequest`
  - Response: `asPhazeRegisterUserResponse` → `asPhazeUser` (includes optional `userApiKey` on first run)
- Gift cards: `asPhazeGiftCardBrand`, `asPhazeGiftCardsResponse`
- Orders:
  - Request: `PhazeCartItemRequest`, `PhazeCreateOrderRequest`
  - Response: `asPhazeCreateOrderResponse` (includes `quoteId`, `deliveryAddress`, `tokenIdentifier`, etc.)
  - Status: `asPhazeOrderStatusResponse`
- Errors/headers: `asPhazeError`, `asPhazeHeaders`

Notes:
- POST request bodies are defined as hardened TypeScript interfaces (no cleaners required for input).
- Cleaners validate and harden responses from the API.

### API Client

File: `src/plugins/gift-cards/phazeApi.ts`
- Factory: `makePhazeApi(config)` with `baseUrl`, `apiKey`, optional `userApiKey`, `publicKey`.
- Methods: `getTokens`, `getGiftCards`, `registerUser`, `createOrder`, `getOrderStatus`.
- Fetch wrapper logs curl lines when `ENV.DEBUG_VERBOSE_LOGGING` is enabled and parses `asPhazeError` when HTTP errors occur.

### Provider Design

File: `src/plugins/gift-cards/phazeGiftCardProvider.ts`
- Factory: `makePhazeGiftCardProvider(config)` wraps the API client and encapsulates auth and storage.
- Methods:
  - `setUserApiKey(userApiKey)`
  - `ensureUser(account)` → reads identity (`phazeGiftCardIdentity.json`); if found, sets `userApiKey`
  - `getTokens()`
  - `getGiftCards({ countryCode, currentPage?, perPage?, brandName? })`
  - `getFullGiftCards({ countryCode })` → returns all brands without pagination
  - `getUserByEmail(email)` → lookup existing user; returns `undefined` if not found
  - `registerUser(body)` → returns response and auto-sets `userApiKey` when present
  - `getOrCreateUser(body)` → lookup by email first, register if not found (multi-device support)
  - `createOrder(account, body)` → persists order locally (see Order Store)

### Hooks

File: `src/hooks/useGiftCardProvider.ts`
- `useGiftCardProvider({ account, apiKey, baseUrl?, publicKey? })` → `{ provider, isReady }`
- Initializes provider and calls `ensureUser(account)` to attach saved `userApiKey`.

### Account‑Synced Storage

- Identity: `phazeGiftCardIdentity.json` (disklet)
  - Saved by `GiftCardIdentityFormScene` and used by the provider to set `userApiKey`.
- Orders: `src/plugins/gift-cards/phazeGiftCardOrderStore.ts`
  - `savePhazeOrder(account, order)` → writes `phaze-gift-card-orders/<quoteId>.json`
  - `upsertPhazeOrderIndex(account, quoteId)` → maintains `index.json`
  - `getPhazeOrder`, `listPhazeOrders`

### CAIP‑19 Asset Mapping

File: `src/util/caip19Utils.ts`
- `edgeAssetToCaip19(account, asset)` and `caip19ToEdgeAsset(account, caip19)`
- Supported:
  - EVM: `eip155:<chainId>/erc20:<contract>` and native `eip155:<chainId>/slip44:<code>`
  - Bitcoin family natives: `bitcoin:mainnet/slip44:0`, `bch:mainnet/slip44:145`, `litecoin:mainnet/slip44:2`, `solana:mainnet/slip44:501`
  - Tron TRC20: `tron:mainnet/trc20:<contract>`
  - Partner-native variants are accepted for parsing (e.g., `bitcoin:mainnet/btc:native`).
- Reference: [CAIP‑19: Asset Type and Asset ID Specification](https://chainagnostic.org/CAIPs/caip-19)

### UI Flow and Scenes

- `GiftCardListScene`
  - Primary entry point. On “Purchase New”:
    - If no `userApiKey`, route to `GiftCardIdentityFormScene`.
    - Else, if no `countryCode`, show country modal; navigation proceeds only if user selects a country.
    - Then route to `GiftCardMarketScene`.

- `GiftCardIdentityFormScene`
  - UI: `GuiFormField` for first/last/email with email validation.
  - On submit: calls `provider.getOrCreateUser` (looks up existing user first, registers if not found), persists identity (including `userApiKey`), updates provider, routes to `GiftCardMarketScene`.
  - Multi-device support: If the same email was registered on another device, the existing `userApiKey` is retrieved seamlessly.

- `GiftCardMarketScene`
  - Uses `useGiftCardProvider` and environment API key to fetch brands via `/gift-cards/:country`.
  - Displays a search input and grid of brands.

Future wiring (planned):
- Brand Details → Enter Amount → Confirm → Pending
- Create order via `provider.createOrder`, persist order, route to Send scene with `deliveryAddress` and mapped token; then track status.

### Configuration

- API key is sourced from `ENV.PLUGIN_API_KEYS.phaze.apiKey`.
- `phazeApi` respects `ENV.DEBUG_VERBOSE_LOGGING` for verbose curl logging.

### Error Handling

- API wrapper attempts to parse `asPhazeError`; throws with status + message when available.
- Navigation blocks proceeding to market if the user dismisses the country selection modal.


