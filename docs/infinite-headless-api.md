# Headless SDK Documentation

## Overview

The Headless SDK enables secure wallet authentication for your application, allowing users to authenticate via their crypto wallets through a simple challenge-response flow. It works seamlessly across web, iOS, Android, and other platforms.

### Key Features

- **Multi-wallet support:** Users can link multiple wallets to a single account.
- **Platform agnostic:** Compatible with web, iOS, Android, and more.
- **Secure authentication:** Utilizes the EIP-191 message signing standard.
- **JWT-based sessions:** Employs industry-standard token authentication.
- **Simple integration:** Requires minimal configuration.

---

## Getting Started

### Prerequisites

To integrate the Headless SDK, you'll need:

- **Organization ID**: Provided during onboarding
- **API Endpoint**: `https://api.infinite.ai`

### Organization Requirements

For wallet authentication to work, your organization must:

- **Be Active**: Organization status must be "ACTIVE"
- **Have Wallet Auth Enabled**: The `WalletAuthEnabled` flag must be set to true
- **Be Valid**: Organization ID must exist in the system

> **Note:** Both `/auth/wallet/challenge` and `/auth/wallet/verify` endpoints validate these requirements. If your organization doesn't meet these criteria, authentication will fail with appropriate error messages.

### Required Headers

All API requests must include these headers:

```http
X-Organization-ID: your_organization_id
Content-Type: application/json
```

Authenticated endpoints also require:

```http
Authorization: Bearer {jwt_token}
```

> **Important:** The organization header has been standardized to `X-Organization-ID` (with uppercase ID) across all endpoints, including authentication endpoints.

---

## Authentication Flow

The authentication process consists of three steps:

1. Request Authentication Challenge
2. Sign Message
3. Verify Wallet Signature

---

## API Reference

### Request Authentication Challenge

Initiates the authentication process by requesting a unique challenge nonce.

- **publicKey**: `string` (required)

```http
GET /v1/auth/wallet/challenge?publicKey={public_key}
X-Organization-ID: {organization_id}
```

#### Example Request

```http
GET /v1/auth/wallet/challenge?publicKey=0x742d35Cc6634C0532925a3b844Bc9e7595f2BD6
X-Organization-ID: 9a9cbc74-7fed-49c3-8042-7b816a3e1a48
```

#### Example Response

```json
{
  "nonce": "a1b2c3d4e5f6g7h8i9j0",
  "message": "Sign this message to authenticate with Infinite Agents.\n\nPublicKey: 0x742d35Cc6634C0532925a3b844Bc9e7595f2BD6\nNonce: a1b2c3d4e5f6g7h8i9j0\nTimestamp: 1756182166",
  "domain": null,
  "expires_at": 1756182466,
  "expires_at_iso": "2025-08-26T04:27:46.824560+00:00",
  "expires_in": 300
}
```

---

### Verify Wallet Signature

Verifies the signed message and returns a JWT token for authenticated requests.

- **public_key**: `string` (required)
- **signature**: `string` (required)
- **nonce**: `string` (required)
- **platform**: `string`
- **domain**: `string`
- **message**: `string`

```http
POST /v1/auth/wallet/verify
X-Organization-ID: {organization_id}
```

#### Example Request
```json
{
  "public_key": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD6",
  "signature": "0x1234567890abcdef...",
  "nonce": "a1b2c3d4e5f6g7h8i9j0",
  "platform": "web"
}
```

#### Example Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "sess_abc123def456",
  "platform": "web",
  "onboarded": false
}
```

**Response Fields:**

- `access_token`: JWT token for authenticated requests
- `token_type`: Always "Bearer"
- `expires_in`: Token lifetime in seconds (typically 3600)
- `user_id`: Unique identifier for the wallet user
- `session_id`: Unique identifier for this authentication session
- `platform`: The platform used for authentication
- `onboarded`: Indicates if the wallet has completed customer onboarding (KYC)

---

### Message Format

The message to be signed is provided in the challenge response and includes a timestamp:

```
Sign this message to authenticate with Infinite Agents.

