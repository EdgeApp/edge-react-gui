# Infinite ramp error — test-build debug handoff

> **TEST BUILD ONLY. Do not merge.** This branch adds temporary debug logging to
> surface the real Infinite (ramp) failure and to capture the minimal auth needed
> to reproduce it locally. It must never ship to production.

## What this build changes

1. **Surfaces the real failure (logs).** When any Infinite request returns a
   non-OK status, the app now logs the full failing request and response
   **unconditionally** (no longer gated behind `DEBUG_VERBOSE_LOGGING`):
   HTTP status, raw response body, request URL, method, request body, and the
   sanitized request headers.
2. **Shows the failure in-app.** The error surfaced in the UI now includes the
   HTTP status and the raw response body (previously it was just
   `HTTP error! status: <code>`), so the tester can screenshot the real detail.
3. **Captures the Infinite session auth for local repro (logs).** Alongside the
   failure, the app logs the data needed to replay the exact failing call from a
   local dev environment: `orgId`, `apiUrl`, the request URL/method/body, and the
   auth context (`token`, `customerId`, `sessionId`, wallet `publicKey`, and the
   `privateKeyHex` — the Infinite `INFINITE_PRIVATE_KEY`).

Scope is tight: only the Infinite request/response and the Infinite session auth
are captured. No Edge seed, no wallet private keys for other currencies, and no
other plugin secrets are touched.

## Files touched

- `src/plugins/ramps/infinite/utils/infiniteDebugCapture.ts` — new, all debug logic.
- `src/plugins/ramps/infinite/infiniteApi.ts` — `fetchInfinite` error path calls the logger and includes the raw body in thrown errors.
- `src/plugins/ramps/infinite/infiniteRampPlugin.ts` — feeds wallet key material to the logger.

## What the tester does

1. Install this test build.
2. Reproduce the failure: start a **Buy** with Infinite (the same fiat → crypto
   buy/quote flow that failed). The error appears when fetching the quote or
   when approving it (the `/v1/headless/quotes` call, or the auth/KYC/bank-account
   calls during approval).
3. **Screenshot the in-app error** — it now shows the HTTP status and the raw
   server response body.
4. **Copy the debug log.** Every relevant line is tagged `[INFINITE-DEBUG]`. In
   the device log (Console.app for iOS, `adb logcat` / `react-native log-*` for
   Android), search for `[INFINITE-DEBUG]` and copy every matching line. There
   are four:
   - `Infinite request FAILED …`
   - `request` (method, url, body, sanitized headers)
   - `response` (status, raw body)
   - `replay-auth` (orgId, apiUrl, token, customerId, sessionId, publicKey, privateKeyHex)

## ⚠️ Sensitivity

The `[INFINITE-DEBUG] replay-auth` line contains the **Bearer token and the
wallet private key** for the tester's Infinite session. Treat it like a password:
share it **only** with the Edge dev team, over a private channel. It never leaves
the device unless the tester copies it, and it is never committed to the repo.

## How to reproduce locally (dev team)

Using the captured `replay-auth` blob, replay the exact failing request:
`POST {apiUrl}{requestUrl}` with header `X-Organization-ID: {orgId}` and
`Authorization: Bearer {token}`, and the captured request body. If the token has
expired, re-derive it from `privateKeyHex` via the wallet challenge/verify flow
(`getChallenge` → `signChallenge` → `verifySignature`) using the captured
`publicKey`.

## Cleanup

Before this work could ever ship, revert the three files above (delete
`infiniteDebugCapture.ts` and undo the two call sites). The branch is intended to
stay unmerged.
