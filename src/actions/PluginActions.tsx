import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { executePlugin } from '../plugins/gui/fiatPlugin'
import { ThunkAction } from '../types/reduxTypes'

import { logEvent } from '../util/tracking'
import { base58ToUuid } from '../util/utils'

export function executePluginAction(navigation: RootSceneProps<'edgeApp'>['navigation'], pluginId: string, direction: 'buy' | 'sell'): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { defaultIsoFiat } = state.ui.settings
    const { account, context, disklet } = state.core
    const deviceId = base58ToUuid(context.clientId)

    await executePlugin({
      account,
      defaultIsoFiat,
      deviceId,
      direction: 'sell',
      disklet,
      guiPlugin: guiPlugins[pluginId],
      navigation,
      regionCode: { countryCode: 'US' },
      onLogEvent: (event, values) => dispatch(logEvent(event, values))
    })
  }
}
