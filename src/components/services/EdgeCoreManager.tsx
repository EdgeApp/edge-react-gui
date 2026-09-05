import { addBreadcrumb, captureException } from '@sentry/react-native'
import detectBundler from 'detect-bundler'
import {
  type EdgeContext,
  type EdgeContextOptions,
  type EdgeCrashReporter,
  type EdgeFakeWorld,
  type EdgeNativeIo,
  MakeEdgeContext,
  MakeFakeEdgeWorld
} from 'edge-core-js'
import {
  debugUri as accountbasedDebugUri,
  makePluginIo as makeAccountbasedIo,
  pluginUri as accountbasedUri
} from 'edge-currency-accountbased/rn'
import { makeMoneroIo } from 'edge-currency-accountbased/rn-monero'
import { makePiratechainIo } from 'edge-currency-accountbased/rn-piratechain'
import { makeZanoIo } from 'edge-currency-accountbased/rn-zano'
import { makeZcashIo } from 'edge-currency-accountbased/rn-zcash'
import {
  debugUri as currencyPluginsDebugUri,
  makePluginIo as makeCurrencyPluginsIo,
  pluginUri as currencyPluginsUri
} from 'edge-currency-plugins'
import {
  debugUri as exchangeDebugUri,
  pluginUri as exchangeUri
} from 'edge-exchange-plugins'
import * as React from 'react'
import { Platform, Text, View } from 'react-native'
import BootSplash from 'react-native-bootsplash'
import { getBrand, getDeviceId, getVersion } from 'react-native-device-info'

import { CONFIG } from '../../config'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import { KEYS } from '../../keys'
import { addMetadataToContext } from '../../util/addMetadataToContext'
import { onAttestationToken } from '../../util/attestation'
import { allPlugins } from '../../util/corePlugins'
import {
  hasNativeApiSigner,
  isUsableApiKey,
  makeNativeApiSigner,
  warmNativeApiKey
} from '../../util/edgeApiSigner'
import { fakeUser } from '../../util/fake-user'
import { initializeKeys } from '../../util/keysStore'
import {
  INFO_TEST_SERVER,
  LOGIN_TEST_SERVER,
  shouldUseTestServers,
  SYNC_TEST_SERVER
} from '../../util/maestro'
import { getOsVersion } from '../../util/utils'
import { LoadingSplashScreen } from '../progress-indicators/LoadingSplashScreen'
import { showError } from './AirshipInstance'
import { Providers } from './Providers'

// Start the disk read and signed infoRollup fetch during bundle evaluation so they
// overlap the rest of startup. The WebView is gated behind keys and does not
// overlap. The effect below awaits the same single-flighted promise, which by
// then has usually already resolved.
initializeKeys().catch((error: unknown) => {
  console.warn('EdgeCoreManager: keys warm-up failed', String(error))
})

interface Props {}

const nativeIo: EdgeNativeIo = detectBundler.isReactNative
  ? {
      'edge-currency-accountbased': makeAccountbasedIo(),
      'edge-currency-plugins': makeCurrencyPluginsIo({
        memletConfig: {
          maxMemoryUsage: 50 * 1024 * 1024 // 50MB
        }
      }),
      monero: makeMoneroIo(),
      piratechain: makePiratechainIo(),
      zano: makeZanoIo(),
      zcash: makeZcashIo()
    }
  : {}

const crashReporter: EdgeCrashReporter = {
  logBreadcrumb(event) {
    addBreadcrumb({
      type: event.source,
      message: event.message,
      data: event.metadata,
      timestamp: event.time.getTime() / 1000
    })
  },
  logCrash(event) {
    // Index the crash error by the source and original error name:
    const error = new Error(String(event.error))
    // All of these crash errors are grouped together using this error name:
    error.name = 'EdgeCrashEvent'

    captureException(error, scope => {
      scope.setLevel('fatal')
      scope.setTags({ crashSource: event.source })

      const metadataContext: Record<string, unknown> = {}
      addMetadataToContext(metadataContext, event.metadata)
      scope.setContext('EdgeCrashEvent Metadata', metadataContext)

      const detailsContext: Record<string, unknown> = {}
      addMetadataToContext(detailsContext, {
        source: event.source,
        time: event.time
      })
      scope.setContext('EdgeCrashEvent Details', detailsContext)

      return scope
    })
  }
}

