// @flow

import Bugsnag from '@bugsnag/react-native'
import detectBundler from 'detect-bundler'
import { type EdgeContext, type EdgeContextOptions, type EdgeCrashReporter, type EdgeFakeWorld, MakeEdgeContext, MakeFakeEdgeWorld } from 'edge-core-js'
import makeAccountbasedIo from 'edge-currency-accountbased/lib/react-native-io.js'
import makeBitcoinIo from 'edge-currency-bitcoin/lib/react-native-io.js'
import makeMoneroIo from 'edge-currency-monero/lib/react-native-io.js'
import * as React from 'react'
import { Alert } from 'react-native'
import { getBrand, getDeviceId } from 'react-native-device-info'
import SplashScreen from 'react-native-smart-splash-screen'

import ENV from '../../../env.json'
import { useAsyncEffect } from '../../hooks/useAsyncEffect.js'
import { useIsAppForeground } from '../../hooks/useIsAppForeground.js'
import { useRef, useState } from '../../types/reactHooks.js'
import { allPlugins } from '../../util/corePlugins.js'
import { fakeUser } from '../../util/fake-user.js'
import { LoadingScene } from '../scenes/LoadingScene.js'
import { Services } from './Services.js'

type Props = {}

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

  plugins: allPlugins
}

const nativeIo = detectBundler.isReactNative
  ? {
      'edge-currency-accountbased': makeAccountbasedIo(),
      'edge-currency-bitcoin': makeBitcoinIo(),
      'edge-currency-monero': makeMoneroIo()
    }
  : {}

const crashReporter: EdgeCrashReporter = {
  logBreadcrumb(event) {
    return Bugsnag.leaveBreadcrumb(event.message, event.metadata)
  },
  logCrash(event) {
    return Bugsnag.notify(event.error, report => {
      report.addMetadata(event.source, event.metadata)
    })
  }
}

/**
 * Mounts the edge-core-js WebView, and then mounts the rest of the app
 * once the core context is ready.
 */
export function EdgeCoreManager(props: Props) {
  const [context, setContext] = useState<EdgeContext | null>(null)

  // Scratchpad values that should not trigger re-renders:
  const counter = useRef<number>(0)
  const splashHidden = useRef<boolean>(false)

  // Get the application state:
  const isAppForeground = useIsAppForeground()

  // Keep the core in sync with the application state:
  useAsyncEffect(async () => {
    if (context == null) return
    await context.changePaused(!isAppForeground, { secondsDelay: !isAppForeground ? 20 : 0 })
  }, [context, isAppForeground])

  function hideSplash() {
    if (!splashHidden.current) {
      SplashScreen.close({
        animationType: SplashScreen.animationType.fade,
        duration: 850,
        delay: 500
      })
      splashHidden.current = true
    }
  }

  function handleContext(context: EdgeContext) {
    console.log('EdgeContext opened')
    context.on('close', () => {
      console.log('EdgeContext closed')
      setContext(null)
    })
    ++counter.current
    setContext(context)
    hideSplash()
  }

  function handleError(error: Error) {
    console.log('EdgeContext failed', error)
    hideSplash()
    Alert.alert('Edge core failed to load', String(error))
  }

  function handleFakeEdgeWorld(world: EdgeFakeWorld) {
    world.makeEdgeContext({ ...contextOptions }).then(handleContext, handleError)
  }

  const pluginUris = ENV.DEBUG_PLUGINS ? ['http://localhost:8101/plugin-bundle.js'] : ['edge-core/plugin-bundle.js']
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
          allowDebugging={ENV.DEBUG_CORE || ENV.DEBUG_PLUGINS}
          nativeIo={nativeIo}
          pluginUris={pluginUris}
          onLoad={handleContext}
          onError={handleError}
        />
      )}
      {context == null ? <LoadingScene /> : <Services key={`redux${counter.current}`} context={context} />}
    </>
  )
}
