// @flow

import * as React from 'react'

import { connect } from '../../types/reactRedux.js'
import { LoadingScene } from '../scenes/LoadingScene.js'

type StateProps = {
  loginStatus: boolean
}

export function ifLoggedIn<Props: {}>(Component: React.ComponentType<Props>): React.StatelessFunctionalComponent<$Exact<Props>> {
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
