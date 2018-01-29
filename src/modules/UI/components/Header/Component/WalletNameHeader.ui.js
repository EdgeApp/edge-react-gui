// @flow
import React from 'react'
import {Text, View} from 'react-native'

import style from '../style'

type Props = {
  styles: {
    textStyles: Array<{}>
  },
  name: string,
  selectedWalletCurrencyCode: string
}

class WalletNameHeader extends React.Component<Props> {
  render () {
    const {styles = {}} = this.props
    const textStyles = styles.textStyles || []
    const name = this.props.name
    const selectedWalletCurrencyCode = this.props.selectedWalletCurrencyCode

    return (
      <View style={style.headerNameContainer}>
        <Text
          style={textStyles}
          ellipsizeMode={'middle'}
          numberOfLines={1}
        >
          {name}:
          <Text style={[style.cCode, ...textStyles]}>
            {selectedWalletCurrencyCode}
          </Text>
        </Text>
      </View>
    )
  }
}
export {WalletNameHeader}
