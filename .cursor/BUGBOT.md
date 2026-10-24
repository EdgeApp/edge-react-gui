# Bugbot Review Rules

<!-- Generated from review-standards.mdc by generate-bugbot.js (EdgeApp/edge-dev-agents, .cursor/rules/). Do not edit by hand: change the source or bugbot-overlay.md and regenerate. -->

## Error Handling

### Preserve Stack Traces (`preserve-stack-traces`)

Don't use shorthand `.catch(showError)`: it loses the calling file from stack traces.

```ts
// Bad:
doSomething().catch(showError)

// Good:
doSomething().catch((error: unknown) => showError(error))
```

### Avoid `@ts-expect-error` (`avoid-ts-expect-error`)

Don't double down on `@ts-expect-error` when trivial fixes exist. Use `?? []`, `?? {}`, or explicit type annotations instead of suppressing type errors.

```ts
// Bad:
// @ts-expect-error - cleaner can return undefined
items.map(renderItem)
```

```ts
// Good:
;(items ?? []).map(renderItem)
```

### Undefined vs Null Semantics (`undefined-vs-null-semantics`)

Use `!== undefined` when `null` has semantic meaning (like "delete this field"). `!= null` treats both the same.

```ts
// Bad (treats null + undefined the same):
const changed = value != null

// Good:
const changed = value !== undefined
```

### Always Await Async (`always-await-async`)

Always `await` async operations for proper spinners, double-click prevention, and race condition avoidance.

```ts
// Bad:
wallet.saveTxMetadata(params).catch((error: unknown) => showError(error))

// Good:
await wallet.saveTxMetadata(params)
```

### No Redundant Catch (`no-redundant-catch`)

When the whole function is async and the caller handles errors, don't add a separate `.catch()`.

```ts
// Bad:
const handle = async () => {
  await op().catch((error: unknown) => showError(error))
}

// Good:
const handle = async () => {
  await op()
}
```

### TokenId Must Not Fallback to Null (`tokenid-no-null-fallback`)

When `tokenId` is a non-null string, any dereference using it must succeed or throw. Never fall back to `null`: it silently changes the intended asset from "this specific token" to "native currency."

```ts
// Bad:
const spendTokenId = tokenId ?? null

// Good:
if (tokenId == null) throw new Error('Missing tokenId')
const spendTokenId = tokenId
```

### No Redundant Error Handling (`no-redundant-error-handling`)

When a global error handler (e.g., `withExtendedTouchable`) already catches and displays errors, don't add local `.catch(showError)`, because it causes errors to display twice. Only add explicit handling when you need specific error types, cleanup, or there's no global handler.

```ts
// Bad (double-report):
await doThing().catch((error: unknown) => showError(error))

// Good:
await doThing()
```

### Handle User Cancellation (`handle-user-cancellation`)

User cancellations (closing modals, pressing back) should exit silently, not show a generic error.

```ts
// Bad:
try {
  await showModal()
} catch (error) {
  showError(error)
}

// Good:
try {
  await showModal()
} catch (error) {
  if (error instanceof UserCancelledError) return
  showError(error)
}
```

### Do Not Mask Errors (`dont-mask-errors`)

Catch blocks should not always throw the same generic error. Only throw specific messages for expected errors (e.g., API 400); re-throw the original for unexpected ones so users see accurate messages.

```ts
// Bad:
catch (error) {
  throw new Error('Failed')
}

// Good:
catch (error) {
  if (isExpectedError(error)) throw new Error('Invalid request')
  throw error
}
```

### Check Array Bounds (`check-array-bounds`)

Verify arrays have elements before indexing. `vin.addresses[0]` is `undefined` when the array is empty. Check before passing to functions that can't handle undefined.

```ts
// Bad:
useAddress(vin.addresses[0])

// Good:
if (vin.addresses.length === 0) return
useAddress(vin.addresses[0])
```

### Compare Same Types (`compare-same-types`)

Don't compare tokenIds with currency codes: they are different identifier types that will never match. Use `request.fromTokenId` when checking against a list of tokenIds, not `request.fromCurrencyCode`.

```ts
// Bad:
const isSpecial = SPECIAL_TOKEN_IDS.includes(request.fromCurrencyCode)

// Good:
const isSpecial = SPECIAL_TOKEN_IDS.includes(request.fromTokenId)
```

