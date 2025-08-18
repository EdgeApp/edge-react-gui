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

- **Organization ID**: Provided during onboarding.
- **API Endpoint**: `https://api.infinite.ai`

### Organization Requirements

- Organization status must be **ACTIVE**.
- `WalletAuthEnabled` flag must be set to **true**.
- Organization ID must exist in the system.

> Both `/auth/wallet/challenge` and `/auth/wallet/verify` endpoints validate these requirements. If unmet, authentication will fail with appropriate error messages.

### Required Headers

All API requests must include:

```
X-Organization-ID: your_organization_id
Content-Type: application/json
```

Authenticated endpoints also require:

```
Authorization: Bearer {jwt_token}
```

> The organization header is standardized as `X-Organization-ID` (uppercase ID) across all endpoints.

---

## Authentication Flow

Authentication consists of three main steps:

1. **Request Authentication Challenge**
2. **Sign Message**
3. **Verify Wallet Signature**

---

## API Reference

### 1. Request Authentication Challenge

Initiate authentication by requesting a unique challenge nonce.

**Endpoint:**
```
GET /auth/wallet/challenge?publicKey={public_key}
```

**Example Request:**
```
GET /auth/wallet/challenge?publicKey=0x742d35Cc6634C0532925a3b844Bc9e7595f2BD6
```

**Example Response:**
```json
{
  "nonce": "a1b2c3d4e5f6g7h8i9j0",
  "message": "Infinite Agents Authentication\n\nNonce: a1b2c3d4e5f6g7h8i9j0\nPublic Key: 0x742d35Cc6634C0532925a3b844Bc9e7595f2BD6",
  "domain": "infinite.ai",
  "expires_at": 1704112500,
  "expires_at_iso": "2024-01-01T12:05:00Z",
  "expires_in": 300
}
```

---

### 2. Verify Wallet Signature

Verify the signed message and receive a JWT token.

**Endpoint:**
```
POST /auth/wallet/verify
```

**Payload:**
```json
{
  "public_key": "0x742d35Cc6634C0532925a3b844Bc9e7595f2BD6",
  "signature": "0x1234567890abcdef...",
  "nonce": "a1b2c3d4e5f6g7h8i9j0",
  "platform": "web"
}
```

**Example Response:**
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
- `token_type`: Always “Bearer”
- `expires_in`: Token lifetime in seconds
- `user_id`: Unique identifier for the wallet user
- `session_id`: Unique identifier for session
- `platform`: Platform used for authentication
- `onboarded`: Indicates if wallet has completed onboarding (KYC)

---

### Message Format

The message to be signed must follow this format:

```
Infinite Agents Authentication

Nonce: {nonce}
Public Key: {publicKey}
```

> The blank line after “Authentication” is required. Any deviation causes verification to fail.

---

## Session Management

### List Active Sessions

