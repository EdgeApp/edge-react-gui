// @flow

import React from 'react'
import type { ComponentType } from 'react'
import { connect } from 'react-redux'

import { getLoginStatus } from '../../../Settings/selectors.js'

export function ifLoggedIn<Klass> (LoggedIn: Klass, LoggedOut: ComponentType<{}>): Klass {
  class IfLoggedIn extends React.Component<{ loginStatus: boolean, outerProps: any }> {
    render () {
      const { loginStatus, outerProps } = this.props
      // $FlowFixMe
      return loginStatus ? <LoggedIn {...outerProps} /> : <LoggedOut {...outerProps} />
    }
  }
  IfLoggedIn.displayName = 'IfLoggedIn'

  const mapStateToProps = (state, ownProps: any): { loginStatus: boolean, outerProps: any } => ({
    loginStatus: !!getLoginStatus(state),
    outerProps: ownProps
  })
  const mergeProps = (stateProps, dispatchProps, ownProps) => stateProps

  // $FlowFixMe
  return connect(
    mapStateToProps,
    null,
    mergeProps
  )(IfLoggedIn)
}
