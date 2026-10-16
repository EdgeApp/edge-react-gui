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

### Always Await Async (`always-await-async`)

Await async work to ensure spinners, double-tap prevention, and sequencing.

```ts
// Bad:
wallet.saveTxMetadata(params).catch((error: unknown) => showError(error))

// Good:
await wallet.saveTxMetadata(params)
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

## React & UI

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

### Refresh State in Delayed Callbacks (`refresh-state-callbacks`)

Read state inside the callback to avoid stale closures.

```ts
setTimeout(() => {
  const latest = store.getState().someSlice
  void doThing(latest)
}, 1000)
```

## Code Quality

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

## Strings & Localization

### Localization Happens in the GUI Layer (`localization-gui-level`)

Plugins/API throw structured errors; GUI localizes messages.

```ts
// Good (plugin/API):
throw new NetworkError('CONNECTION_FAILED')

// Good (GUI):
showError(lstrings.connection_failed)
```
