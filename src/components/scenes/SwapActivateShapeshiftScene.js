// @flow

import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'

import { activateShapeShift } from '../../actions/ShapeShiftActions.js'
import s from '../../locales/strings.js'
import { displayErrorAlert } from '../../modules/UI/components/ErrorAlert/actions'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showActivity } from '../services/AirshipInstance.js'

type Props = {
  activateShapeShift(oauthCode: string): Promise<mixed>
}

class SwapActivateShapeshiftComponent extends Component<Props> {
  done: boolean

  onNavigate = async (navstate: Object) => {
    if (navstate.url.startsWith('https://developer.airbitz.co/shapeshift-auth') && !this.done) {
      this.done = true
      Actions.pop()

      const code = navstate.url.replace('https://developer.airbitz.co/shapeshift-auth?code=', '')
      showActivity(s.strings.activity_activating_shapeshift, this.props.activateShapeShift(code))
    }
  }

  render () {
    return (
      <SceneWrapper background="body" hasTabs={false}>
        <WebView
          source={{
            uri:
              'https://auth.shapeshift.io/oauth/authorize?response_type=code&scope=users%3Aread&client_id=3a49c306-8c52-42a2-b7cf-bda4e4aa6d7d&redirect_uri=https%3A%2F%2Fdeveloper.airbitz.co%2Fshapeshift-auth'
          }}
          incognito
          onNavigationStateChange={this.onNavigate}
          userAgent={
            'Mozilla/5.0 (Linux; Android 6.0.1; SM-G532G Build/MMB29T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.83 Mobile Safari/537.36'
          }
        />
      </SceneWrapper>
    )
  }
}

export const SwapActivateShapeshiftScene = connect(
  (state: ReduxState) => ({}),
  (dispatch: Dispatch) => ({
    activateShapeShift (oauthCode: string) {
      return dispatch(activateShapeShift(oauthCode)).catch(error => dispatch(displayErrorAlert(error)))
    }
  })
)(SwapActivateShapeshiftComponent)