PublicKey: {publicKey}
Nonce: {nonce}
Timestamp: {timestamp}
```

> **Important:** Use the exact message from the challenge response. The message includes a timestamp and must be signed exactly as provided.

---

## Session Management

### List Active Sessions

View all active authentication sessions for the current user.

```http
GET /auth/wallet/sessions
```

**Example Response:**
```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "session_id": "sess_abc123def456",
      "public_key": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD6",
      "platform": "web",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      "created_at": "2024-01-07T10:00:00Z",
      "expires_at": "2024-01-07T11:00:00Z",
      "last_activity_at": "2024-01-07T10:30:00Z",
      "is_current": false
    }
  ]
}
```

### Logout

End authentication sessions with flexible options.

```http
POST /auth/wallet/logout
```

- **session_id**: `string`

#### Examples

**Logout current session only:**

```json
{
  // No body required - defaults to current session
}
```

**Logout specific session:**

```json
{
  "session_id": "sess_xyz789ghi012"
}
```

**Logout all sessions:**

```json
{
  "logout_all": true
}
```

#### Response

- **200 OK**: Successfully logged out
- **400 Bad Request**: Invalid session ID
- **401 Unauthorized**: Not authenticated

> - Sessions expire after the configured duration (typically 1 hour)
> - The `isCurrent` field indicates which session made the request
> - Logging out revokes the JWT token immediately
> - Session information helps detect unauthorized access

---

## Supported Countries & Currencies

### Get Supported Countries

Retrieve the list of countries supported for on-ramp and off-ramp operations.

```http
GET /v1/headless/countries
```

#### Example Response

```json
{
  "countries": [
    {
      "code": "US",
      "name": "United States",
      "isAllowed": true,
      "supportedFiatCurrencies": ["USD"],
      "supportedPaymentMethods": {
        "onRamp": ["ach", "wire"],
        "offRamp": ["ach", "wire"]
      }
    },
    {
      "code": "EU",
      "name": "European Union",
      "isAllowed": true,
      "supportedFiatCurrencies": ["EUR"],
      "supportedPaymentMethods": {
        "onRamp": ["sepa"],
        "offRamp": ["sepa"]
      },
      "memberStates": [
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
        "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
        "PL", "PT", "RO", "SK", "SI", "ES", "SE"
      ]
    },
    {
      "code": "MX",
      "name": "Mexico",
      "isAllowed": true,
      "supportedFiatCurrencies": ["MXN"],
      "supportedPaymentMethods": {
        "onRamp": ["spei"],
        "offRamp": ["spei"]
      }
    }
  ]
}
```

### Get Supported Currencies

Retrieve all supported cryptocurrencies and fiat currencies with their networks and limits.

```http
GET /v1/headless/currencies
```

#### Example Response

```json
{
  "currencies": [
    {
      "code": "USDC",
      "name": "USD Coin",
      "type": "crypto",
      "supportedNetworks": [
        {
          "network": "ethereum",
          "networkCode": "ETH",
          "contractAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          "confirmationsRequired": 12
        },
        {
          "network": "polygon",
          "networkCode": "POLYGON",
          "contractAddress": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          "confirmationsRequired": 30
        },
        {
          "network": "solana",
          "networkCode": "SOL",
          "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "confirmationsRequired": 1
        }
      ],
      "supportsOnRamp": true,
      "supportsOffRamp": true,
      "onRampCountries": ["US", "EU", "MX"],
      "offRampCountries": ["US", "EU", "MX"],
      "minAmount": "50",
      "maxAmount": "50000",
      "precision": 6
    },
    {
      "code": "USD",
      "name": "US Dollar",
      "type": "fiat",
      "supportedPaymentRails": ["ach", "wire"],
      "countryCode": "US",
      "precision": 2,
      "minAmount": "50",
      "maxAmount": "50000"
    }
    // ... more currencies
  ]
}
```

**Key Features:**

- **Authentication required** - Must be authenticated with a wallet JWT token
- **No onboarding required** - Can be accessed before completing customer KYC
- **Real-time limits** - Min/max amounts reflect current operational limits
- **Network details** - Includes contract addresses and confirmation requirements
- **Payment rails** - Shows available payment methods per country

**Limits:**

- **ACH**: $50 - $50,000 per transaction
- **Wire**: $500 - $50,000 per transaction (note higher minimum)
- **SEPA**: €50 - €50,000 per transaction
- **SPEI**: MXN 1,000 - MXN 1,000,000 per transaction

---

## Customer Onboarding

### Create Customer Profile

When authenticated via wallet, you can create a customer with simplified requirements. The wallet address from authentication is automatically associated with the customer.

- **type**: `string` (required) - "individual" or "business"
- **countryCode**: `string` (required) - ISO country code (e.g., "US")
- **data**: `object` (required) - Customer data based on type

```http
POST /v1/headless/customers
```

#### Individual Customer Request
```json
{
  "type": "individual",
  "countryCode": "US",
  "data": {
    "personalInfo": {
      "firstName": "Alice",
      "lastName": "Johnson"
    },
    "contactInformation": {
      "email": "alice.johnson@example.com"
    }
  }
}
```

#### Business Customer Request
```json
{
  "type": "business",
  "countryCode": "US",
  "data": {
    "companyInformation": {
      "legalName": "Acme Corp",
      "website": "https://acme.example.com"
    },
    "contactInformation": {
      "email": "contact@acme.example.com"
    }
  }
}
```

#### Example Response
```json
{
  "customer": {
    "id": "9b0d801f-41ac-4269-abec-f279dc54e849",
    "type": "INDIVIDUAL",
    "status": "ACTIVE",
    "countryCode": "US",
    "createdAt": "2025-08-26T04:31:24.372423+00:00"
  },
  "kycLinkUrl": "http://localhost:5223/v1/kyc?session=1d18081c-639b-40e1-90c2-8f5e0ec7b3ef&callback=edge%3A%2F%2Fkyc-complete",
  "usedPersonaKyc": true
}
```

**Headless Customer Creation Benefits:**

- Simplified schema - only requires email, name (and legal name/website for business)
- Automatic wallet association from authentication context
- Automatic Bridge KYC integration
- Bridge customer created automatically via KYC link API
- Real-time KYC status from Bridge
- Smart handling of existing customers (won't create duplicate KYC if already approved)
- TOS links available immediately after creation (can be accessed in parallel with KYC)

---

### Get KYC Link

Retrieve a KYC verification link for a customer.

- **redirectUrl**: `string` (required)

```http
GET /customers/{customerId}/kyc-link?redirectUrl={url}
```

#### Example Request
```http
GET /customers/12345678-1234-1234-1234-123456789012/kyc-link?redirectUrl=https://app.example.com/kyc-complete
```

#### Example Response
```json
{
  "url": "https://infinite.dev/kyc?session=kyc_sess_456&redirect=https://app.example.com/kyc-complete",
  "organizationName": "Your Organization",
  "branding": {
    "primaryColor": "#8B9388",
    "secondaryColor": "#2C2E2A",
    "logoUrl": "https://example.com/logo.png",
    "companyName": "Your Company"
  }
}
```

**KYC Flow:**

1. Customer is created with basic information
2. Get KYC link with redirect URL - returns an Infinite-owned URL that redirects to Bridge/Persona
3. Customer completes KYC at the provided URL
4. Customer is redirected back to your application
5. KYC status is automatically updated in the system

> The KYC URLs are Infinite-owned (`infinite.dev`) which provides better control over the user experience and allows for provider abstraction.

---

### KYC Status

Check current KYC verification status for a customer. This endpoint retrieves real-time status from Bridge.

```http
GET /v1/headless/customers/{customerId}/kyc-status
```

#### Example Request

```http
GET /v1/headless/customers/9b0d801f-41ac-4269-abec-f279dc54e849/kyc-status
Authorization: Bearer {access_token}
X-Organization-ID: 9a9cbc74-7fed-49c3-8042-7b816a3e1a48
```

#### Example Response

```json
{
  "customerId": "9b0d801f-41ac-4269-abec-f279dc54e849",
  "kycStatus": "approved",
  "kycCompletedAt": "2025-08-26T04:32:31.607Z"
}
```

**KYC Status Values (from Bridge):**

- `not_started` - KYC link created but not accessed
- `incomplete` - User started but didn't complete KYC
- `awaiting_ubo` - Waiting for Ultimate Beneficial Owner information (business only)
- `under_review` - Documents submitted and under review
- `approved` - KYC completed successfully, customer can transact
- `rejected` - KYC failed, customer cannot proceed
- `paused` - KYC temporarily paused
- `offboarded` - Customer has been offboarded

---

### Terms of Service (TOS)

Customers can access and accept Bridge's Terms of Service immediately after account creation, even before KYC approval.

#### Get TOS Link

Retrieve the Terms of Service acceptance link and status for a customer.

```http
GET /v1/headless/customers/{customerId}/tos
```

##### Headers
- `Authorization: Bearer {jwt_token}` (required)
- `X-Organization-ID: {organizationId}` (required)

##### Example Request
```http
GET /v1/headless/customers/9b0d801f-41ac-4269-abec-f279dc54e849/tos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Organization-ID: 9a9cbc74-7fed-49c3-8042-7b816a3e1a48
```

##### Example Response (TOS Pending)
```json
{
  "tosUrl": "https://api.infinite.dev/v1/headless/tos?session=7f8a9b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c&customerId=9b0d801f-41ac-4269-abec-f279dc54e849",
  "status": "pending",
  "acceptedAt": null,
  "customerName": "Alice Johnson",
  "email": "alice@example.com"
}
```

##### Example Response (TOS Accepted)
```json
{
  "tosUrl": "",
  "status": "accepted",
  "acceptedAt": "2025-08-26T17:15:22.123456Z",
  "customerName": "Alice Johnson",
  "email": "alice@example.com"
}
```

##### Example Response (Not Required)
```json
{
  "tosUrl": "",
  "status": "not_required",
  "acceptedAt": null,
  "customerName": "Alice Johnson",
  "email": "alice@example.com"
}
```

**TOS Flow:**

1. Customer is created via headless SDK
2. Call GET `/v1/headless/customers/{customerId}/tos` to get TOS link (available immediately)
3. If status is "pending", redirect customer to the `tosUrl`
4. Customer accepts TOS on Bridge's platform (can be done in parallel with KYC)
5. Bridge sends webhook to update TOS status
6. Once both KYC and TOS are complete, customer can perform transactions

**Key Features:**
- Available immediately after customer creation (no need to wait for KYC approval)
- Returns Infinite-owned URL that redirects to Bridge
- Session-based with 24-hour expiration
- Automatic status tracking via Bridge webhooks
- No need to store TOS acceptance locally
- Can be completed in parallel with KYC for better user experience

**TOS Status Values:**
- `pending` - TOS needs to be accepted
- `accepted` - TOS has been accepted
- `not_required` - TOS not required for this customer

---

## Account Management

### Add Bank Account

Link a bank account for fiat payments (ACH transfers).

- **type**: `string` (required)
- **bank_name**: `string` (required)
- **account_name**: `string` (required)
- **account_owner_name**: `string` (required)

```http
POST /accounts
```

#### Example Request
```json
{
  "type": "bank_account",
  "bank_name": "Chase Bank",
  "account_number": "12345678901234",
  "routing_number": "021000021",
  "account_name": "Main Checking",
  "account_owner_name": "Alice Johnson"
}
```

#### Example Response

```json
{
  "id": "acct_bank_xyz789abc123def456",
  "type": "bank_account",
  "bank_name": "Chase Bank",
  "account_name": "Main Checking",
  "last_4": "1234",
  "verification_status": "pending"
}
```

> **Note:** Wallet addresses are used directly in transfers without pre-registration. Only bank accounts need to be added through this endpoint.

---

## Quotes

### Create Quote (Headless)

Get real-time quotes for on-ramp (Bank → Crypto) or off-ramp (Crypto → Bank) conversions. This headless endpoint supports BTC, USDC, USDT, and ETH with automatic rate calculation.

```http
POST /v1/headless/quotes
```

#### Request Parameters

- **flow**: `string` (required) - Either "ONRAMP" or "OFFRAMP"
- **source**: `object` (required)
  - `asset`: `string` - Asset code (e.g., "USD", "USDC", "BTC")
  - `amount`: `decimal` (optional) - Amount to convert
  - `network`: `string` (optional) - Blockchain network for crypto assets
- **target**: `object` (required)
  - `asset`: `string` - Asset code (e.g., "USD", "USDC", "BTC")
  - `amount`: `decimal` (optional) - Amount to receive (if source amount not provided)
  - `network`: `string` (optional) - Blockchain network for crypto assets

> **Note:** You must provide either `source.amount` or `target.amount`, but not both.

#### Example Request (On-Ramp: USD → USDC)

```json
{
  "flow": "ONRAMP",
  "source": { 
    "asset": "USD", 
    "amount": 1000.0 
  },
  "target": { 
    "asset": "USDC", 
    "network": "ethereum" 
  }
}
```

#### Example Response

```json
{
  "quoteId": "quote_hls_xyz123abc456",
  "flow": "ONRAMP",
  "source": { 
    "asset": "USD", 
    "amount": 1000.0 
  },
  "target": { 
    "asset": "USDC", 
    "network": "ethereum", 
    "amount": 990.0 
  },
  "infiniteFee": 5.0,
  "edgeFee": 5.0
}
```

#### Example Request (Off-Ramp: BTC → USD)

```json
{
  "flow": "OFFRAMP",
  "source": { 
    "asset": "BTC", 
    "amount": 0.5,
    "network": "bitcoin" 
  },
  "target": { 
    "asset": "USD" 
  }
}
```

#### Example Response

```json
{
  "quoteId": "quote_hls_def789ghi012",
  "flow": "OFFRAMP",
  "source": { 
    "asset": "BTC", 
    "amount": 0.5,
    "network": "bitcoin" 
  },
  "target": { 
    "asset": "USD", 
    "amount": 50250.75 
  },
  "infiniteFee": 125.25,
  "edgeFee": 125.25
}
```

### Supported Assets

**Cryptocurrencies:**
- BTC (Bitcoin)
- ETH (Ethereum)
- USDC (USD Coin)
- USDT (Tether)

**Fiat Currencies:**
- USD (US Dollar)

**Networks:**
- `bitcoin` - Bitcoin network
- `ethereum` - Ethereum mainnet
- `polygon` - Polygon network
- `solana` - Solana network

### Fee Structure

- **infiniteFee**: Fee charged by Infinite (0.5% of transaction)
- **edgeFee**: Additional fee charged by Edge (0.5% of transaction)
- **Total Fee**: 1% of transaction amount

> **Rate Source:** Exchange rates are fetched in real-time from DeFiLlama price API.

---

### Create Quote (Standard)

Get real-time quotes for on-ramp (Bank → Crypto) or off-ramp (Crypto → Bank) conversions.

- **flow**: `string` (required)
- **source**: `object` (required)
  - `asset`: Asset code (e.g., "USD", "USDC")
  - `amount`: Amount to convert
  - `network`: (Optional) Blockchain network for crypto assets
- **target**: `object` (required)
  - `asset`: Asset code (e.g., "USD", "USDC")
  - `network`: (Optional) Blockchain network for crypto assets

```http
POST /v2/quotes
```

#### On-Ramp Quote Example (USD → USDC)
```json
{
  "flow": "ONRAMP",
  "source": { "asset": "USD", "amount": 1000.0 },
  "target": { "asset": "USDC", "network": "ethereum" }
}
```

#### On-Ramp Quote Response

```json
{
  "quoteId": "quote_xyz123abc456def789",
  "flow": "ONRAMP",
  "source": { "asset": "USD", "amount": 1000.0 },
  "target": { "asset": "USDC", "network": "ethereum", "amount": 995.0 },
  "fee": 5.0,
  "rate": 0.995,
  "expiresAt": "2024-06-30T16:15:00Z"
}
```

#### Off-Ramp Quote Example (USDC → USD)
```json
{
  "flow": "OFFRAMP",
  "source": { "asset": "USDC", "network": "ethereum", "amount": 1000.0 },
  "target": { "asset": "USD" }
}
```

#### Off-Ramp Quote Response

```json
{
  "quoteId": "quote_abc456def789xyz123",
  "flow": "OFFRAMP",
  "source": { "asset": "USDC", "network": "ethereum", "amount": 1000.0 },
  "target": { "asset": "USD", "amount": 985.0 },
  "infiniteFee": 10.0,
  "edgeFee": 5.0,
  "totalReceived": 985.0,
  "expiresAt": "2024-06-30T16:20:00Z"
}
```

> **Important:** Quotes expire after the time specified in `expiresAt`. Always execute transfers before the quote expires to guarantee the quoted rate.

---

## Transfers

### Execute Transfer

Execute a transfer based on a valid quote.

- **type**: `string` (required)
- **quoteId**: `string` (required)
- **source**: `object` (required)
  - For on-ramp: `accountId` (bank account)
  - For off-ramp: `address` (wallet address), `asset`, `amount`, and `network`
- **destination**: `object` (required)
  - For on-ramp: `address` (wallet address), `asset`, and `network`
  - For off-ramp: `accountId` (bank account)
- **autoExecute**: `boolean`

```http
POST /transfers
```

#### On-Ramp Transfer Example (Bank → Crypto)
```json
{
  "type": "ONRAMP",
  "quoteId": "quote_xyz123abc456def789",
  "source": { "accountId": "acct_bank_xyz789abc123def456" },
  "destination": { "address": "0x742d35cc6ab26c82c3b8c85c8a7e3c7b1234567890", "asset": "USDC", "network": "ethereum" },
  "autoExecute": true
}
```

#### On-Ramp Transfer Response
```json
{
  "data": {
    "id": "transfer_onramp_abc123",
    "organizationId": "org_edge_wallet_main",
    "type": "ONRAMP",
    "source": { "asset": "USD", "amount": 1000.0, "network": "ach_push" },
    "destination": { "asset": "USDC", "amount": 995.0, "network": "ethereum" },
    "status": "Pending",
    "stage": "awaiting_funds",
    "createdAt": "2024-06-30T16:10:30Z",
    "updatedAt": "2024-06-30T16:10:30Z",
    "completedAt": null,
    "sourceDepositInstructions": {
      "amount": 1000.0,
      "currency": "USD",
      "paymentRail": "ach_push",
      "bank": {
        "name": "Lead Bank",
        "accountNumber": "1000682791",
        "routingNumber": "101206101"
      },
      "accountHolder": {
        "name": "Infinite Payments LLC"
      },
      "memo": "TRANSFER_ABC123"
    },
    "fees": []
  }
}
```

#### Off-Ramp Transfer Example (Crypto → Bank)
```json
{
  "type": "OFFRAMP",
  "quoteId": "quote_abc456def789xyz123",
  "source": { "address": "0x742d35cc6ab26c82c3b8c85c8a7e3c7b1234567890", "asset": "USDC", "amount": 1000.0, "network": "ethereum" },
  "destination": { "accountId": "acct_bank_xyz789abc123def456" },
  "autoExecute": true
}
```

#### Off-Ramp Transfer Response
```json
{
  "data": {
    "id": "transfer_offramp_def456",
    "organizationId": "org_edge_wallet_main",
    "type": "OFFRAMP",
    "source": { "asset": "USDC", "amount": 1000.0, "network": "ethereum" },
    "destination": { "asset": "USD", "amount": 985.0, "network": "ach_push" },
    "status": "Pending",
    "stage": "awaiting_crypto",
    "createdAt": "2024-06-30T16:15:10Z",
    "updatedAt": "2024-06-30T16:15:10Z",
    "completedAt": null,
    "sourceDepositInstructions": {
      "paymentRail": "ethereum",
      "depositAddress": "0x123abc456def789ghi012jkl345mno678pqr901stu234",
      "memo": "TRANSFER_DEF456"
    },
    "fees": []
  }
}
```

---

### Get Transfer Status

Retrieve detailed information about a transfer.

```http
GET /transfers/{transferId}
```

#### Example Request

```http
GET /transfers/transfer_onramp_abc123
```

#### Example Response

```json
{
  "data": {
    "id": "transfer_onramp_abc123",
    "organizationId": "org_edge_wallet_main",
    "type": "ONRAMP",
    "source": { "asset": "USD", "amount": 1000.0, "network": "ach_push" },
    "destination": { "asset": "USDC", "amount": 995.0, "network": "ethereum" },
    "status": "Completed",
    "stage": "completed",
    "createdAt": "2024-06-30T16:10:30Z",
    "updatedAt": "2024-07-01T09:22:33Z",
    "completedAt": "2024-07-01T09:22:33Z",
    "transactionHash": "0x8f4c2a7e3d9b6f1c5e8a2d7b4f9c3e6a1d8f5c2e9b7a4d1f6e3c8b5a2f9d6c1e4a7b",
    "blockNumber": 18456789,
    "confirmations": 24,
    "fees": [],
    "statusHistory": [
      { "status": "Completed", "stage": "completed", "timestamp": "2024-07-01T09:22:33Z", "reason": null },
      { "status": "Pending", "stage": "blockchain_pending", "timestamp": "2024-07-01T09:18:12Z", "reason": null },
      { "status": "Pending", "stage": "fiat_to_crypto", "timestamp": "2024-07-01T09:16:45Z", "reason": null },
      { "status": "Pending", "stage": "payment_received", "timestamp": "2024-07-01T09:15:22Z", "reason": null },
      { "status": "Pending", "stage": "awaiting_funds", "timestamp": "2024-06-30T16:10:30Z", "reason": null }
    ]
  }
}
```

---

### Transfer Stages

| Stage              | Description                                             |
|--------------------|--------------------------------------------------------|
| `awaiting_funds`   | On-Ramp: Waiting for ACH payment from customer's bank  |
| `awaiting_crypto`  | Off-Ramp: Waiting for crypto deposit to our address    |
| `payment_received` | Bank payment received and verified                     |
| `fiat_to_crypto`   | Converting USD to cryptocurrency                       |
| `crypto_to_fiat`   | Converting cryptocurrency to USD                       |
| `blockchain_pending`| Transaction submitted to blockchain, awaiting confirmation |
| `completed`         | Transfer successfully completed                        |

> **Transaction Hash:** The `transactionHash` field contains the Ethereum transaction hash (32 bytes as hex with 0x prefix). This unique identifier can be used to track the transfer on Etherscan or similar blockchain explorers.

---

## Organization ID Management

All API requests (except authentication endpoints) require an Organization ID to identify your application.

### Required Header

Include your Organization ID in every API request:

```http
X-Organization-ID: your_organization_id
```

### Example Request with Organization ID

```http
GET /customer/cust_abc123def456ghi789/kyc-status
Authorization: Bearer {access_token}
X-Organization-ID: org_edge_wallet_main
Content-Type: application/json
```

> **Edge Wallet Integration:** For Edge Wallet, the organization ID is `org_edge_wallet_main`. This should be stored securely on the device and included in all API requests.

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "publicKey",
      "reason": "Additional context"
    }
  }
}
```

