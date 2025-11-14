# Login Optimization Analysis

## Executive Summary

This document provides a detailed analysis of the optimization tasks outlined in `OPTIMIZE_LOGIN.md` to reduce the time required to execute `initializeAccount`. The analysis identifies the relevant code locations, implementation complexity, potential issues, and recommended implementation steps.

---

## Task 1: Do Not Write Defaults in readSyncedSettings

### Current Behavior

**Location:** `src/actions/SettingsActions.tsx:560-574`

```typescript
export async function readSyncedSettings(
  account: EdgeAccount
): Promise<SyncedAccountSettings> {
  try {
    if (account?.disklet?.getText == null) return SYNCED_ACCOUNT_DEFAULTS
    const text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
    const settingsFromFile = JSON.parse(text)
    return asSyncedAccountSettings(settingsFromFile)
  } catch (e: any) {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    await writeSyncedSettings(account, SYNCED_ACCOUNT_DEFAULTS)
    return SYNCED_ACCOUNT_DEFAULTS
  }
}
```

**Problem:** When `Settings.json` doesn't exist, the function writes `SYNCED_ACCOUNT_DEFAULTS` to disk (line 571). This causes unnecessary disk I/O during login, especially for new accounts.

**Default Values Location:** `src/actions/SettingsActions.tsx:451`
```typescript
export const SYNCED_ACCOUNT_DEFAULTS = asSyncedAccountSettings({})
```

The cleaner `asSyncedAccountSettings` (lines 422-446) provides all defaults via `asMaybe` with fallback values:
- `autoLogoutTimeInSeconds: asMaybe(asNumber, 3600)`
- `defaultFiat: asMaybe(asString, 'USD')`
- `walletsSort: asMaybe(asSortOption, 'manual')`
- `denominationSettings: asMaybe<DenominationSettings>(asDenominationSettings, () => ({}))`
- etc.

### Implementation Steps

1. **Modify `readSyncedSettings`** to return defaults without writing when file doesn't exist:
```typescript
export async function readSyncedSettings(
  account: EdgeAccount
): Promise<SyncedAccountSettings> {
  try {
    if (account?.disklet?.getText == null) return SYNCED_ACCOUNT_DEFAULTS
    const text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
    const settingsFromFile = JSON.parse(text)
    return asSyncedAccountSettings(settingsFromFile)
  } catch (e: any) {
    // If Settings.json doesn't exist yet, just return defaults
    // File will be created when settings are actually changed
    return SYNCED_ACCOUNT_DEFAULTS
  }
}
```

2. **Audit all write operations** to ensure they properly handle the case where no file exists:
   - `writeAutoLogoutTimeInSeconds` (line 456)
   - `writeDefaultFiatSetting` (line 466)
   - `writePreferredSwapPluginId` (line 480)
   - `writePreferredSwapPluginType` (line 494)
   - `writeMostRecentWalletsSelected` (line 508)
   - `writeWalletsSort` (line 518)
   - `writePasswordRecoveryReminders` (line 528)
   - `writeDenominationKeySetting` (line 542)

All these functions call `readSyncedSettings` first, then `writeSyncedSettings`, so they should work correctly even if file doesn't exist initially.

3. **Similar optimization needed for Local Settings:**

**Location:** `src/actions/LocalSettingsActions.ts:261-275`

```typescript
export const readLocalAccountSettings = async (
  account: EdgeAccount
): Promise<LocalAccountSettings> => {
  try {
    const text = await account.localDisklet.getText(LOCAL_SETTINGS_FILENAME)
    const json = JSON.parse(text)
    const settings = asLocalAccountSettings(json)
    emitAccountSettings(settings)
    readSettingsFromDisk = true
    return settings
  } catch (e) {
    const defaults = asLocalAccountSettings({})
    return await writeLocalAccountSettings(account, defaults)  // ← Remove this write
  }
}
```

Should be changed to:
```typescript
  } catch (e) {
    const defaults = asLocalAccountSettings({})
    emitAccountSettings(defaults)
    return defaults
  }
```

### Complexity: **LOW**
### Performance Impact: **MEDIUM** (eliminates 2 disk writes on login)

---

## Task 2: Remove Default Currency Denomination Values from Settings File

### Current Behavior

Denomination defaults are created in **TWO** locations:

#### Location 1: Settings Reducer on LOGIN
**File:** `src/reducers/scenes/SettingsReducer.ts:55-75`

