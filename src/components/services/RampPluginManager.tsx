import * as React from 'react'

import { ENV } from '../../env'
import { pluginFactories } from '../../plugins/ramps/allRampPlugins'
import type { RampPlugin } from '../../plugins/ramps/rampPluginTypes'
import { useDispatch } from '../../types/reactRedux'

export const RampPluginManager: React.FC = () => {
  const dispatch = useDispatch()

  React.useEffect(() => {
    const loadPlugins = async (): Promise<void> => {
      const plugins: Record<string, RampPlugin> = {}

      for (const [pluginId, factory] of Object.entries(pluginFactories)) {
        const initOptions = ENV.RAMP_PLUGIN_INITS[pluginId]
        if (initOptions == null) continue
        try {
          const plugin = factory({
            initOptions
          })
          plugins[plugin.pluginId] = plugin
        } catch (error) {
          console.error(`Failed to load plugin ${pluginId}:`, error)
        }
      }

      dispatch({
        type: 'RAMP_PLUGINS/LOADING_COMPLETE',
        data: { plugins }
      })
    }

    loadPlugins().catch(console.error)
  }, [dispatch])

  return null
}