### Lookup Table Defensive Access (`lookup-table-defensive-access`)

Use optional chaining on lookup tables with dynamic keys.

```ts
// Bad:
const ok = TABLE[pluginId].includes(tokenId)

// Good:
const ok = TABLE[pluginId]?.includes(tokenId) ?? false
```

### Consolidate Guard Clauses (`consolidate-guard-clauses`)

If a validation applies to all code paths, perform it once at function entry rather than repeating in each branch.

```ts
// Bad:
if (mode === 'a') {
  if (!id) return
  doA(id)
} else {
  if (!id) return
  doB(id)
}

// Good:
if (!id) return
if (mode === 'a') doA(id)
else doB(id)
```

## React & UI

### Prefer `useHandler` Over `useCallback` (`useHandler-over-useCallback`)

Prefer `useHandler` (from `hooks/useHandler`) over `useCallback` for event handlers and async functions. Provides better TypeScript inference and handles async more gracefully.

```ts
// Bad:
const onPress = useCallback(() => {
  void submit()
}, [submit])

// Good:
const onPress = useHandler(() => {
  void submit()
})
```

### Combine Related Effects (`combine-related-effects`)

If two `useEffect` hooks update related state from related dependencies, combine them into one effect to avoid redundant renders.

```ts
// Bad: two effects update the same derived state
useEffect(() => setLabel(getLabel(a)), [a])
useEffect(() => setLabel(getLabel(b)), [b])

// Good:
useEffect(() => {
  setLabel(getLabel(a, b))
}, [a, b])
```

### Extract Display Logic (`display-logic-extraction`)

Extract complex display logic to helper functions with early returns instead of nested ternaries or inline conditional chains.

```ts
// Bad:
const title = a ? (b ? 'A+B' : 'A') : b ? 'B' : 'None'

// Good:
function getTitle(a: boolean, b: boolean): string {
  if (a && b) return 'A+B'
  if (a) return 'A'
  if (b) return 'B'
  return 'None'
}
```

### Use `StyleSheet.compose` (`stylesheet-compose`)

Use `StyleSheet.compose(baseStyle, customStyle)` for style composition. It handles null automatically; no manual array handling needed.

```ts
// Bad:
const style = [styles.base, maybeStyle]

// Good:
const style = StyleSheet.compose(styles.base, maybeStyle)
```

### Platform Keyboard Return Key (`platform-keyboard`)

iOS number-pad keyboards don't support certain `returnKeyType` values ("Can't find keyplane" warning). Conditionally set: `returnKeyType={Platform.OS === 'ios' ? undefined : 'done'}`

```tsx
<TextInput
  keyboardType="number-pad"
  returnKeyType={Platform.OS === 'ios' ? undefined : 'done'}
/>
```

### Preserve Props When Replacing Components (`preserve-props-replacement`)

When replacing one component with another, ensure all props (color, size, style) are carried over. Check the original component's props before replacing; missing visual props change appearance.

```tsx
// Bad:
<NewIcon />

// Good:
<NewIcon color={color} size={size} style={style} />
```

### Maintain Styling When Switching Icons (`maintain-styling-icon-switch`)

When switching icon libraries, wrap replacement icons in a `View` with the original margin/padding styles if the new component doesn't accept the same style props.

```tsx
// Good:
<View style={styles.iconSpacing}>
  <NewIcon color={color} size={size} />
</View>
```

### Wrap Navigation After Gestures (`interactionmanager-nav`)

Wrap navigation calls (push, pop, replace) after complex gestures (slider completion, swipe) in `InteractionManager.runAfterInteractions()`. Navigating while the gesture system is active causes crashes on physical devices.

```ts
InteractionManager.runAfterInteractions(() => {
  navigation.push('NextScreen')
})
```

### Disable UI During Async (`disable-ui-async`)

Disable interactive elements during async operations to prevent double-taps and race conditions. Use a `pending` state and pass it to the component for visual feedback.

```ts
const [pending, setPending] = useState(false)

const onPress = useHandler(async () => {
  if (pending) return
  setPending(true)
  try {
    await submit()
  } finally {
    setPending(false)
  }
})
```

## State Management

### No Duplicate Redux State in Local State (`no-duplicate-redux-local`)

Don't track Redux state locally with `useState(reduxValue)`: it becomes stale when Redux updates. Read from `useSelector` directly.