```typescript
case 'LOGIN': {
  const { account, walletSort } = action.data

  // Setup default denominations for settings based on currencyInfo
  const newState = { ...state, walletSort }
  for (const pluginId of Object.keys(account.currencyConfig)) {
    const { currencyInfo } = account.currencyConfig[pluginId]
    const { currencyCode } = currencyInfo
    if (newState.denominationSettings[pluginId] == null)
      state.denominationSettings[pluginId] = {}
    // @ts-expect-error - this is because laziness
    newState.denominationSettings[pluginId][currencyCode] ??=
      currencyInfo.denominations[0]
    for (const token of currencyInfo.metaTokens ?? []) {
      const tokenCode = token.currencyCode
      // @ts-expect-error - this is because laziness
      newState.denominationSettings[pluginId][tokenCode] =
        token.denominations[0]
    }
  }
  return newState
}
```

**Problem:** This loops through **ALL currency plugins and ALL their tokens** to populate denomination defaults in Redux state on every login. This is expensive.

#### Location 2: initializeAccount Denomination Merging
**File:** `src/actions/LoginActions.tsx:289-307`

```typescript
const defaultDenominationSettings = state.ui.settings.denominationSettings
const syncedDenominationSettings =
  syncedSettings?.denominationSettings ?? {}
const mergedDenominationSettings = {}

for (const plugin of Object.keys(defaultDenominationSettings)) {
  // @ts-expect-error
  mergedDenominationSettings[plugin] = {}
  // @ts-expect-error
  for (const code of Object.keys(defaultDenominationSettings[plugin])) {
    // @ts-expect-error
    mergedDenominationSettings[plugin][code] = {
      // @ts-expect-error
      ...defaultDenominationSettings[plugin][code],
      ...(syncedDenominationSettings?.[plugin]?.[code] ?? {})
    }
  }
}
accountInitObject.denominationSettings = { ...mergedDenominationSettings }
```

**Problem:** This merges all default denominations with synced denominations, creating a massive object that includes values for all currencies/tokens, most of which are defaults.

### How Denominations Are Read

**File:** `src/selectors/DenominationSelectors.ts:29-49`

```typescript
export const selectDisplayDenom = (
  state: RootState,
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): EdgeDenomination => {
  const exchangeDenomination = getExchangeDenom(currencyConfig, tokenId)

  let { currencyCode } = currencyConfig.currencyInfo
  if (tokenId != null) {
    const token = currencyConfig.allTokens[tokenId]
    if (token == null) return exchangeDenomination
    currencyCode = token.currencyCode
  }

  const { pluginId } = currencyConfig.currencyInfo
  const pluginSettings = state.ui.settings.denominationSettings[pluginId]
  if (pluginSettings?.[currencyCode] != null) {
    return pluginSettings[currencyCode] ?? emptyEdgeDenomination
  }
  return exchangeDenomination
}
```

**Good news:** The selector already has fallback logic! If denomination isn't in settings, it returns `exchangeDenomination` from the `currencyConfig`, which provides the default.

### Implementation Steps

1. **Remove default population from Settings Reducer:**

Remove lines 55-75 from `src/reducers/scenes/SettingsReducer.ts`. The LOGIN case should only set `walletSort`:

```typescript
case 'LOGIN': {
  const { account, walletSort } = action.data
  return { ...state, walletsSort: walletSort }
}
```

2. **Simplify denomination merging in initializeAccount:**

Replace lines 289-307 in `src/actions/LoginActions.tsx`:

```typescript
// Only include synced denomination settings (user customizations)
accountInitObject.denominationSettings =
  syncedSettings?.denominationSettings ?? {}
```

3. **Add optimization flag to SyncedAccountSettings:**

First, add a new field to track whether the denomination cleanup has been performed.

**Location:** `src/actions/SettingsActions.tsx:422-446` (in the `asSyncedAccountSettings` cleaner)

