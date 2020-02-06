// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import React from 'react'
import { Image, View } from 'react-native'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { getPluginInfo } from '../../modules/Settings/selectors.js'
import T from '../../modules/UI/components/FormattedText/index'
import { styles } from '../../styles/MainStyle.js'
import { type State } from '../../types/reduxTypes.js'

type OwnProps = {
  pluginName: string
}
type StateProps = {
  currencyInfo: EdgeCurrencyInfo
}
type Props = StateProps & OwnProps

function CurrencySettingsTitleComponent (props: Props) {
  const { currencyInfo } = props
  const { displayName, symbolImage = '' } = currencyInfo

  const title = sprintf(s.strings.title_crypto_settings, displayName)
  return (
    <View style={styles.titleWrapper}>
      <Image style={styles.titleImage} source={{ uri: symbolImage }} />
      <T style={styles.titleStyle}>{title}</T>
    </View>
  )
}

export const CurrencySettingsTitle = connect(
  (state: State, ownProps: OwnProps): StateProps => ({
    currencyInfo: getPluginInfo(state, ownProps.pluginName)
  })
)(CurrencySettingsTitleComponent)
