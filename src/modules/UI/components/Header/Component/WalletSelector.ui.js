// @flow

import * as React from 'react'
import { View } from 'react-native'

import { TouchableTextIcon } from '../../../../../components/common/TouchableTextIcon.js'
import s from '../../../../../locales/strings'
import { B } from '../../../../../styles/common/textStyles.js'
import { type RootState } from '../../../../../types/reduxTypes.js'
import T from '../../FormattedText/FormattedText.ui.js'
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
      <View style={styles.textIconContainer}>
        <TouchableTextIcon
          onPress={this.props.onPress}
          title={
            <T style={styles.iconText} ellipsizeMode="middle" numberOfLines={1}>
              {this.props.selectedWalletName ? (
                <>
                  {this.props.selectedWalletName}: <B>{this.props.selectedWalletCurrencyCode}</B>
                </>
              ) : (
                s.strings.loading
              )}
            </T>
          }
        />
      </View>
    )
  }
}
