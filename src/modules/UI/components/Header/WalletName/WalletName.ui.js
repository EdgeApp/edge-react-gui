// @flow

import React from 'react'
import { Text, View } from 'react-native'

import s from '../../../../../locales/strings.js'
import { B } from '../../../../../styles/common/textStyles.js'
import style, { walletSelectorStyles } from '../style'

export type Props = {
  name: ?string,
  denomination: ?string
}

class WalletName extends React.Component<Props> {
  render () {
    const { name, denomination } = this.props

    if (name) {
      return (
        <View style={style.headerNameContainer}>
          <Text style={walletSelectorStyles.text} ellipsizeMode={'middle'} numberOfLines={1}>
            {name}:<B>{denomination}</B>
          </Text>
        </View>
      )
    }

    return (
      <View style={style.headerNameContainer}>
        <Text style={walletSelectorStyles.text} ellipsizeMode={'middle'} numberOfLines={1}>
          {s.strings.loading}
        </Text>
      </View>
    )
  }
}
export { WalletName }
