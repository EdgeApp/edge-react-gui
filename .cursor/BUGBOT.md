# Bugbot Review Rules

## Error Handling

### Preserve Stack Traces (`preserve-stack-traces`)

Avoid shorthand `.catch(showError)` since it loses the calling site from stack
traces.

```ts
// Bad:
doSomething().catch(showError)

// Good:
doSomething().catch((error: unknown) => showError(error))
```

### Avoid `@ts-expect-error` (`avoid-ts-expect-error`)

Do not suppress type errors when a trivial fix exists (use `?? []`, `?? {}`, or
an explicit type).

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

Use `!== undefined` when `null` has meaning (ex: "delete this field").

```ts
// Bad (treats null + undefined the same):
const changed = value != null

// Good:
const changed = value !== undefined
```

### Always Await Async (`always-await-async`)

Await async work to ensure spinners, double-tap prevention, and sequencing.

```ts
// Bad:
wallet.saveTxMetadata(params).catch((error: unknown) => showError(error))

// Good:
await wallet.saveTxMetadata(params)
```

### No Redundant Catch (`no-redundant-catch`)

If the caller already handles errors, do not add a local `.catch()`.

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

If `tokenId` is a non-null string, never silently fallback to `null` (it changes
meaning from "this token" to "native currency").

```ts
// Bad:
const spendTokenId = tokenId ?? null

// Good:
if (tokenId == null) throw new Error('Missing tokenId')
const spendTokenId = tokenId
```

### No Redundant Error Handling (`no-redundant-error-handling`)

If a global handler already shows errors, avoid local `.catch(showError)` to
prevent double reporting.

```ts
// Bad (double-report):
await doThing().catch((error: unknown) => showError(error))

// Good:
await doThing()
```

### Handle User Cancellation (`handle-user-cancellation`)

User cancellations should exit silently.

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

Avoid replacing unknown errors with a generic message; rethrow unexpected ones.

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

Verify arrays have elements before indexing.

```ts
// Bad:
useAddress(vin.addresses[0])

// Good:
if (vin.addresses.length === 0) return
useAddress(vin.addresses[0])
```

### Compare Same Types (`compare-same-types`)

Do not compare tokenIds to currency codes; use the correct identifier.

```ts
// Bad:
const isSpecial = SPECIAL_TOKEN_IDS.includes(request.fromCurrencyCode)

// Good:
const isSpecial = SPECIAL_TOKEN_IDS.includes(request.fromTokenId)
```

### Lookup Table Defensive Access (`lookup-table-defensive-access`)

Use optional chaining for dynamic keys.

```ts
// Bad:
const ok = TABLE[pluginId].includes(tokenId)

// Good:
const ok = TABLE[pluginId]?.includes(tokenId) ?? false
```

### Consolidate Guard Clauses (`consolidate-guard-clauses`)

If validation applies to all branches, do it once at function entry.

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

Prefer `useHandler` (from `hooks/useHandler`) for event handlers.

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

Combine effects that update related state to avoid redundant renders.

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

Extract complex display logic into helpers with early returns.

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

Prefer `StyleSheet.compose(baseStyle, customStyle)`.

```ts
// Bad:
const style = [styles.base, maybeStyle]

// Good:
const style = StyleSheet.compose(styles.base, maybeStyle)
```

### Platform Keyboard Return Key (`platform-keyboard`)

iOS number pad does not support some `returnKeyType` values.

```tsx
<TextInput
  keyboardType="number-pad"
  returnKeyType={Platform.OS === 'ios' ? undefined : 'done'}
/>
```

### Preserve Props When Replacing Components (`preserve-props-replacement`)

When replacing a component/icon, carry over `color`, `size`, and `style`.

```tsx
// Bad:
<NewIcon />

// Good:
<NewIcon color={color} size={size} style={style} />
```

### Maintain Styling When Switching Icons (`maintain-styling-icon-switch`)

If the replacement icon does not accept the same style props, preserve spacing
with a wrapper.

```tsx
// Good:
<View style={styles.iconSpacing}>
  <NewIcon color={color} size={size} />
</View>
```

