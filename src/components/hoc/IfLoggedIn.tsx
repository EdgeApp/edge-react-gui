import * as React from 'react'

import { connect } from '../../types/reactRedux'
import { LoadingScene } from '../scenes/LoadingScene'

type StateProps = {
  loginStatus: boolean
}

export function ifLoggedIn<Props extends {}>(Component: React.ComponentType<Props>): React.FunctionComponent<$Exact<Props>> {
  return connect<StateProps, {}, Props>(
    state => ({
      loginStatus: state.ui.settings.loginStatus ?? false
    }),
    dispatch => ({})
  )((props: Props & StateProps) => {
    const { loginStatus, ...rest } = props
    return loginStatus ? <Component {...rest} /> : <LoadingScene />
  })
}
