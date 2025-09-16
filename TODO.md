# TODO — Infinite Ramp Plugin Review (branch: sam/infinite-ramp-plugin)

- **KYC deeplink uses hardcoded buy direction**: In `src/plugins/ramps/infinite/workflows/kycWorkflow.ts`, `rampDeeplinkManager.register('buy', ...)` should register with the current quote direction to support sell flows.

- **Currencies fetched before auth (can 401)**: `infiniteRampPlugin` calls `getNormalizedCurrenciesWithCache()` which calls `getCurrencies()` before authentication. Per docs, `/v1/headless/currencies` requires auth. Authenticate first or handle 401 by authenticating then retrying. Files: `src/plugins/ramps/infinite/infiniteRampPlugin.ts`, `src/plugins/ramps/infinite/infiniteApi.ts`.

- **EIP-191 signature missing valid recovery (v) byte**: `signChallenge` constructs `v` using `signature.recovery`, which is likely undefined from the used API. Switch to a signing call that returns the recovery id and append a correct v (27/28) to the 64-byte signature. File: `src/plugins/ramps/infinite/infiniteApi.ts`.

- **Inline JSX handler in KYC form**: Replace the inline `onSubmitEditing={() => { handleSubmit().catch(showError) }}` with a `useHandler`-backed function. File: `src/plugins/gui/scenes/KycFormScene.tsx`.

- **Export style for scene**: Update `KycFormScene` export to `export const KycFormScene: React.FC<Props> = (props: Props) => { ... }` per workspace component-export rule. File: `src/plugins/gui/scenes/KycFormScene.tsx`.

- **Init options/environment**: Ensure Infinite `apiUrl` and `orgId` are set for production. Docs specify Edge’s Organization ID is `org_edge_wallet_main`. Files: `src/plugins/ramps/infinite/infiniteRampTypes.ts`, `src/envConfig.ts`.

- **Bank rail selection hardcoded**: In confirmation workflow, rails are forced to `wire` (buy) and `ach` (sell). Consider choosing based on supported rails for the user’s country/method. File: `src/plugins/ramps/infinite/workflows/confirmationWorkflow.ts`.

- **Polling timeouts**: KYC/TOS pending polling uses a 60s step-off threshold. Consider product-appropriate durations. Files: `src/plugins/ramps/infinite/workflows/kycWorkflow.ts`, `src/plugins/ramps/infinite/workflows/tosWorkflow.ts`.

## References

- `docs/infinite-headless-api.md` — Organization ID Management (Edge Wallet Integration: `org_edge_wallet_main`); Currencies endpoint requires auth; Transfers/Quotes specs.
- `src/plugins/ramps/infinite/infiniteRampPlugin.ts` — support checks, quotes, workflows.
- `src/plugins/ramps/infinite/infiniteApi.ts` — auth, quotes, KYC/TOS, accounts, signing.
- `src/plugins/ramps/infinite/workflows/*` — authenticate, kyc, tos, bank account, confirmation.
- `src/plugins/gui/scenes/KycFormScene.tsx` — KYC form component.

