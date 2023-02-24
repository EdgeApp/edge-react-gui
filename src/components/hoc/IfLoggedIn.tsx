import * as React from 'react'

import { useScopedComponent } from '../../hooks/useScopedComponent'
import { useSelector } from '../../types/reactRedux'
import { LoadingScene } from '../scenes/LoadingScene'

export function IfLoggedIn<Props extends {}>(Component: React.ComponentType<Props>): React.FunctionComponent<Props> {
  const IfLoggedIn = useScopedComponent(function IfLoggedIn(props: Props) {
    const loginStatus = useSelector(state => state.ui.settings.loginStatus ?? false)
    return loginStatus ? <Component {...props} /> : <LoadingScene />
  })
  return IfLoggedIn
}
