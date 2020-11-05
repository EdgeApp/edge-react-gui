// @flow

import * as React from 'react'
import { ActivityIndicator, TouchableHighlight, View } from 'react-native'

import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  walletId?: string
}

class WalletListEmptyRowComponent extends React.PureComponent<Props & ThemeProps> {
  handleOpenWalletListMenuModal = async () => {
    if (this.props.walletId) {
      await Airship.show(bridge => <WalletListMenuModal bridge={bridge} walletId={this.props.walletId} />)
    }
  }

  render() {
    const { theme } = this.props
    const styles = getStyles(theme)
    return (
      <TouchableHighlight activeOpacity={theme.underlayOpacity} undelayColor={theme.underlayColor} onLongPress={this.handleOpenWalletListMenuModal}>
        <View style={styles.container}>
          <ActivityIndicator color={theme.primaryText} size="large" />
        </View>
      </TouchableHighlight>
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
  }
}))

export const WalletListEmptyRow = withTheme(WalletListEmptyRowComponent)