```ts
// Bad:
const reduxValue = useSelector(selectValue)
const [value] = useState(reduxValue)

// Good:
const value = useSelector(selectValue)
```

### Avoid Module-Level Cache Bugs (`module-level-cache-bugs`)

Module-level cached state that doesn't reset on logout/login leaks data between users. Export a clear function and call it on logout. This is a recurring bug pattern. The clear function must reset **all** module-level singletons (including lazily-created connection/provider/resolver objects such as an ethers provider or an SDK client, not just user-data maps), since those accumulate internal state that outlives a session.

```ts
let cached: Thing | undefined

export function clearThingCache(): void {
  cached = undefined
}
```

### Settings Belong in Redux (`settings-in-redux`)

Local account settings belong in Redux, not separate module-level caches. Redux is the right place for globally-available account information.

```ts
// Good:
dispatch(settingsActions.setFoo(value))
```

### Use DataStore API (`datastore-api`)

Use `account.dataStore.setItem/getItem` instead of `account.localDisklet` directly. Disklet filenames are stored in plaintext, leaking information the server shouldn't see. DataStore encrypts filenames.

```ts
// Bad:
await account.localDisklet.setText('settings.json', text)

// Good:
await account.dataStore.setItem('settings', text)
```

### Include Data Format Migrations (`data-format-migrations`)

When changing storage formats, always include migration code: read old format, convert, write new format, delete old. Users have existing data on disk.

```ts
const old = await account.dataStore.getItem('settings-v1')
if (old != null) {
  const migrated = migrateV1ToV2(old)
  await account.dataStore.setItem('settings-v2', migrated)
  await account.dataStore.removeItem('settings-v1')
}
```

### Merge Nested State Objects (`merge-state-objects`)

When updating nested state objects in storage, merge with existing state to avoid overwriting concurrent updates from other parts of the app.

```ts
// Bad:
settings.notifState = newNotifState

// Good:
settings.notifState = { ...settings.notifState, ...newNotifState }
```

## Async & Concurrency

### Use `makePeriodicTask` (`makePeriodicTask`)

Always use `makePeriodicTask` instead of `setInterval`, especially for async work. Provides proper start/stop lifecycle and handles overlapping invocations.

```ts
const task = makePeriodicTask(async () => {
  await refresh()
}, 30_000)
```

### Background Services Location (`background-services-location`)

Background services go in `components/services/` as React components. Component-based mounting ensures clean lifecycle tied to login/logout. Avoid excessive background work; trigger only when needed.

```tsx
// Good: mount service for lifecycle
return (
  <>
    <SomeScreen />
    <MyBackgroundService />
  </>
)
```

### Prevent Concurrent Execution (`prevent-concurrent-execution`)

Use a `runOnce` helper or `pending` flag to prevent duplicate parallel calls when functions can be triggered multiple times (button presses, retries).

```ts
if (pending) return
setPending(true)
try {
  await doWork()
} finally {
  setPending(false)
}
```

### Polling Race Conditions (`polling-race-conditions`)

When implementing cancellable polling, check the cancel flag after every `await`, not just at loop start. The flag can change during any async gap.

```ts
while (!cancelled) {
  const result = await fetchStuff()
  if (cancelled) return
  onResult(result)
}
```

### Refresh State in Delayed Callbacks (`refresh-state-callbacks`)

In `setTimeout`/interval callbacks, read state fresh inside the callback. Closures capture stale values, especially in callbacks that fire much later.

```ts
setTimeout(() => {
  const latest = store.getState().someSlice
  void doThing(latest)
}, 1000)
```

### Cleanup Timeouts on Shutdown (`cleanup-timeouts-shutdown`)

Track `setTimeout` IDs in services/engines with a `Set` and clear them all in the shutdown method. Stale timeouts fire on cleared/deallocated state.

```ts
const timeouts = new Set<ReturnType<typeof setTimeout>>()

function addTimeout(id: ReturnType<typeof setTimeout>): void {
  timeouts.add(id)
}

function shutdown(): void {
  for (const id of timeouts) clearTimeout(id)
  timeouts.clear()
}
```

### Serialize Event Handlers (`serialize-event-handlers`)

When async event handlers operate on shared resources (files, git repos, databases), serialize operations per resource using a pending-operation map or queue. Fire-and-forget `.catch()` patterns cause race conditions on rapid events.

