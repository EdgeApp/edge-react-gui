// @flow

import { PasswordRecoveryScreen } from 'edge-login-ui-rn'
import React, { Component } from 'react'
import { ScrollView, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type Props = {
  account: Object,
  context: Object,
  showHeader: boolean,
  onComplete(): void
}
export default class PasswordRecovery extends Component<Props> {
  render () {
    return (
      <SceneWrapper hasTabs={false} background="body">
        <ScrollView keyboardShouldPersistTaps={'always'}>
          <PasswordRecoveryScreen
            account={this.props.account}
            context={this.props.context}
            onComplete={this.props.onComplete}
            onCancel={this.props.onComplete}
            showHeader={this.props.showHeader}
          />
          <View style={{ backgroundColor: THEME.COLORS.WHITE, height: scale(150) }} />
        </ScrollView>
      </SceneWrapper>
    )
  }
}