### Common Error Codes

| Code                    | HTTP Status | Description                              | Solution                                   |
|-------------------------|-------------|------------------------------------------|--------------------------------------------|
| `INVALID_PUBLIC_KEY`    | 400         | Invalid wallet public key format         | Verify public key is 42 characters starting with 0x |
| `CHALLENGE_EXPIRED`     | 400         | Challenge nonce expired                  | Request a new challenge                    |
| `INVALID_SIGNATURE`     | 400         | Signature verification failed            | Check message format and signing method    |
| `NONCE_ALREADY_USED`    | 400         | Invalid or expired nonce                 | Request a new challenge                    |
| `UNAUTHORIZED`          | 401         | Missing or invalid token                 | Re-authenticate                            |
| `SESSION_EXPIRED`       | 401         | Authentication session expired           | Re-authenticate with wallet                |
| `SESSION_NOT_FOUND`     | 404         | Session ID not found                     | Use valid session ID                       |
| `ORGANIZATION_NOT_FOUND`| 404         | Organization with ID not found           | Check organization ID                      |
| `ORGANIZATION_NOT_ACTIVE`| 400        | Organization is not active               | Contact support                            |
| `WALLET_AUTH_DISABLED`  | 400         | Wallet authentication is not enabled for organization | Contact support to enable         |
| `RATE_LIMITED`          | 429         | Too many requests                        | Wait and retry with backoff                |
| `KYC_REQUIRED`          | 403         | KYC not completed                        | Complete KYC verification                  |
| `KYC_REJECTED`          | 403         | KYC verification failed                  | Contact support                            |
| `INVALID_QUOTE`         | 400         | Quote expired or invalid                 | Request new quote                          |
| `INSUFFICIENT_BALANCE`  | 400         | Not enough funds                         | Check account balance                      |
| `TRANSFER_FAILED`       | 400         | Transfer could not be processed          | Check transfer details                     |
| `ACCOUNT_NOT_VERIFIED`  | 400         | Bank account not verified                | Complete account verification              |

