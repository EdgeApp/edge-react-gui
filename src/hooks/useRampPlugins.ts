import { useNavigation } from '@react-navigation/native'
import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { useDispatch } from 'react-redux'

import { updateFiatPurchaseCount } from '../actions/RequestReviewActions'
import { ENV } from '../env'
import { pluginFactories } from '../plugins/ramps/allRampPlugins'
import type {
  RampPlugin,
  RampPluginConfig
} from '../plugins/ramps/rampPluginTypes'
import { createStore } from '../plugins/ramps/utils/createStore'
import { getRampPluginStoreId } from '../plugins/ramps/utils/rampStoreIds'
import type { Dispatch as ReduxDispatch } from '../types/reduxTypes'
import type { NavigationBase } from '../types/routerTypes'
import { logEvent } from '../util/tracking'

interface UseRampPluginsOptions {
  account: EdgeAccount
}

export function useRampPlugins({ account }: UseRampPluginsOptions): {
  data: RampPlugin[]
  isLoading: boolean
  error: Error | null
  isError: boolean
} {
  const [plugins, setPlugins] = React.useState<RampPlugin[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const navigation = useNavigation<NavigationBase>()
  const dispatch = useDispatch<ReduxDispatch>()

  React.useEffect(() => {
    let mounted = true

    const loadPlugins = async (): Promise<void> => {
      try {
        setIsLoading(true)
        setError(null)

        const loadedPlugins: RampPlugin[] = []

        for (const [pluginId, factory] of Object.entries(pluginFactories)) {
          try {
            // Get the appropriate store ID:
            // - Legacy plugins (e.g., paybis) use their old store IDs for backward compatibility
            // - New plugins automatically get 'ramp:${pluginId}' format
            const storeId = getRampPluginStoreId(pluginId)
            const store = createStore(storeId, account.dataStore)

            // Create a minimal config for the plugin
            const initOptions = ENV.RAMP_PLUGIN_INITS[pluginId] ?? {}
            const config: RampPluginConfig = {
              initOptions,
              store,
              account,
              navigation,
              onLogEvent: (event, values) => {
                dispatch(logEvent(event, values))
                if (event === 'Buy_Success' || event === 'Sell_Success') {
                  dispatch(updateFiatPurchaseCount()).catch(() => {})
                }
              },
              disklet: account.disklet
            }

            const plugin = factory(config)
            loadedPlugins.push(plugin)
          } catch (error) {
            console.warn(`Failed to load plugin ${pluginId}:`, error)
          }
        }

        if (mounted) {
          setPlugins(loadedPlugins)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error('Failed to load plugins')
          )
          setIsLoading(false)
        }
      }
    }

    loadPlugins().catch(console.error)

    return () => {
      mounted = false
    }
  }, [account, navigation, dispatch])

  return {
    data: plugins,
    isLoading,
    error,
    isError: error != null
  }
}
