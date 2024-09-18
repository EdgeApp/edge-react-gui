import * as React from 'react'

import { checkAndShowLightBackupModal } from '../../actions/BackupModalActions'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { UriQueryMap } from '../../types/WebTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { EdgeProviderComponent } from '../themed/EdgeProviderComponent'

export interface PluginViewParams {
  // The GUI plugin we are showing the user:
  plugin: GuiPlugin

  // Set these to add stuff to the plugin URI:
  deepPath?: string
  deepQuery?: UriQueryMap
}

interface Props {
  navigation: NavigationProp<'pluginView' | 'pluginViewBuy' | 'pluginViewSell'>

  // Work around an extremely strange & hard-to-debug type error:
  route: any // RouteProp<'pluginView' | 'pluginViewBuy' | 'pluginViewSell'>
}

export function GuiPluginViewScene(props: Props): JSX.Element {
  const { route, navigation } = props
  const { deepPath, deepQuery, plugin } = route.params
  const account = useSelector(state => state.core.account)

  if (checkAndShowLightBackupModal(account, navigation)) navigation.pop()

  return (
    <SceneWrapper hasTabs={route.name !== 'pluginView'} avoidKeyboard>
      <EdgeProviderComponent plugin={plugin} deepPath={deepPath} deepQuery={deepQuery} navigation={navigation} />
    </SceneWrapper>
  )
}
