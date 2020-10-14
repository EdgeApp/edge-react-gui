// @flow

import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import s from '../../../../../locales/strings'
import { B } from '../../../../../styles/common/textStyles.js'
import THEME from '../../../../../theme/variables/airbitz'
import { type RootState } from '../../../../../types/reduxTypes.js'
import { scale } from '../../../../../util/scaling.js'
import styles from '../style'

export type StateProps = {
  selectedWalletName: string | null,
  selectedWalletCurrencyCode: string
}

export type DispatchProps = {
  onPress: () => any | null
}

type Props = StateProps & DispatchProps

export default class WalletSelector extends React.Component<Props, RootState> {
  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress} style={styles.textIconContainer}>
        <Text style={styles.iconText} ellipsizeMode="middle" numberOfLines={1}>
          {this.props.selectedWalletName ? (
            <>
              {this.props.selectedWalletName}: <B>{this.props.selectedWalletCurrencyCode}</B>
            </>
          ) : (
            s.strings.loading
          )}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" color={THEME.COLORS.WHITE} size={scale(25)} />
      </TouchableOpacity>
    )
  }
}