Add this field:
```typescript
export const asSyncedAccountSettings = asObject({
  autoLogoutTimeInSeconds: asMaybe(asNumber, 3600),
  defaultFiat: asMaybe(asString, 'USD'),
  defaultIsoFiat: asMaybe(asString, 'iso:USD'),
  preferredSwapPluginId: asMaybe(asString),
  preferredSwapPluginType: asMaybe(asSwapPluginType),
  countryCode: asMaybe(asString, ''),
  stateProvinceCode: asMaybe(asString),
  rampLastFiatCurrencyCode: asMaybe(asString),
  rampLastCryptoSelection: asMaybe(asRampLastCryptoSelection),
  mostRecentWallets: asMaybe(asArray(asMostRecentWallet), () => []),
  passwordRecoveryRemindersShown: asMaybe(asPasswordReminderLevels, () =>
    asPasswordReminderLevels({})
  ),
  walletsSort: asMaybe(asSortOption, 'manual'),
  denominationSettings: asMaybe<DenominationSettings>(
    asDenominationSettings,
    () => ({})
  ),
  denominationSettingsOptimized: asMaybe(asBoolean, false),  // ← NEW FIELD
  securityCheckedWallets: asMaybe<SecurityCheckedWallets>(
    asSecurityCheckedWallets,
    () => ({})
  ),
  userPausedWallets: asMaybe(asArray(asString), () => [])
})
```

4. **Clean up existing settings files (one-time migration):**

Create a migration function that:
- Checks if optimization has already been performed
- Reads current settings
- Compares each denomination to the default from `currencyInfo.denominations[0]`
- Removes any that match the default
- Sets the optimization flag
- Writes back only non-default values

**Location for cleanup:** Could be added to `initializeAccount` as a one-time migration:

```typescript
// One-time cleanup of denomination settings
const { denominationSettings, denominationSettingsOptimized } = syncedSettings

// Only run cleanup once
if (!denominationSettingsOptimized &&
    denominationSettings != null &&
    Object.keys(denominationSettings).length > 0) {
  let needsCleanup = false
  const cleanedSettings: DenominationSettings = {}

  for (const pluginId of Object.keys(denominationSettings)) {
    const currencyConfig = account.currencyConfig[pluginId]
    if (currencyConfig == null) continue

    const { currencyInfo } = currencyConfig
    cleanedSettings[pluginId] = {}

    for (const currencyCode of Object.keys(denominationSettings[pluginId])) {
      const savedDenom = denominationSettings[pluginId][currencyCode]

      // Check if this matches the default
      const isMainCurrency = currencyCode === currencyInfo.currencyCode
      const defaultDenom = isMainCurrency
        ? currencyInfo.denominations[0]
        : currencyInfo.metaTokens?.find(t => t.currencyCode === currencyCode)?.denominations[0]

      // Only keep if different from default
      if (defaultDenom == null ||
          savedDenom.multiplier !== defaultDenom.multiplier ||
          savedDenom.name !== defaultDenom.name) {
        cleanedSettings[pluginId][currencyCode] = savedDenom
      } else {
        needsCleanup = true
      }
    }

    // Remove empty plugin entries
    if (Object.keys(cleanedSettings[pluginId]).length === 0) {
      delete cleanedSettings[pluginId]
    }
  }

  // Always set the flag, even if no cleanup was needed
  await writeSyncedSettings(account, {
    ...syncedSettings,
    denominationSettings: cleanedSettings,
    denominationSettingsOptimized: true  // ← Set flag to prevent re-running
  })

  if (needsCleanup) {
    console.log('Denomination settings cleaned up - removed default values')
  }
} else if (!denominationSettingsOptimized) {
  // No denominations to clean, but set the flag anyway
  await writeSyncedSettings(account, {
    ...syncedSettings,
    denominationSettingsOptimized: true
  })
}
```

5. **Update all write operations** to ensure they work with sparse denomination settings:

The function `writeDenominationKeySetting` (line 542 in SettingsActions.tsx) already handles this correctly - it only writes when user explicitly changes a denomination.

6. **Test all denomination display locations:**
   - Wallet list
   - Transaction history
   - Send/Receive screens
   - Currency settings scene
   - Exchange/Swap screens

### Potential Issues

**⚠️ IMPORTANT:** The initial Redux state setup in `SettingsReducer` (lines 15-24) initializes `denominationSettings` as `{}`. The LOGIN action currently populates it with all defaults. After this change:

- Redux `state.ui.settings.denominationSettings` will only contain user-customized values
- Selectors like `selectDisplayDenom` already handle missing values by falling back to `currencyConfig`
- Any code that directly accesses `state.ui.settings.denominationSettings[pluginId][code]` needs to handle undefined

**Code audit needed:** Search for direct access patterns like:
```typescript
state.ui.settings.denominationSettings[pluginId][currencyCode]
```

These should use the selector or add fallback logic.

