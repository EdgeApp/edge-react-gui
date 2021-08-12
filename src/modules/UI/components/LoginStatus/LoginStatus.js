// @flow

import * as React from 'react'

import { LoadingScene } from '../../../../components/scenes/LoadingScene.js'
import { connect } from '../../../../types/reactRedux.js'

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
