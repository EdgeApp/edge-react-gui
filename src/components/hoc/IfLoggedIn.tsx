import * as React from 'react'

import { useSelector } from '../../types/reactRedux'
import { LoadingScene } from '../scenes/LoadingScene'

export function ifLoggedIn<Props extends {}>(Component: React.ComponentType<Props>): React.FunctionComponent<Props> {
  return function (props: Props) {
    const settingsLoaded = useSelector(state => state.ui.settings.settingsLoaded ?? false)
    return settingsLoaded ? <Component {...props} /> : <LoadingScene />
  }
}
