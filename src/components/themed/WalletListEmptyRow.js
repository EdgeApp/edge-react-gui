// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { SwipeRow } from 'react-native-swipe-list-view'

import { WALLET_LIST_OPTIONS_ICON } from '../../constants/indexConstants.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletListRow } from './WalletListRow.js'

type Props = {
  walletId?: string,
  isModal?: boolean,
  swipeRef: ?React.ElementRef<typeof SwipeRow>,
  swipeRow?: SwipeRow
}

class WalletListEmptyRowComponent extends React.PureComponent<Props & ThemeProps> {
  closeRow = () => {
    const { swipeRow } = this.props
    if (swipeRow) {
      swipeRow.closeRow()
    }
  }

  handleOpenWalletListMenuModal = () => {
    this.closeRow()
    if (this.props.walletId) {
      Airship.show(bridge => <WalletListMenuModal bridge={bridge} walletId={this.props.walletId} />)
    }
  }

  render() {
    const { isModal, walletId, theme } = this.props
    const styles = getStyles(theme)
    return (
      <SwipeRow {...this.props} rightOpenValue={theme.rem(-2.5)} disableRightSwipe disableLeftSwipe={isModal} ref={this.props.swipeRef} useNativeDriver>
        <View style={styles.swipeContainer}>
          <TouchableOpacity style={styles.swipeButton} onPress={this.handleOpenWalletListMenuModal}>
            <EdgeText style={styles.swipeIcon}>{WALLET_LIST_OPTIONS_ICON}</EdgeText>
          </TouchableOpacity>
        </View>
        <WalletListRow currencyCode="" isModal={isModal} onLongPress={this.handleOpenWalletListMenuModal} walletId={walletId} walletName="" />
      </SwipeRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  swipeContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: theme.rem(4.5),
    marginBottom: theme.rem(1 / 16)
  },
  swipeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    top: 0,
    right: 0,
    width: theme.rem(2.5),
    backgroundColor: theme.sliderTabMore
  },
  swipeIcon: {
    fontSize: theme.rem(1.25)
  }
}))

const WalletListEmptyRowInner = withTheme(WalletListEmptyRowComponent)
// $FlowFixMe - forwardRef is not recognize by flow?
const WalletListEmptyRow = React.forwardRef((props, ref) => <WalletListEmptyRowInner {...props} swipeRef={ref} />)
// Lint error about component not having a displayName
WalletListEmptyRow.displayName = 'WalletListEmptyRow'
export { WalletListEmptyRow }
