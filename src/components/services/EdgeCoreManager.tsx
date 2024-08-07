import { addBreadcrumb, captureException } from '@sentry/react-native'
import detectBundler from 'detect-bundler'
import { EdgeContext, EdgeContextOptions, EdgeCrashReporter, EdgeFakeWorld, EdgeNativeIo, MakeEdgeContext, MakeFakeEdgeWorld } from 'edge-core-js'
import { debugUri as accountbasedDebugUri, makePluginIo as makeAccountbasedIo, pluginUri as accountbasedUri } from 'edge-currency-accountbased'
import makeMoneroIo from 'edge-currency-monero/lib/react-native-io'
import { debugUri as currencyPluginsDebugUri, makePluginIo as makeCurrencyPluginsIo, pluginUri as currencyPluginsUri } from 'edge-currency-plugins'
import { debugUri as exchangeDebugUri, pluginUri as exchangeUri } from 'edge-exchange-plugins'
import * as React from 'react'
import RNBootSplash from 'react-native-bootsplash'
import { getBrand, getDeviceId } from 'react-native-device-info'

import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import { lstrings } from '../../locales/strings'
import { allPlugins } from '../../util/corePlugins'
import { fakeUser } from '../../util/fake-user'
import { isMaestro } from '../../util/maestro'
import { ButtonsModal } from '../modals/ButtonsModal'
import { LoadingSplashScreen } from '../progress-indicators/LoadingSplashScreen'
import { Airship, showError } from './AirshipInstance'
import { Providers } from './Providers'

const LOGIN_TEST_SERVER = 'https://login-tester.edge.app/api'
const INFO_TEST_SERVER = 'https://info-tester.edge.app'
const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

interface Props {}

const contextOptions: EdgeContextOptions = {
  apiKey: ENV.AIRBITZ_API_KEY,
  appId: '',
  deviceDescription: `${getBrand()} ${getDeviceId()}`,

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

const nativeIo: EdgeNativeIo = detectBundler.isReactNative
  ? {
      'edge-currency-accountbased': makeAccountbasedIo(),
      'edge-currency-plugins': makeCurrencyPluginsIo({
        memletConfig: {
          maxMemoryUsage: 50 * 1024 * 1024 // 50MB
        }
      }),
      'edge-currency-monero': makeMoneroIo()
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
    const eventString = JSON.stringify(event, null, 2)
    captureException(eventString, { level: 'fatal' })
  }
}

/**
 * Mounts the edge-core-js WebView, and then mounts the rest of the app
 * once the core context is ready.
 */
export function EdgeCoreManager(props: Props) {
  const [context, setContext] = React.useState<EdgeContext | null>(null)

  // Scratchpad values that should not trigger re-renders:
  const counter = React.useRef<number>(0)
  const splashHidden = React.useRef<boolean>(false)

  // Get the application state:
  const isAppForeground = useIsAppForeground()

  // Keep the core in sync with the application state:
  useAsyncEffect(
    async () => {
      if (context == null) return
      await context.changePaused(!isAppForeground, { secondsDelay: !isAppForeground ? 20 : 0 })
    },
    [context, isAppForeground],
    'EdgeCoreManager'
  )

  function hideSplash() {
    if (!splashHidden.current) {
      setTimeout(() => {
        RNBootSplash.hide({ fade: true }).catch(err => showError(err))
      }, 200)
      splashHidden.current = true
    }
  }

  const handleContext = useHandler((context: EdgeContext) => {
    console.log('EdgeContext opened')
    context.on('close', () => {
      console.log('EdgeContext closed')
      setContext(null)
    })
    ++counter.current
    setContext(context)
    hideSplash()
  })

  const handleError = useHandler((error: Error) => {
    console.log('EdgeContext failed', error)
    hideSplash()
    Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal bridge={bridge} buttons={{ ok: { label: lstrings.string_ok_cap } }} title="Edge core failed to load" message={String(error)} />
    )).catch(() => {})
  })

  const handleFakeEdgeWorld = useHandler((world: EdgeFakeWorld) => {
    world.makeEdgeContext({ ...contextOptions }).then(handleContext, handleError)
  })

  const pluginUris = [
    ENV.DEBUG_ACCOUNTBASED ? accountbasedDebugUri : accountbasedUri,
    ENV.DEBUG_CURRENCY_PLUGINS ? currencyPluginsDebugUri : currencyPluginsUri,
    ENV.DEBUG_EXCHANGES ? exchangeDebugUri : exchangeUri,
    // For remaining Monero plugin:
    ENV.DEBUG_PLUGINS ? 'http://localhost:8101/plugin-bundle.js' : 'edge-core/plugin-bundle.js'
  ]

  let infoServer: string | undefined
  let loginServer: string | undefined
  let syncServer: string | undefined

  if ((ENV.ENABLE_TEST_SERVERS == null && isMaestro()) || ENV.ENABLE_TEST_SERVERS === true) {
    console.log('Using test servers')
    infoServer = INFO_TEST_SERVER
    loginServer = LOGIN_TEST_SERVER
    syncServer = SYNC_TEST_SERVER
  }

  return (
    <>
      {ENV.USE_FAKE_CORE ? (
        <MakeFakeEdgeWorld
          crashReporter={crashReporter}
          debug={ENV.DEBUG_CORE}
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
          debug={ENV.DEBUG_CORE}
          allowDebugging={ENV.DEBUG_ACCOUNTBASED || ENV.DEBUG_CORE || ENV.DEBUG_CURRENCY_PLUGINS || ENV.DEBUG_PLUGINS}
          nativeIo={nativeIo}
          pluginUris={pluginUris}
          onLoad={handleContext}
          onError={handleError}
          authServer={loginServer}
          infoServer={infoServer}
          syncServer={syncServer}
        />
      )}
      {context == null ? <LoadingSplashScreen /> : <Providers key={`redux${counter.current}`} context={context} />}
    </>
  )
}