### Complexity: **MEDIUM-HIGH**
### Performance Impact: **HIGH** (eliminates looping through all currencies/tokens on login + reduces settings file size significantly)

---

## Task 3: Remove scamWarningModal from initializeAccount

### Current Behavior

**Location:** `src/actions/LoginActions.tsx:236`

```typescript
// Show the scam warning modal if needed
if (await showScamWarningModal('firstLogin')) hideSurvey = true
```

**Implementation:** `src/actions/ScamWarningActions.tsx:90-106`

```typescript
export const showScamWarningModal = async (
  scamWarningInfoKey: keyof ScamWarningInfo
): Promise<boolean> => {
  // All logic is commented out
  return false
}
```

**Finding:** The function is **already disabled** - it just returns `false`. The entire implementation is commented out (lines 93-103).

### Implementation Steps

1. **Remove the call from initializeAccount:**

Delete line 236 from `src/actions/LoginActions.tsx`:
```typescript
// Show the scam warning modal if needed
if (await showScamWarningModal('firstLogin')) hideSurvey = true
```

2. **Remove unused import:**

Line 49 can be removed:
```typescript
import { showScamWarningModal } from './ScamWarningActions'
```

3. **Optional: Clean up ScamWarningActions.tsx:**

The file has a lot of commented-out code related to scam warning modals. Consider:
- Removing the commented code blocks
- Removing unused types and imports
- Keeping `showSendScamWarningModal` which is still used

**Other usages of `showScamWarningModal`:**
```
src/components/scenes/WcConnectionsScene.tsx:129: await showScamWarningModal('firstWalletConnect')
src/actions/WalletListMenuActions.tsx:212: await showScamWarningModal('firstPrivateKeyView')
src/actions/WalletListMenuActions.tsx:287: await showScamWarningModal('firstPrivateKeyView')
```

All of these also just call a disabled function that returns false. Consider removing all calls.

### Complexity: **LOW**
### Performance Impact: **LOW** (function already returns false immediately, but removes async call overhead)

---

## Task 4: Remove Biometric/TouchID Calls from initializeAccount

### Current Behavior

**Location:** `src/actions/LoginActions.tsx:262-263, 316-318`

```typescript
// Lines 262-263: During accountInitObject setup
let accountInitObject: AccountInitPayload = {
  ...initialState,
  account,
  currencyCode: '',
  pinLoginEnabled: false,
  isTouchEnabled: await isTouchEnabled(account),           // ← BLOCKING CALL
  isTouchSupported: (await getSupportedBiometryType()) !== false,  // ← BLOCKING CALL
  walletId: '',
  walletsSort: 'manual'
}

// Line 316-318: After account init
refreshTouchId(account).catch(() => {
  // We have always failed silently here
})
```

**Imports:** Lines 3-7
```typescript
import {
  getSupportedBiometryType,
  hasSecurityAlerts,
  isTouchEnabled,
  refreshTouchId,
  showNotificationPermissionReminder
} from 'edge-login-ui-rn'
```

### Where Values Are Used

**Settings Reducer:** `src/reducers/scenes/SettingsReducer.ts:88-89, 113-114`
```typescript
case 'ACCOUNT_INIT_COMPLETE': {
  const {
    // ... other fields
    isTouchEnabled,
    isTouchSupported,
    // ...
  } = action.data
  const newState: SettingsState = {
    ...state,
    // ... other fields
    isTouchEnabled,
    isTouchSupported,
    // ...
  }
  return newState
}
```

**Settings Scene:** `src/components/scenes/SettingsScene.tsx:80, 360-374`

```typescript
// Line 80: Reading from state
const touchIdEnabled = useSelector(state => state.ui.settings.isTouchEnabled)

// Lines 358-375: Loading biometry type for UI display
const loadBiometryType = async (account: EdgeAccount) => {
  const biometryType = await getSupportedBiometryType()
  if (biometryType === 'FaceID') {
    setTouchIdText(lstrings.settings_button_use_faceid)
  } else if (biometryType === 'TouchID') {
    setTouchIdText(lstrings.settings_button_use_touchid)
  } else if (biometryType === 'Fingerprint') {
    setTouchIdText(lstrings.settings_button_use_touchid)
  } else {
    setTouchIdText(lstrings.settings_button_use_biometric)
  }
}

// Lines 387-393: Called on mount only if supported
React.useEffect(() => {
  if (!supportsTouchId) return

  loadBiometryType().catch(error => {
    showError(error)
  })
  // ...
}, [context, supportsTouchId])
```