**Endpoint:**
```
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

**Endpoint:**
```
POST /auth/wallet/logout
```

**Examples:**

- Logout current session:
  ```json
  {}
  ```
- Logout specific session:
  ```json
  { "session_id": "sess_xyz789ghi012" }
  ```
- Logout all sessions:
  ```json
  { "logout_all": true }
  ```

**Responses:**

- **200 OK:** Successfully logged out
- **400 Bad Request:** Invalid session ID
- **401 Unauthorized:** Not authenticated

> Logging out revokes the JWT token immediately.

---

## Customer Onboarding

### Create Customer Profile

**Endpoint:**
```
POST /customers
```

**Individual Example:**
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

**Business Example:**
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

**Response:**
```json
{
  "customer": {
    "id": "12345678-1234-1234-1234-123456789012",
    "type": "INDIVIDUAL",
    "status": "UNDER_REVIEW",
    "countryCode": "US",
    "createdAt": "2024-06-30T15:40:40.832827Z"
  },
  "schemaDocumentUploadUrls": null,
  "kycLinkUrl": "https://infinite.dev/kyc?session=kyc_sess_123&callbackUrl=edge%3A%2F%2Fcomplete",
  "usedPersonaKyc": true
}
```

**Benefits:**

- Simplified schema (no address, tax ID, or phone required)
- Automatic wallet association
- No document upload required
- Automatic KYC link generation

---

### Get KYC Link

**Endpoint:**
```
GET /customers/{customerId}/kyc-link?redirectUrl={url}
```

**Example Request:**
```
GET /customers/12345678-1234-1234-1234-123456789012/kyc-link?redirectUrl=https://app.example.com/kyc-complete
```

**Example Response:**
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

1. Customer is created with basic info.
2. Get KYC link with redirect URL.
3. Customer completes KYC at Infinite-owned URL.
4. Customer is redirected back to your app.
5. KYC status is automatically updated.

---

## Account Management

### Add Bank Account

**Endpoint:**
```
POST /accounts
```

**Example Request:**
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

**Example Response:**
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

> Wallet addresses are used directly in transfers; only bank accounts require registration.

---

## Quotes

### Create Quote

**Endpoint:**
```
POST /v2/quotes
```

**On-Ramp Example (USD → USDC):**
```json
{
  "flow": "ONRAMP",
  "source": { "asset": "USD", "amount": 1000.0 },
  "target": { "asset": "USDC", "network": "ethereum" }
}
```

**On-Ramp Response:**
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

**Off-Ramp Example (USDC → USD):**
```json
{
  "flow": "OFFRAMP",
  "source": { "asset": "USDC", "network": "ethereum", "amount": 1000.0 },
  "target": { "asset": "USD" }
}
```

**Off-Ramp Response:**
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

> Quotes expire at `expiresAt`. Execute transfers before expiration to guarantee the rate.

---

## Transfers

### Execute Transfer

**Endpoint:**
```
POST /transfers
```

**On-Ramp Example (Bank → Crypto):**
```json
{
  "type": "ONRAMP",
  "quoteId": "quote_xyz123abc456def789",
  "source": { "accountId": "acct_bank_xyz789abc123def456" },
  "destination": { "address": "0x742d35cc6ab26c82c3b8c85c8a7e3c7b1234567890", "asset": "USDC", "network": "ethereum" },
  "autoExecute": true
}
```

**On-Ramp Response:**
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

**Off-Ramp Example (Crypto → Bank):**
```json
{
  "type": "OFFRAMP",
  "quoteId": "quote_abc456def789xyz123",
  "source": { "address": "0x742d35cc6ab26c82c3b8c85c8a7e3c7b1234567890", "asset": "USDC", "amount": 1000.0, "network": "ethereum" },
  "destination": { "accountId": "acct_bank_xyz789abc123def456" },
  "autoExecute": true
}
```

**Off-Ramp Response:**
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

**Endpoint:**
```
GET /transfers/{transferId}
```

**Example Request:**
```
GET /transfers/transfer_onramp_abc123
```

**Example Response:**
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
| `awaiting_funds`   | On-Ramp: Waiting for ACH payment from customer’s bank  |
| `awaiting_crypto`  | Off-Ramp: Waiting for crypto deposit to our address    |
| `payment_received` | Bank payment received and verified                     |
| `fiat_to_crypto`   | Converting USD to cryptocurrency                       |
| `crypto_to_fiat`   | Converting cryptocurrency to USD                       |
| `blockchain_pending` | Transaction submitted, awaiting confirmation         |
| `completed`        | Transfer successfully completed                        |

**Transaction Hash:** Used to track the transfer on Etherscan or other blockchain explorers.

---

## Organization ID Management

All API requests (except authentication) require an Organization ID.

**Required Header:**
```
X-Organization-ID: your_organization_id
```

**Example Request:**
```
GET /customer/cust_abc123def456ghi789/kyc-status
Authorization: Bearer {access_token}
X-Organization-ID: org_edge_wallet_main
Content-Type: application/json
```

For Edge Wallet, use `org_edge_wallet_main` as the organization ID.

---

## Error Handling

### Error Response Format

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
| `INVALID_PUBLIC_KEY`    | 400         | Invalid wallet public key format         | Verify public key format                   |
| `CHALLENGE_EXPIRED`     | 400         | Challenge nonce expired                  | Request a new challenge                    |
| `INVALID_SIGNATURE`     | 400         | Signature verification failed            | Check message format and signing method    |
| `NONCE_ALREADY_USED`    | 400         | Invalid or expired nonce                 | Request a new challenge                    |
| `UNAUTHORIZED`          | 401         | Missing or invalid token                 | Re-authenticate                            |
| `SESSION_EXPIRED`       | 401         | Authentication session expired           | Re-authenticate                            |
| `SESSION_NOT_FOUND`     | 404         | Session ID not found                     | Use valid session ID                       |
| `ORGANIZATION_NOT_FOUND`| 404         | Organization ID not found                | Check organization ID                      |
| `ORGANIZATION_NOT_ACTIVE`| 400        | Organization is not active               | Contact support                            |
| `WALLET_AUTH_DISABLED`  | 400         | Wallet authentication disabled           | Contact support to enable                  |
| `RATE_LIMITED`          | 429         | Too many requests                        | Wait and retry                             |
| `KYC_REQUIRED`          | 403         | KYC not completed                        | Complete KYC verification                  |
| `KYC_REJECTED`          | 403         | KYC verification failed                  | Contact support                            |
| `INVALID_QUOTE`         | 400         | Quote expired or invalid                 | Request new quote                          |
| `INSUFFICIENT_BALANCE`  | 400         | Not enough funds                         | Check account balance                      |
| `TRANSFER_FAILED`       | 400         | Transfer could not be processed          | Check transfer details                     |
| `ACCOUNT_NOT_VERIFIED`  | 400         | Bank account not verified                | Complete account verification              |

---

## Implementation Guide

### 1. Initialize Configuration

Store credentials securely in environment variables:

```
# .env file
INFINITE_API_URL=https://api.infinite.ai
INFINITE_ORG_ID=your_organization_id
```

### 2. Authentication Flow

1. **Request Challenge:** Call `/auth/wallet/challenge` with the user’s wallet public key.
2. **Sign Message:** User signs the formatted message.
3. **Verify Signature:** Submit signature to `/auth/wallet/verify`.
4. **Store Token:** Save JWT token securely (httpOnly, secure cookies recommended).

### 3. Making Authenticated Requests

Include JWT token in all authenticated API calls:

```
GET /customers/{customerId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-Organization-ID: your_organization_id
```

---

## Security Best Practices

### Challenge Handling

- Request a new challenge for each authentication attempt.
- Never reuse challenges; each nonce is single-use.
- Challenges expire after 5 minutes.
- Validate challenge response before signing.

### Token Management

- Store tokens securely using platform-specific encrypted storage.
- Check token expiration before API calls.
- Clear tokens on logout and app termination.
- Never log or expose tokens.
- Monitor active sessions regularly.

### Session Security

- Review active sessions via `/auth/wallet/sessions`.
- Logout unused sessions.
- Implement session timeout handling.
- Store session IDs securely.

### Network Security

- Always use HTTPS.
- Validate SSL certificates.
- Include proper User-Agent headers.

> Advanced security features (device fingerprinting, certificate pinning, automatic token refresh) are planned for future releases.

### Error Handling

- Don’t expose sensitive info in error messages.
- Log errors securely (no tokens or signatures).
- Implement proper error recovery.
- Handle rate limiting with exponential backoff.

### Organization Context

- Verify organization ID matches expected value.
- Store organization ID securely.
- Validate wallet auth enabled before authentication.

---

## Performance Optimization

### Caching

- Cache user wallet list for quick access.
- Implement smart token refresh.

### Request Optimization

- Batch API calls where possible.
- Implement exponential backoff for retries.
- Use connection pooling.

**Common causes and solutions:**

- **Message format:** Ensure exact match, including blank line.
- **Public key case:** Normalize checksummed keys to lowercase.
- **Encoding:** Use UTF-8 for messages.
- **Signature format:** Must be hex string with 0x prefix.

---

## Troubleshooting

### 401 Unauthorized Errors

Check in order:

1. Token included in Authorization header with “Bearer ” prefix.
2. Token hasn’t expired (`expires_in` field).
3. All required headers are present.
4. Token belongs to the correct organization.

### Challenge Expiry

- Challenges expire after 5 minutes.
- Complete signing flow within this timeframe.
- Consider pre-warming wallet connection.
- Use loading states to set user expectations.

---

## Support

For additional assistance, refer to the official documentation or contact support.
