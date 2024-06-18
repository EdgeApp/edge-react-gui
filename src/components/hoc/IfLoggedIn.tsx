import * as React from 'react'

import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { LoadingScene } from '../scenes/LoadingScene'

export function ifLoggedIn<Props extends {}>(Component: React.ComponentType<Props>): React.FunctionComponent<Props> {
  return function (props: Props) {
    const account = useSelector(state => state.core.account)
    const loggedIn = useWatch(account, 'loggedIn')
    return loggedIn ? <Component {...props} /> : <LoadingScene />
  }
}