**Settings Scene State:** `src/reducers/scenes/SettingsReducer.ts:19-20, 30-31`
```typescript
export const initialState: SettingsState = {
  // ...
  isTouchEnabled: false,
  isTouchSupported: false,
  // ...
}

export interface SettingsState
  extends LocalAccountSettings,
    SyncedAccountSettings {
  changesLocked: boolean
  isTouchEnabled: boolean
  isTouchSupported: boolean
  // ...
}
```

### Implementation Steps

1. **Remove biometric calls from initializeAccount:**

Lines 262-263 in `src/actions/LoginActions.tsx`:
```typescript
let accountInitObject: AccountInitPayload = {
  ...initialState,
  account,
  currencyCode: '',
  pinLoginEnabled: false,
  isTouchEnabled: false,  // ← Use default value
  isTouchSupported: false, // ← Use default value
  walletId: '',
  walletsSort: 'manual'
}
```

Remove lines 316-318:
```typescript
refreshTouchId(account).catch(() => {
  // We have always failed silently here
})
```

2. **Move biometric initialization to SettingsScene:**

The SettingsScene already loads biometry type on mount (lines 387-403). Enhance this to also load the enabled state:

```typescript
React.useEffect(() => {
  // Load biometry support and enabled state
  const loadBiometryState = async () => {
    try {
      const supported = (await getSupportedBiometryType()) !== false
      const enabled = await isTouchEnabled(account)

      // Update Redux state
      dispatch({
        type: 'UI/SETTINGS/SET_BIOMETRY_STATE',
        data: { isTouchSupported: supported, isTouchEnabled: enabled }
      })

      // Load UI text
      if (supported) {
        await loadBiometryType(account)
      }
    } catch (error) {
      showError(error)
    }
  }

  loadBiometryState()

  // ... rest of the effect
}, [context, account, dispatch])
```

3. **Add new Redux action:**

In `src/types/reduxActions.ts`, add:
```typescript
{
  type: 'UI/SETTINGS/SET_BIOMETRY_STATE'
  data: {
    isTouchSupported: boolean
    isTouchEnabled: boolean
  }
}
```

4. **Update Settings Reducer:**

In `src/reducers/scenes/SettingsReducer.ts`, add a new case:
```typescript
case 'UI/SETTINGS/SET_BIOMETRY_STATE': {
  const { isTouchSupported, isTouchEnabled } = action.data
  return {
    ...state,
    isTouchSupported,
    isTouchEnabled
  }
}
```

5. **Keep refreshTouchId call (if needed):**

The `refreshTouchId` call might be needed for some edge cases. Consider moving it to SettingsScene as well, or make it non-blocking by not awaiting it.

6. **Update interface types:**

Remove from `AccountInitPayload` in `src/reducers/scenes/SettingsReducer.ts:40-48`:
```typescript
export interface AccountInitPayload extends SettingsState {
  account: EdgeAccount
  currencyCode: string
  pinLoginEnabled: boolean
  // Remove these two:
  // isTouchEnabled: boolean
  // isTouchSupported: boolean
  walletId: string
  walletsSort: SortOption
}
```

Actually, these are inherited from `SettingsState`, so they'll still be there. The change is just in what values are passed during init.

### Potential Issues

**⚠️ IMPORTANT:** The biometric state won't be available until the user visits SettingsScene for the first time. Consider these scenarios:

1. **Settings Scene Toggle:** User goes to settings → sees TouchID toggle → works fine
2. **Other screens referencing biometric state:** Check if any screens besides SettingsScene rely on `isTouchEnabled` or `isTouchSupported` being set

**Alternative approach:** Load biometry state lazily on first access:
- Create a hook `useBiometryState()` that loads state on first call
- Cache the result in Redux
- Any component that needs biometry state uses this hook

### Alternative: Background Loading

Instead of moving to SettingsScene, load in background after login completes:

```typescript
// At the end of initializeAccount, after all critical path work:
// Load biometry state in background (non-blocking)
Promise.all([
  isTouchEnabled(account),
  getSupportedBiometryType()
]).then(([enabled, supportedType]) => {
  dispatch({
    type: 'UI/SETTINGS/SET_BIOMETRY_STATE',
    data: {
      isTouchEnabled: enabled,
      isTouchSupported: supportedType !== false
    }
  })

  // Also refresh TouchID state
  return refreshTouchId(account)
}).catch(() => {
  // Fail silently as before
})
```