```ts
const pendingByRepo = new Map<string, Promise<void>>()

async function runSerialized(repoId: string, fn: () => Promise<void>) {
  const prev = pendingByRepo.get(repoId) ?? Promise.resolve()
  const next = prev.then(fn, fn)
  pendingByRepo.set(repoId, next)
  await next
}
```

## Data Validation (Cleaners)

### Clean All External Data (`clean-all-external-data`)

All network responses and disk reads must be cleaned with the cleaners library before use. Access cleaned values, not raw data.

```ts
// Good:
const cleaned = asMyType(raw)
```

### Derive Types From Cleaners (`derive-types-from-cleaners`)

Derive types from cleaners with `ReturnType<typeof asCleaner>`. Don't duplicate type definitions alongside cleaner definitions.

```ts
export type MyType = ReturnType<typeof asMyType>
```

### `asOptional` Also Accepts Null (`asoptional-handles-null`)

`asOptional` accepts both `undefined` AND `null` despite the name. To preserve the null/undefined distinction, use `asOptional(asEither(asNull, asString), null)` with a default.

```ts
// Good:
const asField = asOptional(asEither(asNull, asString), null)
```

### New Persisted Fields Must Be Optional (`new-fields-optional`)

New fields added to cleaners for persisted data MUST use `asOptional` unless migration code is included. Existing data on disk won't have the new field. Non-optional fields cause load failures.

```ts
// Good:
const asSettings = asObject({
  version: asNumber,
  newField: asOptional(asString)
})
```

### Remove Unused Cleaner Fields (`remove-unused-cleaner-fields`)

Remove or comment out unused fields in cleaners. Dead cleaner fields add noise and can mislead.

```ts
// Good: delete unused field, or comment why it remains
```

## Code Quality

### Delete Unnecessary Code (`delete-unnecessary-code`)

Don't leave dead or unused code "just in case." Git history preserves it. This includes unused variables, unreachable branches, and commented-out blocks.

```ts
// Bad:
// TODO: maybe use later
// const unused = 123

// Good: delete it
```

### Put Parameters Inline (`put-parameters-inline`)

Don't declare variables just to pass them to a function; inline the parameters. Exception: typed constants for functions with untyped/`any` parameters, where the constant provides compile-time checking.

```ts
// Bad:
const x = 1
doThing(x)

// Good:
doThing(1)
```

### Use Existing Helpers (`use-existing-helpers`)

Before creating a new utility, check for existing helpers: `getTokenId`/`getTokenIdForced` instead of `getWalletTokenId`, `getExchangeDenom` instead of custom multiplier lookups.

```ts
// Good:
const tokenId = getTokenId(wallet, currencyCode)
```

### Avoid Duplicated Mocks (`avoid-duplicated-mocks`)

Use existing mock data from `src/util/fake/` or consolidate new mocks there. Duplicated half-baked mock data breaks on core changes.

```ts
// Good:
import { fakeWallet } from '../../util/fake/fakeWallet'
```

### No Hardcoded Debug URLs (`no-hardcoded-debug-urls`)

Never commit hardcoded sandbox URLs or debug flags. Use environment configuration (`envConfig.*`, `__DEV__`).

```ts
// Bad:
const baseUrl = 'https://sandbox.example.com'

// Good:
const baseUrl = envConfig.apiUrl
```

### No Local Path Dependencies (`no-local-path-deps`)

Don't use local file paths (`file:../my-package`) in package.json dependencies. Breaks builds for other developers and CI.

```json
// Bad:
{ "some-lib": "file:../some-lib" }
```

### Guard Debug Logging (`guard-debug-logging`)

No unguarded `console.log` in production code. Guard with `ENV.DEBUG_VERBOSE_LOGGING` or remove entirely.

```ts
// Bad:
console.log('debug', value)

// Good:
if (ENV.DEBUG_VERBOSE_LOGGING) console.log('debug', value)
```

### Validation Single Source (`validation-single-source`)

Use a single validation function for both real-time and submit-time checks. Duplicated validation with different thresholds lets users submit invalid forms.

```ts
const error = validateForm(values)
setError(error)
if (error != null) return
```

### Local Helpers for Amount Conversion (`local-helpers-amount-conversion`)

Use local synchronous helpers (`div` from biggystring + `getExchangeDenom`) for amount conversions instead of async wallet API calls that cross an expensive bridge. Always specify decimal precision to avoid integer truncation: `div(native, multiplier, 18)` not `div(native, multiplier)`.