async function buildContextOptions(): Promise<EdgeContextOptions> {
  const { EDGE_API_KEY: apiKey, EDGE_API_SECRET: apiSecret } = KEYS
  const nativeKey = hasNativeApiSigner() ? await warmNativeApiKey() : ''
  const nativeApiSigner = nativeKey !== '' ? makeNativeApiSigner() : undefined
  // Token-only keys are valid: core uses `Authorization: Token {apiKey}`.
  const jsPair = isUsableApiKey(apiKey)
    ? apiSecret != null && apiSecret.byteLength > 0
      ? { apiKey, apiSecret }
      : { apiKey }
    : undefined
  console.log(
    `[apiSigner] native=${nativeApiSigner != null} keysFallback=${
      jsPair != null
    }`
  )
  if (nativeApiSigner == null && jsPair == null) {
    // A context with no credentials still boots, then fails every login-server
    // call with an opaque error, so say plainly what is missing.
    console.error(
      'EdgeCoreManager: no usable native EdgeApiSigner and no KEYS.EDGE_API_KEY / EDGE_API_SECRET; login-server requests will fail'
    )
  }
  return {
    ...(nativeApiSigner != null
      ? { apiSigner: nativeApiSigner }
      : jsPair ?? {}),
    appId: '',
    appVersion: getVersion(),
    deviceDescription: `${getBrand()} ${getDeviceId()}`,
    osType: Platform.OS,
    osVersion: getOsVersion(),

    // Use this to adjust logging verbosity on a plugin-by-plugin basis:
    logSettings: {
      defaultLogLevel: 'warn',
      sources: {
        'edge-core': 'warn'
      }
    },

    plugins: allPlugins,
    skipBlockHeight: true
  }
}

/**
 * Mounts the edge-core-js WebView, and then mounts the rest of the app
 * once the core context is ready.
 */