---

## Implementation Guide

### 1. Initialize Configuration

Store your credentials securely in environment variables:

```env
# .env file
INFINITE_API_URL=https://api.infinite.ai
INFINITE_ORG_ID=your_organization_id
```

### 2. Authentication Flow

1. **Request Challenge**: Call `/auth/wallet/challenge` with the user's wallet public key
2. **Sign Message**: Have the user sign the formatted message with their wallet
3. **Verify Signature**: Submit the signature to `/auth/wallet/verify`
4. **Store Token**: Save the JWT token securely using platform-specific storage
   - Use httpOnly, secure cookies for maximum security
   - Alternative: Encrypted localStorage with short expiration

**Mobile Applications:**  
**Desktop Applications:**  
- Use OS-specific credential storage (Keychain, Credential Manager, Secret Service)

### 4. Making Authenticated Requests

Include the JWT token in all authenticated API calls:

```http
GET /customers/{customerId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-Organization-ID: your_organization_id
```

---

## Security Best Practices

### Challenge Handling

- Request a new challenge for each authentication attempt
- Never reuse challenges (each nonce is single-use)
- Challenges expire after 5 minutes
- Validate challenge response before signing

### Token Management

- Store tokens securely using platform-specific encrypted storage
- Implement token expiration checking before API calls
- Clear tokens on logout and app termination
- Never log or expose tokens
- Monitor active sessions regularly

