// @flow

import * as React from 'react'
import { ActivityIndicator, StyleSheet, TouchableHighlight, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'

type Props = {
  walletId?: string
}

export class WalletListEmptyRow extends React.PureComponent<Props> {
  handleOpenWalletListMenuModal = async () => {
    await Airship.show(bridge => <WalletListMenuModal bridge={bridge} walletId={this.props.walletId || ''} />)
  }

  render() {
    return (
      <TouchableHighlight
        style={[styles.rowContainer, styles.emptyRow]}
        underlayColor={THEME.COLORS.ROW_PRESSED}
        onLongPress={this.handleOpenWalletListMenuModal}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowNameTextWrap}>
            <ActivityIndicator style={{ height: 18, width: 18 }} />
          </View>
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
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
