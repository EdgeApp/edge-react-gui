import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { executePlugin } from '../plugins/gui/fiatPlugin'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { base58ToUuid } from '../util/utils'

export function executePluginAction(navigation: NavigationBase, pluginId: string, direction: 'buy' | 'sell'): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account, context } = state.core
    const deviceId = base58ToUuid(context.clientId)

    await executePlugin({
      account,
      deviceId,
      direction: 'sell',
      guiPlugin: guiPlugins[pluginId],
      navigation,
      regionCode: { countryCode: 'US' }
    })
  }
}
