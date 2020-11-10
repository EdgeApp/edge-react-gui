// @flow

import * as React from 'react'
import { ActivityIndicator, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import { SwipeRow } from 'react-native-swipe-list-view'

import { WALLET_LIST_OPTIONS_ICON } from '../../constants/indexConstants.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  walletId?: string,
  rowKey: string,
  swipeRef: ?React.ElementRef<typeof SwipeRow>,
  rowMap: { [string]: SwipeRow }
}

class WalletListEmptyRowComponent extends React.PureComponent<Props & ThemeProps> {
  handleOpenWalletListMenuModal = async () => {
    const { rowKey, rowMap } = this.props
    rowMap[rowKey].closeRow()
    if (this.props.walletId) {
      await Airship.show(bridge => <WalletListMenuModal bridge={bridge} walletId={this.props.walletId} />)
    }
  }

  handleRowOpen = () => {
    const { rowKey, rowMap } = this.props
    for (const key in rowMap) {
      if (rowMap.hasOwnProperty(key) && key !== rowKey) {
        rowMap[key].closeRow()
      }
    }
  }

  render() {
    const { theme } = this.props
    const styles = getStyles(theme)
    return (
      <SwipeRow onRowOpen={this.handleRowOpen} rightOpenValue={theme.rem(-2.5)} disableRightSwipe ref={this.props.swipeRef} useNativeDriver>
        <View style={styles.swipeContainer}>
          <TouchableOpacity style={styles.swipeButton} onPress={this.handleOpenWalletListMenuModal}>
            <EdgeText style={styles.swipeIcon}>{WALLET_LIST_OPTIONS_ICON}</EdgeText>
          </TouchableOpacity>
        </View>
        <TouchableHighlight activeOpacity={theme.underlayOpacity} undelayColor={theme.underlayColor} onLongPress={this.handleOpenWalletListMenuModal}>
          <View style={styles.container}>
            <ActivityIndicator color={theme.primaryText} size="large" />
          </View>
        </TouchableHighlight>
      </SwipeRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.rem(0.75),
    height: theme.rem(5.75),
    marginBottom: theme.rem(1 / 16),
    backgroundColor: theme.tileBackground
  },
  swipeContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: theme.rem(5.75),
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
