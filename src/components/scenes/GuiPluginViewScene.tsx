import * as React from 'react'

import { checkAndShowLightBackupModal } from '../../actions/BackupModalActions'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { useSelector } from '../../types/reactRedux'
import { BuyTabSceneProps, EdgeAppSceneProps, NavigationBase, SellTabSceneProps } from '../../types/routerTypes'
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
  navigation:
    | EdgeAppSceneProps<'pluginView'>['navigation']
    | BuyTabSceneProps<'pluginViewBuy'>['navigation']
    | SellTabSceneProps<'pluginViewSell'>['navigation']

  // Work around an extremely strange & hard-to-debug type error:
  // EdgeAppSceneProps<'pluginView'>['route'] |
  // BuyTabSceneProps<'pluginViewBuy'>['route'] |
  // SellTabSceneProps<'pluginViewSell'>['route']
  // TODO: Break up these "GuiPlugin" scenes.
  route: any
}

export function GuiPluginViewScene(props: Props): JSX.Element {
  const { route, navigation } = props
  const { deepPath, deepQuery, plugin } = route.params
  const account = useSelector(state => state.core.account)

  if (checkAndShowLightBackupModal(account, navigation as NavigationBase)) navigation.pop()

  return (
    <SceneWrapper hasTabs={route.name !== 'pluginView'} avoidKeyboard>
      <EdgeProviderComponent plugin={plugin} deepPath={deepPath} deepQuery={deepQuery} navigation={navigation as NavigationBase} />
    </SceneWrapper>
  )
}