This approach:
- ✅ Doesn't block login flow
- ✅ Makes state available app-wide
- ✅ Minimal code changes
- ❌ Still does the work (just asynchronously)

### Complexity: **MEDIUM**
### Performance Impact: **MEDIUM-HIGH** (removes 2 blocking async calls from critical login path)

---

## Missing Details & Inconsistencies

### 1. Document Ambiguity: "initializeAccount"

The document title says "Optimize time to execute initializeAccount" but some optimizations involve the `readSyncedSettings` function which is called at the very beginning of `initializeAccount` (line 84).

**Clarification needed:**
- Should optimizations focus on the total time of `initializeAccount` including all its calls?
- Or specifically on work done within the function body?

**Assumption:** Optimize the entire `initializeAccount` execution time, including functions it calls.

### 2. Missing: Measurement Strategy

The document doesn't specify:
- How to measure the performance improvement
- What the current baseline timing is
- What the target timing is

**Recommendation:** Add performance marks before/after each optimization:

```typescript
performance.mark('loginStart')
performance.mark('settingsReadStart')
const syncedSettings = await readSyncedSettings(account)
performance.mark('settingsReadEnd')
performance.measure('settingsRead', 'settingsReadStart', 'settingsReadEnd')
```

### 3. Incomplete: Categories File

The document doesn't mention `readSyncedSubcategories` which has the same problem as `readSyncedSettings`:

**Location:** `src/actions/CategoriesActions.ts:152-166`

```typescript
async function readSyncedSubcategories(
  account: EdgeAccount
): Promise<string[]> {
  try {
    const text = await account.disklet.getText(CATEGORIES_FILENAME)
    const categoriesJson = JSON.parse(text)
    return categoriesJson.categories
  } catch (error) {
    // If Categories.json doesn't exist yet, create it, and return it
    await writeSyncedSubcategories(account, {
      categories: defaultCategories
    })
    return defaultCategories
  }
}
```

Should this also be optimized to not write defaults?

### 4. Migration Strategy

The document doesn't specify:
- Should existing settings files be migrated/cleaned up?
- Or just change behavior for new operations?
- What about users with large denomination settings files?

**Recommendation:** Implement a one-time migration that runs during login to clean up existing settings files.

**Solution Added:** Added a `denominationSettingsOptimized` flag to `SyncedAccountSettings` that:
- Defaults to `false` for existing accounts
- Gets set to `true` after cleanup migration runs
- Prevents the expensive cleanup from running on every subsequent login
- Only incurs the cleanup cost once per account

### 5. Testing Strategy

The document doesn't mention:
- Unit tests to add/modify
- Integration tests for login flow
- Testing on actual devices vs simulators
- Testing with existing accounts vs new accounts

**Recommendation:** Test matrix should include:
- New account (no settings files)
- Existing account with settings files
- Existing account with large denomination settings
- After settings cleanup migration

### 6. Backward Compatibility

What happens if a user downgrades to an older version after these changes?

**Potential issues:**
- Older version expects defaults to be written
- Older version expects denomination settings to be populated
- Settings files might be in unexpected state

**Recommendation:** Document minimum version requirements or add version checks.

### 7. Performance Trade-offs

The denomination optimization trades:
- Faster login time
- Smaller settings files
- **vs.**
- Slightly more complex lookup logic (though already exists)
- Need to handle undefined values

Is this trade-off acceptable for all use cases?

---

## Implementation Priority & Order

### Phase 1: Quick Wins (Low Risk, High Impact)
1. **Remove scamWarningModal call** - Already disabled, safe to remove
2. **Don't write defaults in readSyncedSettings** - Simple change, immediate benefit

### Phase 2: Medium Complexity (Medium Risk, High Impact)
3. **Remove biometric calls from initializeAccount** - Move to background loading
4. **Don't write defaults in readLocalAccountSettings** - Same pattern as Task 1

### Phase 3: Complex Changes (Higher Risk, Highest Impact)
5. **Add denominationSettingsOptimized flag** - Add to settings cleaner
6. **Remove default denomination population** - Requires thorough testing
7. **Add denomination cleanup migration** - One-time cleanup for existing accounts (uses flag to prevent re-running)

### Phase 4: Optional Maintenance
8. Clean up commented code in ScamWarningActions.tsx
9. Remove unused scamWarningModal calls from other files
10. Optimize readSyncedSubcategories similarly

