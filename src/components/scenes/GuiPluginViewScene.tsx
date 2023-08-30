import * as React from 'react'

import { GuiPlugin } from '../../types/GuiPluginTypes'
import { EdgeSceneProps } from '../../types/routerTypes'
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

interface Props extends EdgeSceneProps<'pluginView' | 'pluginViewBuy' | 'pluginViewSell'> {}

export function GuiPluginViewScene(props: Props): JSX.Element {
  const { route, navigation } = props
  const { deepPath, deepQuery, plugin } = route.params

  return (
    <SceneWrapper background="theme" hasTabs={route.name !== 'pluginView'}>
      <EdgeProviderComponent plugin={plugin} deepPath={deepPath} deepQuery={deepQuery} navigation={navigation} />
    </SceneWrapper>
  )
}
