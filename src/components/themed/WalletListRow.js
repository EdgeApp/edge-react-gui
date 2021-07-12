// @flow

import type { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { connect } from '../../types/reactRedux.js'
import { getCurrencyInfo } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, useTheme, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type OwnProps = {
  currencyCode: string,
  children?: React.Node,
  exchangeRateString?: string,
  exchangeRateType?: 'Neutral' | 'Positive' | 'Negative',
  icon?: React.Node,
  editIcon?: React.Node,
  gradient?: boolean,
  onPress?: () => void,
  onLongPress?: () => void,
  // eslint-disable-next-line react/no-unused-prop-types
  walletId?: string,
  // eslint-disable-next-line react/no-unused-prop-types
  walletName?: string
}

type StateProps = {
  loading: boolean,
  walletNameString: string
}

type Props = OwnProps & StateProps & ThemeProps

function WalletRow(props: { gradient?: boolean, children: React.Node }) {
  const { gradient, children } = props
  const styles = getStyles(useTheme())

  if (gradient === true) {
    return <Gradient style={styles.containerGradient}>{children}</Gradient>
  }

  return <View style={styles.container}>{children}</View>
}

class WalletListRowComponent extends React.PureComponent<Props> {
  render() {
    const {
      currencyCode,
      children,
      exchangeRateString = '',
      exchangeRateType = 'Neutral',
      gradient = false,
      icon,
      editIcon,
      loading = false,
      onPress,
      onLongPress,
      walletNameString,
      theme
    } = this.props
    const styles = getStyles(theme)

    return (
      <WalletRow gradient={gradient}>
        <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
          {loading === true ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={theme.primaryText} size="large" />
            </View>
          ) : (
            <View style={styles.rowContainer}>
              <View style={styles.iconContainer}>{icon}</View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailsRow}>
                  <EdgeText style={[styles.detailsCurrency, { width: theme.rem(2.75) }]}>{currencyCode}</EdgeText>
                  <EdgeText style={styles[`percentage${exchangeRateType}`]}>{exchangeRateString}</EdgeText>
                  {editIcon ? <View style={styles.editIcon}>{editIcon}</View> : null}
                </View>
                <EdgeText style={styles.detailsName}>{walletNameString}</EdgeText>
              </View>
              {children}
            </View>
          )}
        </TouchableOpacity>
      </WalletRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Row Component
  containerGradient: {
    flex: 1,
    paddingHorizontal: theme.rem(1)
  },
  container: {
    backgroundColor: theme.modal
  },

  // Row Containers
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    marginVertical: theme.rem(1)
  },
  loaderContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(4.25),
    paddingHorizontal: theme.rem(1.75)
  },

  // Icons
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  editIcon: {
    marginLeft: theme.rem(0.75)
  },

  // Details
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '70%'
  },
  detailsCurrency: {
    fontFamily: theme.fontFaceBold
  },
  detailsName: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },

  // Difference Percentage Styles
  percentageNeutral: {
    color: theme.secondaryText
  },
  percentagePositive: {
    color: theme.positiveText
  },
  percentageNegative: {
    color: theme.negativeText
  }
}))

export const WalletListRow = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { currencyCode, walletId, walletName } = ownProps
    const guiWallet = walletId ? state.ui.wallets.byId[walletId] : null
    let walletNameString = walletName
    if (walletNameString == null) {
      if (guiWallet != null) {
        walletNameString = guiWallet.name
      } else {
        const { allCurrencyInfos } = state.ui.settings.plugins
        const currencyInfo: EdgeCurrencyInfo | void = getCurrencyInfo(allCurrencyInfos, currencyCode)
        walletNameString = `My ${currencyInfo?.displayName ?? ''}`
      }
    }

    return {
      loading: walletId != null && guiWallet == null,
      walletNameString
    }
  },
  dispatch => ({})
)(withTheme(WalletListRowComponent))
