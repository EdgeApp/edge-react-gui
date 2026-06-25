import { describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'

import { SettingsScene } from '../../components/scenes/SettingsScene'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

// Stateful biometric backend, standing in for the keychain that
// `edge-login-ui-rn` persists the "Use Biometrics" setting to. The `mock`
// prefix is required for jest to allow referencing it inside the factory.
// `read` is indirected so a test can hold a refetch in-flight; it defaults to
// reading the persisted `enabled` flag.
const mockBiometry: {
  enabled: boolean
  read: () => Promise<boolean>
} = {
  enabled: true,
  read: async () => mockBiometry.enabled
}
jest.mock('edge-login-ui-rn', () => ({
  getSupportedBiometryType: async () => 'FaceID',
  isTouchEnabled: async () => await mockBiometry.read(),
  enableTouchId: async () => {
    mockBiometry.enabled = true
  },
  disableTouchId: async () => {
    mockBiometry.enabled = false
  }
}))

const ACCOUNT_ID = 'fake-account-id'
const BIOMETRIC_QUERY_KEY = ['biometricState', ACCOUNT_ID]

const mockState: FakeState = {
  core: {
    account: {
      id: ACCOUNT_ID,
      rootLoginId: 'XXX',
      currencyConfig: {},
      username: 'some user',
      watch: () => () => {}
    },
    context: {
      logSettings: { defaultLogLevel: 'silent' },
      watch: () => () => {}
    }
  }
}

const getCachedTouchEnabled = (client: QueryClient): boolean | undefined =>
  client.getQueryData<{ isTouchEnabled: boolean }>(BIOMETRIC_QUERY_KEY)
    ?.isTouchEnabled

const renderSettings = (client: QueryClient): ReturnType<typeof render> =>
  render(
    <FakeProviders initialState={mockState}>
      <QueryClientProvider client={client}>
        <SettingsScene
          {...fakeEdgeAppSceneProps('settingsOverview', undefined)}
        />
      </QueryClientProvider>
    </FakeProviders>
  )

describe('SettingsScene biometric toggle persistence', () => {
  it('keeps the cached biometric state in sync after toggling so re-entry shows the set value', async () => {
    jest.useRealTimers()
    mockBiometry.enabled = true
    mockBiometry.read = async () => mockBiometry.enabled

    // A client we own and can inspect, shared across both scene mounts to
    // model the app-level query cache that survives a scene remount. Seed it
    // with the loaded biometric state so the toggle renders deterministically.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    client.setQueryData(BIOMETRIC_QUERY_KEY, {
      isTouchEnabled: true,
      isTouchSupported: true,
      biometryType: 'FaceID'
    })

    const rendered = renderSettings(client)

    // The toggle renders directly off the cached query value.
    await rendered.findByText('Use FaceID', {}, { timeout: 15000 })
    expect(getCachedTouchEnabled(client)).toBe(true)

    // Toggle biometrics off.
    fireEvent.press(rendered.getByText('Use FaceID'))

    // The persisted backend flips off AND the query cache is kept in sync.
    // Before the fix the cache stayed `true`, so re-entering Settings showed
    // the stale (on) state.
    await waitFor(
      () => {
        expect(mockBiometry.enabled).toBe(false)
        expect(getCachedTouchEnabled(client)).toBe(false)
      },
      { timeout: 15000 }
    )

    rendered.unmount()

    // Re-enter Settings: a fresh mount reads the same (now-correct) cache and
    // shows the toggle in the state the user left it.
    const reentered = renderSettings(client)
    await reentered.findByText('Use FaceID', {}, { timeout: 15000 })
    expect(getCachedTouchEnabled(client)).toBe(false)

    reentered.unmount()
  }, 60000)

  it('cancels an in-flight refetch so a stale read cannot overwrite a completed toggle', async () => {
    jest.useRealTimers()
    mockBiometry.enabled = true

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    // Seed the cache so the toggle renders immediately AND a background refetch
    // fires on mount (stale-while-revalidate).
    client.setQueryData(BIOMETRIC_QUERY_KEY, {
      isTouchEnabled: true,
      isTouchSupported: true,
      biometryType: 'FaceID'
    })

    // Hold ONLY the first (mount) refetch in-flight, capturing its resolver so
    // we can complete it with the stale pre-toggle value after the toggle
    // persists. Any later refetch reads the real persisted flag.
    let resolveStaleRefetch: (value: boolean) => void = () => {}
    let signalStarted: () => void = () => {}
    const staleRefetchStarted = new Promise<void>(resolve => {
      signalStarted = resolve
    })
    let firstRead = true
    mockBiometry.read = async () => {
      if (firstRead) {
        firstRead = false
        signalStarted()
        return await new Promise<boolean>(resolve => {
          resolveStaleRefetch = resolve
        })
      }
      return mockBiometry.enabled
    }

    const rendered = renderSettings(client)

    // Toggle renders from the cached value while the mount refetch is pending.
    await rendered.findByText('Use FaceID', {}, { timeout: 15000 })
    await staleRefetchStarted

    // Toggle biometrics off. handleUpdateTouchId cancels the in-flight refetch,
    // optimistically writes false, and persists.
    fireEvent.press(rendered.getByText('Use FaceID'))
    await waitFor(
      () => {
        expect(mockBiometry.enabled).toBe(false)
        expect(getCachedTouchEnabled(client)).toBe(false)
      },
      { timeout: 15000 }
    )

    // The stale mount refetch now resolves with the OLD (true) value. Because it
    // was cancelled, react-query must ignore it and leave the cache at false.
    // Without the cancelQueries guard this write flips the toggle back on.
    resolveStaleRefetch(true)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(getCachedTouchEnabled(client)).toBe(false)

    rendered.unmount()
  }, 60000)
})