---

## Estimated Performance Improvement

**Current login path includes:**
- 2-4 disk writes (Settings.json, LocalSettings.json if new account)
- 2-3 async native module calls (isTouchEnabled, getSupportedBiometryType, refreshTouchId)
- Looping through all currency plugins and tokens (potentially 100+ items)
- 1 scamWarningModal async call (returns immediately but still overhead)

**After optimizations:**
- ✅ 2-4 disk writes removed (except during one-time migration)
- ✅ 2 blocking native calls removed (1 moved to background)
- ✅ Expensive currency/token loop removed
- ✅ Unnecessary async call removed

**Note on cleanup migration:**
- The denomination cleanup migration will run once per existing account (first login after upgrade)
- This is a one-time cost that prevents ongoing waste
- After the first login, the `denominationSettingsOptimized` flag prevents re-running
- New accounts never run the migration

**Estimated improvement:** 200-500ms reduction in login time, depending on:
- Number of currency plugins installed
- Disk I/O speed
- Native module call latency

For new accounts or accounts with many plugins, improvement could be 500ms-1s+.

**After first migration:** Subsequent logins get the full benefit with no migration overhead.

---

## Testing Checklist

### Unit Tests
- [ ] readSyncedSettings returns defaults without writing
- [ ] readLocalAccountSettings returns defaults without writing
- [ ] Denomination selectors work with sparse settings
- [ ] Write operations work when file doesn't exist
- [ ] denominationSettingsOptimized flag is properly set and respected

### Integration Tests
- [ ] Login flow with new account (no files)
- [ ] Login flow with existing account (has files)
- [ ] Login flow after denomination cleanup (first time)
- [ ] Login flow after denomination cleanup (subsequent logins - flag set)
- [ ] Cleanup migration doesn't run twice
- [ ] Settings Scene loads biometry state correctly
- [ ] TouchID toggle works after optimization

### Manual Testing
- [ ] New account creation and login
- [ ] Existing account login
- [ ] Change denomination in currency settings
- [ ] Verify denomination persists across logout/login
- [ ] Enable/disable TouchID in settings
- [ ] Verify TouchID state persists
- [ ] Check all screens that display amounts (use correct denomination)

### Performance Testing
- [ ] Measure login time before optimizations
- [ ] Measure login time after each optimization
- [ ] Verify no regression in UI responsiveness
- [ ] Check memory usage
- [ ] Profile disk I/O during login

---

## Risks & Mitigations

### Risk 1: Denomination Display Issues
**Impact:** High - Amounts could display incorrectly
**Probability:** Medium
**Mitigation:**
- Thoroughly test all denomination selectors
- Add fallback logic to getters
- Test with both new and existing accounts
- Add logging to catch undefined denominations

### Risk 2: Biometry State Unavailable
**Impact:** Medium - Settings toggle might not work initially
**Probability:** Low
**Mitigation:**
- Use background loading approach
- Add loading state to settings toggle
- Show spinner until state loads
- Cache result after first load

### Risk 3: Settings File Corruption
**Impact:** High - Could lose user settings
**Probability:** Low
**Mitigation:**
- Keep write operations atomic
- Add error handling to all write paths
- Test migration logic thoroughly
- Consider backup before cleanup

### Risk 4: Backward Compatibility
**Impact:** Medium - Issues if user downgrades
**Probability:** Low
**Mitigation:**
- Document minimum version
- Keep changes backward compatible where possible
- Don't delete data, just don't write unnecessary defaults

---

## Conclusion

All four optimization tasks are **feasible and recommended**. The changes will:
- ✅ Reduce login time by 200-1000ms
- ✅ Reduce settings file size significantly
- ✅ Simplify code in some areas
- ✅ One-time migration ensures existing accounts get optimized
- ✅ Flag prevents re-running expensive cleanup on every login
- ⚠️ Require thorough testing, especially for denominations
- ⚠️ Need careful migration for existing accounts

**Key Design Decision:** The `denominationSettingsOptimized` flag ensures:
- Migration only runs once per account
- No performance penalty after first login
- Clean separation between migration and steady-state behavior

**Recommended implementation order:** Phase 1 → Phase 2 → Phase 3 → Phase 4

**Most impactful change:** Task 2 (denomination defaults removal)
**Safest change:** Task 3 (remove scamWarningModal call)
**Most complex change:** Task 2 (denomination defaults - requires extensive testing)

