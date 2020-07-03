// @flow

import React, { Component } from 'react'
import { ActivityIndicator, StyleSheet, TouchableHighlight, View } from 'react-native'

import { type WalletListMenuKey } from '../../actions/WalletListMenuActions.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale, scaleH } from '../../util/scaling.js'
import { WalletListMenu } from './WalletListMenu.js'

type Props = {
  walletId?: string,
  executeWalletRowOption?: (walletId: string, option: WalletListMenuKey) => void
}

export class WalletListEmptyRow extends Component<Props> {
  render() {
    const { walletId, executeWalletRowOption } = this.props
    return (
      <TouchableHighlight style={[styles.rowContainer, styles.emptyRow]} underlayColor={THEME.COLORS.ROW_PRESSED}>
        <View style={styles.rowContent}>
          <View style={styles.rowNameTextWrap}>
            <ActivityIndicator style={{ height: 18, width: 18 }} />
          </View>
          {walletId && executeWalletRowOption && (
            <View style={styles.rowOptionsWrap}>
              <WalletListMenu customStyles={customWalletListOptionsStyles} executeWalletRowOption={executeWalletRowOption} walletId={walletId} />
            </View>
          )}
        </View>
      </TouchableHighlight>
    )
  }
}

const customWalletListOptionsStyles = StyleSheet.create({
  icon: {
    fontSize: scale(21),
    fontWeight: '200',
    position: 'relative',
    top: 6
  },
  menuIconWrap: {
    width: scale(46),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start'
  }
})

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
    width: scaleH(37)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