export const EdgeCoreManager: React.FC<Props> = props => {
  // Null until the keys store has resolved. `buildContextOptions` reads secrets
  // and plugin inits out of KEYS / pluginMaps, which the keys store mutates in
  // place, so the options can only be built once that has settled.
  const [contextOptions, setContextOptions] =
    React.useState<EdgeContextOptions | null>(null)
  const [context, setContext] = React.useState<EdgeContext | null>(null)
  const [bootFatalError, setBootFatalError] = React.useState<string | null>(
    null
  )

  // Scratchpad values that should not trigger re-renders:
  const counter = React.useRef<number>(0)
  const splashHidden = React.useRef<boolean>(false)

  // Get the application state:
  const isAppForeground = useIsAppForeground()

  function hideSplash(): void {
    if (!splashHidden.current) {
      setTimeout(() => {
        BootSplash.hide({ fade: true }).catch((err: unknown) => {
          showError(err)
        })
      }, 200)
      splashHidden.current = true
    }
  }

  useAsyncEffect(
    async () => {
      try {
        await initializeKeys()
        setContextOptions(await buildContextOptions())
      } catch (error: unknown) {
        // initializeKeys itself never rejects, but buildContextOptions can.
        // Without a fallback, contextOptions stays null, Providers/Airship never
        // mount, and native BootSplash never hides.
        console.warn(
          'EdgeCoreManager: keys boot failed; using baked-in plugins',
          String(error)
        )
        try {
          setContextOptions(await buildContextOptions())
        } catch (fallbackError: unknown) {
          hideSplash()
          setBootFatalError(String(fallbackError))
        }
      }
    },
    [],
    'EdgeCoreManager'
  )

  // Cache the public API key from native for push / notification callers:
  useAsyncEffect(
    async () => {
      if (hasNativeApiSigner()) await warmNativeApiKey()
    },
    [],
    'EdgeCoreManager.warmNativeApiKey'
  )

  // Keep the core in sync with the application state:
  useAsyncEffect(
    async () => {
      if (context == null) return
      await context.changePaused(!isAppForeground, {
        secondsDelay: !isAppForeground ? 20 : 0
      })
    },
    [context, isAppForeground],
    'EdgeCoreManager'
  )

  const handleContext = useHandler((context: EdgeContext) => {
    console.log('EdgeContext opened')
    let active = true
    const pushToken = (token: string | undefined): void => {
      if (!active) return
      context.setAttestationToken(token).catch((error: unknown) => {
        if (!active) return
        console.warn('[attestation] setAttestationToken failed', error)
      })
    }
    const unsubscribeToken = onAttestationToken(pushToken)
    // onAttestationToken sync-replays the current servable token on subscribe.
    context.on('close', () => {
      console.log('EdgeContext closed')
      active = false
      unsubscribeToken()
      setContext(null)
    })
    ++counter.current
    setContext(context)
    hideSplash()
  })

  const handleError = useHandler((error: Error) => {
    console.log('EdgeContext failed', error)
    hideSplash()
    // Providers (Airship host) mounts only after context is set. A core load
    // failure must use the same pre-Providers surface as buildContextOptions.
    setBootFatalError(String(error))
  })

  const handleFakeEdgeWorld = useHandler((world: EdgeFakeWorld) => {
    if (contextOptions == null) return
    // `world` is already a yaob proxy, so anything passed through it is packed
    // as plain data. `MakeEdgeContext` bridgifies `apiSigner` on the real path,
    // but here `signMessage` would be packed as a bare function and blow up
    // inside the WebView with "Unsupported value of type function". The fake
    // core never reaches the login server, so it does not need a signer.
    const { apiSigner, ...fakeOptions } = contextOptions
    world.makeEdgeContext({ ...fakeOptions }).then(handleContext, handleError)
  })

  const pluginUris = [
    CONFIG.DEBUG_ACCOUNTBASED ? accountbasedDebugUri : accountbasedUri,
    CONFIG.DEBUG_CURRENCY_PLUGINS
      ? currencyPluginsDebugUri
      : currencyPluginsUri,
    CONFIG.DEBUG_EXCHANGES ? exchangeDebugUri : exchangeUri
  ]

  let infoServer: string | string[] | undefined
  let loginServer: string | string[] | undefined
  let syncServer: string | undefined

  if (shouldUseTestServers()) {
    console.log('Using test servers')
    infoServer = INFO_TEST_SERVER
    loginServer = LOGIN_TEST_SERVER
    syncServer = SYNC_TEST_SERVER
  }

  if (CONFIG.LOGIN_SERVER != null && CONFIG.LOGIN_SERVER.length > 0) {
    loginServer = CONFIG.LOGIN_SERVER
  }
  if (CONFIG.INFO_SERVER != null && CONFIG.INFO_SERVER.length > 0) {
    infoServer = CONFIG.INFO_SERVER
  }

  if (bootFatalError != null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Edge failed to start: {bootFatalError}</Text>
      </View>
    )
  }

  if (contextOptions == null) {
    return <LoadingSplashScreen />
  }

  return (
    <>
      {CONFIG.USE_FAKE_CORE ? (
        <MakeFakeEdgeWorld
          crashReporter={crashReporter}
          debug={CONFIG.DEBUG_CORE}
          nativeIo={nativeIo}
          pluginUris={pluginUris}
          users={[fakeUser]}
          onLoad={handleFakeEdgeWorld}
          onError={handleError}
        />
      ) : (
        <MakeEdgeContext
          {...contextOptions}
          crashReporter={crashReporter}
          debug={CONFIG.DEBUG_CORE}
          allowDebugging={
            CONFIG.DEBUG_ACCOUNTBASED ||
            CONFIG.DEBUG_CORE ||
            CONFIG.DEBUG_CURRENCY_PLUGINS
          }
          nativeIo={nativeIo}
          pluginUris={pluginUris}
          onLoad={handleContext}
          onError={handleError}
          loginServer={loginServer}
          infoServer={infoServer}
          syncServer={syncServer}
        />
      )}
      {context == null ? (
        <LoadingSplashScreen />
      ) : (
        <Providers key={`redux${counter.current}`} context={context} />
      )}
    </>
  )
}
