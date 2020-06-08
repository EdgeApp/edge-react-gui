// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, ScrollView } from 'react-native'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants'
import { getActiveWalletCurrencyInfos } from '../../modules/UI/selectors'
import { THEME } from '../../theme/variables/airbitz'
import { type State as ReduxState } from '../../types/reduxTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsRow } from '../common/SettingsRow.js'

type NavigationProps = {}
type StateProps = {
  currencyInfos: Array<EdgeCurrencyInfo>
}
type DispatchProps = {}
type Props = NavigationProps & StateProps & DispatchProps

type State = {}

export class NotificationComponent extends Component<Props, State> {
  render() {
    const rightArrow = <AntDesignIcon name="right" color={THEME.COLORS.GRAY_2} size={THEME.rem(1)} />

    return (
      <SceneWrapper background="body" hasTabs={false}>
        <ScrollView>
          {this.props.currencyInfos.map((currencyInfo: EdgeCurrencyInfo) => {
            const { displayName, symbolImage, currencyCode } = currencyInfo
            const icon = symbolImage != null ? <Image style={styles.currencyLogo} source={{ uri: symbolImage }} /> : undefined
            const onPress = () => Actions[Constants.CURRENCY_NOTIFICATION_SETTINGS]({ currencyInfo })

            return <SettingsRow key={currencyCode} icon={icon} text={displayName} right={rightArrow} onPress={onPress} />
          })}
        </ScrollView>
      </SceneWrapper>
    )
  }
}

export const NotificationScene = connect((state: ReduxState): StateProps => {
  const currencyInfos = getActiveWalletCurrencyInfos(state)

  return {
    currencyInfos
  }
})(NotificationComponent)

const iconSize = THEME.rem(1.375)
const styles = {
  currencyLogo: {
    height: iconSize,
    width: iconSize,
    resizeMode: 'contain'
  }
}