```ts
// Good:
const display = div(nativeAmount, multiplier, 18)
```

### No Hand-Rolled Standard Ops (`no-hand-rolled-ops`)

Use established libraries (e.g., `rfc4648` for base64) instead of hand-rolling standard algorithms. Hand-rolled implementations miss edge cases and add maintenance burden.

```ts
// Good:
import { base64 } from 'rfc4648'
```

### Keep Config Consistent (`keep-config-consistent`)

When a value appears in multiple configuration locations, ensure they match. Extract shared constants to prevent silent drift.

```ts
// Good:
export const POLL_MS = 30_000
```

### Remove Unused Styles (`remove-unused-styles`)

Delete style properties from `StyleSheet.create` that aren't referenced by any component. Unused styles add noise.

```ts
// Good: remove styles.unused if nothing references it
```

## Strings & Localization

### Reuse Existing Strings (`reuse-existing-strings`)

Search the localization file (`en_US.json`) before adding new keys. Don't create duplicates of existing strings.

```ts
// Good:
const text = sprintf(lstrings.get_started_button)
```

### Context-Based Key Names (`context-based-key-names`)

String keys describe semantic meaning, not UI location.

```text
Bad: signup_screen_get_started
Good: get_started_button
```

### Avoid "Tap to ..." (`avoid-tap-to-x`)

Prompts describe the action, not the gesture. Doesn't translate well across platforms.

```text
Bad: Tap to select a country
Good: Select a country
```

### Localization Happens in the GUI Layer (`localization-gui-level`)

Error messages and user-facing strings are localized in the GUI layer, not in API/plugin code. API layers throw structured errors (e.g., `NetworkError('CONNECTION_FAILED')`) that the GUI translates for display.

```ts
// Good (plugin/API):
throw new NetworkError('CONNECTION_FAILED')

// Good (GUI):
showError(lstrings.connection_failed)
```

## Comments & Documentation

### Add Non-Obvious Constraints (`add-non-obvious-constraints`)

Document constraints that aren't obvious from the code: `// EVM-only: assumes EVM contract address format`

```ts
// EVM-only: assumes EVM contract address format
```

### Remove Stale Comments (`remove-stale-comments`)

Remove comments when the context they describe has changed. Stale comments mislead more than missing comments.

```ts
// Bad: comment says "only mainnet" but code supports testnet too
```

### Comments Explain Why, Not What (`comments-why-not-what`)

Good comments explain reasoning, not mechanics.

```ts
// Bad:
// Loop through items and filter by status

// Good:
// Only active items can be edited; archived items are read-only
```

## Git Hygiene

### Commit Subjects Fit in 50 Characters (`commit-subject-50`)

Commit subjects are at most 50 characters, boundary inclusive (Edge convention; Paul enforces it in review on every repo). When reviewing a PR, check `git log` subjects of the branch commits and flag any over 50 with the measured length and a suggested shorter subject. Exempt: `fixup!`/`amend!`/`squash!` (squashed away; an `amend!` body's first line is the target's new subject and IS held to 50), `Revert "..."`, merge commits.

### No Attribution Trailers (`no-attribution-trailers`)

Commit messages never carry `Co-authored-by` or session-attribution trailers; flag any that appear.

## Server Conventions

Only applies to repositories with name ending in -server or containing pm2.json at root.

### Server devDependencies (`server-devdependencies`)

Place all dependencies in `devDependencies` except cleaner packages (which may be exported as types to NPM consumers).

```text
All deps go in devDependencies except cleaner packages.
```

### Separate Server/Client Config (`separate-configs`)

Server and client configuration in separate files (`serverConfig.json`, `clientConfig.json`), both validated with cleaners via `cleaner-config`. Prevents accidentally exposing server secrets to clients.

```text
Validate serverConfig.json and clientConfig.json with cleaners.
```

### PM2 Process Management (`pm2-process-management`)

Server processes use PM2 with `pm2.json` at repo root. API processes in cluster mode (`"instances": "max"`); engine processes as single instances to avoid duplicate background work.

```text
API in cluster mode; engines as single instances.
```

### Build Both Frontend/Backend (`build-both`)

When a server repo has both backend and frontend, the `build` script must build both. Use `npm-run-all -p build.*` to run in parallel.

```text
build script must build both (parallel ok).
```