### Wrap Navigation After Gestures (`interactionmanager-nav`)

After complex gestures, navigate with `InteractionManager.runAfterInteractions()`.

```ts
InteractionManager.runAfterInteractions(() => {
  navigation.push('NextScreen')
})
```

### Disable UI During Async (`disable-ui-async`)

Use a `pending` flag to prevent double taps and show feedback.

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

Do not mirror Redux state via `useState(reduxValue)`.

```ts
// Bad:
const reduxValue = useSelector(selectValue)
const [value] = useState(reduxValue)

// Good:
const value = useSelector(selectValue)
```

### Avoid Module-Level Cache Bugs (`module-level-cache-bugs`)

Module-level caches must reset on logout/login.

```ts
let cached: Thing | undefined

export function clearThingCache(): void {
  cached = undefined
}
```

### Settings Belong in Redux (`settings-in-redux`)

Account-global settings should live in Redux, not ad-hoc module caches.

```ts
// Good:
dispatch(settingsActions.setFoo(value))
```

### Use DataStore API (`datastore-api`)

Prefer `account.dataStore` over `account.localDisklet`.

```ts
// Bad:
await account.localDisklet.setText('settings.json', text)

// Good:
await account.dataStore.setItem('settings', text)
```

### Include Data Format Migrations (`data-format-migrations`)

When changing storage format, migrate old data.

```ts
const old = await account.dataStore.getItem('settings-v1')
if (old != null) {
  const migrated = migrateV1ToV2(old)
  await account.dataStore.setItem('settings-v2', migrated)
  await account.dataStore.removeItem('settings-v1')
}
```

### Merge Nested State Objects (`merge-state-objects`)

Do not overwrite sibling keys.

```ts
// Bad:
settings.notifState = newNotifState

// Good:
settings.notifState = { ...settings.notifState, ...newNotifState }
```

## Async & Concurrency

### Use `makePeriodicTask` (`makePeriodicTask`)

Prefer `makePeriodicTask` over `setInterval`.

```ts
const task = makePeriodicTask(async () => {
  await refresh()
}, 30_000)
```

### Background Services Location (`background-services-location`)

Background services live in `components/services/` as mounted React components.

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

Avoid duplicate parallel calls from button presses/retries.

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

When polling is cancellable, check cancel flags after every `await`.

```ts
while (!cancelled) {
  const result = await fetchStuff()
  if (cancelled) return
  onResult(result)
}
```

### Refresh State in Delayed Callbacks (`refresh-state-callbacks`)

Read state inside the callback to avoid stale closures.

```ts
setTimeout(() => {
  const latest = store.getState().someSlice
  void doThing(latest)
}, 1000)
```

### Cleanup Timeouts on Shutdown (`cleanup-timeouts-shutdown`)

Track timeout ids and clear them in shutdown.

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

Serialize async handlers touching shared resources.

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

Clean network + disk inputs before use.

```ts
// Good:
const cleaned = asMyType(raw)
```

### Derive Types From Cleaners (`derive-types-from-cleaners`)

Use `ReturnType<typeof asCleaner>`.

```ts
export type MyType = ReturnType<typeof asMyType>
```

### `asOptional` Also Accepts Null (`asoptional-handles-null`)

Preserve null vs undefined when it matters.

```ts
// Good:
const asField = asOptional(asEither(asNull, asString), null)
```

### New Persisted Fields Must Be Optional (`new-fields-optional`)

New persisted fields must be `asOptional` unless a migration exists.

```ts
// Good:
const asSettings = asObject({
  version: asNumber,
  newField: asOptional(asString)
})
```

### Remove Unused Cleaner Fields (`remove-unused-cleaner-fields`)

Avoid dead cleaner fields that add noise.

```ts
// Good: delete unused field, or comment why it remains
```

## Code Quality

### Delete Unnecessary Code (`delete-unnecessary-code`)

Remove unused vars, unreachable branches, commented blocks.

```ts
// Bad:
// TODO: maybe use later
// const unused = 123

// Good: delete it
```

### Put Parameters Inline (`put-parameters-inline`)

