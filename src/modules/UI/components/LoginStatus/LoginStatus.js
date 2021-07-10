// @flow

import * as React from 'react'
import { connect } from 'react-redux'

import { LoadingScene } from '../../../../components/scenes/LoadingScene.js'
import { type Dispatch, type RootState } from '../../../../types/reduxTypes.js'

type StateProps = {
  loginStatus: boolean
}

export function ifLoggedIn<Props>(Component: React.ComponentType<Props>): (props: Props) => React.Node {
  // $FlowFixMe
  return connect(
    (state: RootState): StateProps => ({
      loginStatus: state.ui.settings.loginStatus ?? false
    }),
    (dispatch: Dispatch) => ({})
  )((props: Props & StateProps): React.Node => {
    const { loginStatus, ...rest } = props
    return loginStatus ? <Component {...rest} /> : <LoadingScene />
  })
}
