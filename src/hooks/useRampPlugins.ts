import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { pluginFactories } from '../plugins/ramps/allRampPlugins'
import type { RampPlugin } from '../plugins/ramps/rampPluginTypes'

interface UseRampPluginsOptions {
  account: EdgeAccount
}

export function useRampPlugins({ account }: UseRampPluginsOptions) {
  const [plugins, setPlugins] = React.useState<RampPlugin[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let mounted = true

    const loadPlugins = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const loadedPlugins: RampPlugin[] = []

        for (const [pluginId, factory] of Object.entries(pluginFactories)) {
          try {
            // Create a minimal config for the plugin
            const config = {
              initOptions: {},
              account,
              navigation: null as any, // Navigation will be provided by components that need it
              onLogEvent: () => {},
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
  }, [account])

  return {
    data: plugins,
    isLoading,
    error,
    isError: error != null
  }
}