Inline pass-through variables unless they add type safety.

```ts
// Bad:
const x = 1
doThing(x)

// Good:
doThing(1)
```

### Use Existing Helpers (`use-existing-helpers`)

Search for existing project helpers before creating new ones.

```ts
// Good:
const tokenId = getTokenId(wallet, currencyCode)
```

### Avoid Duplicated Mocks (`avoid-duplicated-mocks`)

Prefer `src/util/fake/`.

```ts
// Good:
import { fakeWallet } from '../../util/fake/fakeWallet'
```

### No Hardcoded Debug URLs (`no-hardcoded-debug-urls`)

Guard debug URLs/flags with config or `__DEV__`.

```ts
// Bad:
const baseUrl = 'https://sandbox.example.com'

// Good:
const baseUrl = envConfig.apiUrl
```

### No Local Path Dependencies (`no-local-path-deps`)

Avoid `file:../` in `package.json`.

```json
// Bad:
{ "some-lib": "file:../some-lib" }
```

### Guard Debug Logging (`guard-debug-logging`)

No unguarded `console.log` in production code.

```ts
// Bad:
console.log('debug', value)

// Good:
if (ENV.DEBUG_VERBOSE_LOGGING) console.log('debug', value)
```

### Validation Single Source (`validation-single-source`)

Use one validator for realtime + submit.

```ts
const error = validateForm(values)
setError(error)
if (error != null) return
```

### Local Helpers for Amount Conversion (`local-helpers-amount-conversion`)

Prefer local helpers instead of expensive async wallet bridge calls.

```ts
// Good:
const display = div(nativeAmount, multiplier, 18)
```

### No Hand-Rolled Standard Ops (`no-hand-rolled-ops`)

Use established libraries for standard algorithms.

```ts
// Good:
import { base64 } from 'rfc4648'
```

### Keep Config Consistent (`keep-config-consistent`)

Avoid duplicated constants drifting.

```ts
// Good:
export const POLL_MS = 30_000
```

### Remove Unused Styles (`remove-unused-styles`)

Delete unused `StyleSheet.create` entries.

```ts
// Good: remove styles.unused if nothing references it
```

## Strings & Localization

### Reuse Existing Strings (`reuse-existing-strings`)

Search `en_US.json` before adding new keys.

```ts
// Good:
const text = sprintf(lstrings.get_started_button)
```

### Context-Based Key Names (`context-based-key-names`)

Keys describe meaning, not screen.

```text
Bad: signup_screen_get_started
Good: get_started_button
```

### Avoid "Tap to ..." (`avoid-tap-to-x`)

Prompts describe the action, not the gesture.

```text
Bad: Tap to select a country
Good: Select a country
```

### Localization Happens in the GUI Layer (`localization-gui-level`)

Plugins/API throw structured errors; GUI localizes messages.

```ts
// Good (plugin/API):
throw new NetworkError('CONNECTION_FAILED')

// Good (GUI):
showError(lstrings.connection_failed)
```

## Comments & Documentation

### Add Non-Obvious Constraints (`add-non-obvious-constraints`)

Document constraints that are not obvious.

```ts
// EVM-only: assumes EVM contract address format
```

### Remove Stale Comments (`remove-stale-comments`)

Delete comments that no longer match reality.

```ts
// Bad: comment says "only mainnet" but code supports testnet too
```

### Comments Explain Why, Not What (`comments-why-not-what`)

```ts
// Bad:
// Loop through items and filter by status

// Good:
// Only active items can be edited; archived items are read-only
```

## Server Conventions

Only applies to repos ending in `-server` or containing `pm2.json` at repo root.

### Server devDependencies (`server-devdependencies`)

```text
All deps go in devDependencies except cleaner packages.
```

### Separate Server/Client Config (`separate-configs`)

```text
Validate serverConfig.json and clientConfig.json with cleaners.
```

### PM2 Process Management (`pm2-process-management`)

```text
API in cluster mode; engines as single instances.
```

### Build Both Frontend/Backend (`build-both`)

```text
build script must build both (parallel ok).
```
