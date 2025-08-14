import * as React from 'react'

import { ENV } from '../../env'
import { useHandler } from '../../hooks/useHandler'
import { pluginFactories } from '../../plugins/ramps/allRampPlugins'
import type {
  RampPlugin,
  RampPluginConfig
} from '../../plugins/ramps/rampPluginTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { NavigationBase } from '../../types/routerTypes'
import { logEvent, type TrackingEventName } from '../../util/tracking'

interface Props {
  navigation: NavigationBase
}

export const RampPluginManager: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const disklet = useSelector(state => state.core.disklet)

  const onLogEvent = useHandler((event: TrackingEventName, values?: any) => {
    logEvent(event, values)
  })

  React.useEffect(() => {
    if (account == null || disklet == null) return

    const loadPlugins = async (): Promise<void> => {
      const plugins: Record<string, RampPlugin> = {}

      for (const [pluginId, factory] of Object.entries(pluginFactories)) {
        const initOptions = ENV.RAMP_PLUGIN_INITS[pluginId]
        if (initOptions == null) continue
        try {
          const config: RampPluginConfig = {
            initOptions,
            account,
            navigation,
            onLogEvent,
            disklet
          }
          const plugin = factory(config)
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
  }, [dispatch, account, disklet, navigation, onLogEvent])

  return null
}
