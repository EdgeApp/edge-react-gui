// @flow

import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SwipeRow } from 'react-native-swipe-list-view'

import { WALLET_LIST_OPTIONS_ICON } from '../../constants/indexConstants.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'

type Props = {
  currencyCode?: string,
  isToken?: boolean,
  swipeRow?: SwipeRow,
  symbolImage?: string,
  walletId: string,
  walletName?: string
}

export class WalletListHiddenItem extends React.PureComponent<Props> {
  handleOpenWalletListMenuModal = (): void => {
    const { currencyCode, isToken, swipeRow, symbolImage, walletId, walletName } = this.props
    Airship.show(bridge => (
      <WalletListMenuModal bridge={bridge} walletId={walletId} walletName={walletName} currencyCode={currencyCode} image={symbolImage} isToken={isToken} />
    ))
    if (swipeRow) {
      swipeRow.closeRow()
    }
  }

  render() {
    return (
      <View style={styles.hiddenRowContainer}>
        <TouchableOpacity style={styles.hiddernRowOptionsButton} onPress={this.handleOpenWalletListMenuModal}>
          <Text style={styles.hiddenRowOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  hiddenRowContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  hiddernRowOptionsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    top: 0,
    right: 0,
    width: THEME.rem(3),
    backgroundColor: THEME.COLORS.ACCENT_BLUE
  },
  hiddenRowOptionsIcon: {
    fontSize: THEME.rem(1.25),
    color: THEME.COLORS.WHITE
  }
})