### Session Security

- Review active sessions periodically via `/auth/wallet/sessions`
- Logout unused sessions to prevent unauthorized access
- Implement session timeout handling in your application
- Store session IDs securely for session management

### Network Security

- Always use HTTPS for API communication
- Validate SSL certificates
- Include proper User-Agent headers for session tracking

> **Note:** Some advanced security features like device fingerprinting, certificate pinning, and automatic token refresh are planned for future releases.

### Error Handling

- Don't expose sensitive information in error messages
- Log errors securely without including tokens or signatures
- Implement proper error recovery mechanisms
- Handle rate limiting with exponential backoff

### Organization Context

- Always verify organization ID matches expected value
- Store organization ID securely
- Validate organization has wallet auth enabled before authentication

---

## Performance Optimization

### Caching

- Cache user wallet list for quick access
- Implement smart token refresh to avoid unnecessary re-authentication

### Request Optimization

- Batch API calls where possible
- Implement exponential backoff for retries
- Use connection pooling for better performance

**Common causes and solutions:**

- **Message format**: Ensure exact match including the blank line
- **Public key case**: Some libraries return checksummed public keys - normalize to lowercase
- **Encoding**: Ensure UTF-8 encoding for the message
- **Signature format**: Must be hex string with 0x prefix

---

## Troubleshooting

### Getting 401 Unauthorized errors

Check these items in order:

1. Token included in Authorization header with "Bearer " prefix
2. Token hasn't expired (check `expires_in` field)
3. All required headers are present
4. Token belongs to the correct organization

### Challenge expires too quickly

- Challenges expire after 5 minutes
- Ensure your signing flow completes within this timeframe
- Consider pre-warming the wallet connection
- Implement proper loading states to set user expectations

---

## Support

For additional assistance, contact Infinite support.