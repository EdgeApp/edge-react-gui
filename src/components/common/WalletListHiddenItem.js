// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { SwipeRow } from 'react-native-swipe-list-view'

import { WALLET_LIST_OPTIONS_ICON } from '../../constants/indexConstants.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  currencyCode?: string,
  isToken?: boolean,
  swipeRow?: SwipeRow,
  symbolImage?: string,
  walletId: string,
  walletName?: string
}

class WalletListHiddenItemComponent extends React.PureComponent<Props & ThemeProps> {
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
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.hiddenRowContainer}>
        <TouchableOpacity style={styles.hiddernRowOptionsButton} onPress={this.handleOpenWalletListMenuModal}>
          <EdgeText style={styles.hiddenRowOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</EdgeText>
        </TouchableOpacity>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  hiddenRowContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: theme.rem(5.75),
    marginBottom: theme.rem(1 / 16)
  },
  hiddernRowOptionsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    top: 0,
    right: 0,
    width: theme.rem(2.5),
    backgroundColor: theme.sliderTabMore
  },
  hiddenRowOptionsIcon: {
    fontSize: theme.rem(1.25)
  }
}))

export const WalletListHiddenItem = withTheme(WalletListHiddenItemComponent)
