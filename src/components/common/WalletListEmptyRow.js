// @flow

import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'

import { WALLET_LIST_OPTIONS_ICON } from '../../constants/WalletAndCurrencyConstants.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale, scaleH } from '../../util/scaling.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'

type Props = {
  walletId?: string
}

export class WalletListEmptyRow extends React.Component<Props> {
  openWalletListMenuModal = async () => {
    await Airship.show(bridge => <WalletListMenuModal bridge={bridge} walletId={this.props.walletId || ''} />)
  }

  render() {
    const { walletId } = this.props
    return (
      <TouchableHighlight style={[styles.rowContainer, styles.emptyRow]} underlayColor={THEME.COLORS.ROW_PRESSED}>
        <View style={styles.rowContent}>
          <View style={styles.rowNameTextWrap}>
            <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={{ height: 18, width: 18 }} />
          </View>
          {walletId && (
            <TouchableWithoutFeedback onPress={this.openWalletListMenuModal}>
              <View style={styles.rowOptionsWrap}>
                <Text style={styles.rowOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</Text>
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </TouchableHighlight>
    )
  }
}

const rawStyles = {
  emptyRow: {
    height: scale(60),
    backgroundColor: THEME.COLORS.WHITE,
    padding: scale(16),
    paddingLeft: scale(20),
    paddingRight: scale(20),
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.GRAY_4
  },
  rowContainer: {
    padding: scale(6),
    paddingLeft: scale(8),
    height: scale(106),
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row'
  },
  rowNameTextWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(5)
  },
  rowOptionsWrap: {
    width: scaleH(37),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowOptionsIcon: {
    fontSize: scale(20),
    color: THEME.COLORS.GRAY_1
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
