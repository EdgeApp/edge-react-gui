// @flow

import * as React from 'react'
import { connect } from 'react-redux'

import { LoadingScene } from '../../../../components/scenes/LoadingScene.js'
import { getLoginStatus } from '../../../Settings/selectors.js'

export function ifLoggedIn<Klass>(LoggedIn: Klass): Klass {
  class IfLoggedIn extends React.Component<{ loginStatus: boolean, outerProps: any }> {
    render() {
      const { loginStatus, outerProps } = this.props
      // $FlowFixMe
      return loginStatus ? <LoggedIn {...outerProps} /> : <LoadingScene />
    }
  }
  IfLoggedIn.displayName = 'IfLoggedIn'

  const mapStateToProps = (state, ownProps: any): { loginStatus: boolean, outerProps: any } => ({
    loginStatus: !!getLoginStatus(state),
    outerProps: ownProps
  })
  const mergeProps = (stateProps, dispatchProps, ownProps) => stateProps

  // $FlowFixMe
  return connect(mapStateToProps, null, mergeProps)(IfLoggedIn)
}
