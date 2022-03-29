// @flow

import type { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyInfo } from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  currencyCode: string,
  exchangeData?: {
    exchangeRateText: string,
    exchangeRateType: 'neutral' | 'positive' | 'negative'
  } | null,
  children?: React.Node,
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

export const WalletListRow = (props: Props) => {
  const { exchangeData, currencyCode, walletId, children, gradient = false, icon, editIcon, onPress, onLongPress, walletName } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const guiWallet = useSelector(state => (walletId ? state.ui.wallets.byId[walletId] : null))
  const { allCurrencyInfos } = useSelector(state => state.ui.settings.plugins)
  const currencyInfo: EdgeCurrencyInfo | void = getCurrencyInfo(allCurrencyInfos, currencyCode)

  const walletNameString = walletName ?? guiWallet?.name ?? `My ${currencyInfo?.displayName ?? ''}`
  const loading = walletId != null && guiWallet == null

  const WalletRow = ({ children }) =>
    gradient ? <Gradient style={styles.containerGradient}>{children}</Gradient> : <View style={styles.container}>{children}</View>

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
              <View style={styles.detailsLeft}>
                <EdgeText style={styles.detailsCurrency} disableFontScaling>
                  {currencyCode}
                </EdgeText>
                {exchangeData != null ? (
                  <EdgeText style={styles[exchangeData.exchangeRateType]} disableFontScaling>
                    {exchangeData.exchangeRateText}
                  </EdgeText>
                ) : null}
              </View>
              <View style={styles.detailsRight}>{editIcon ? <View style={styles.editIcon}>{editIcon}</View> : null}</View>

              <EdgeText style={styles.detailsName} disableFontScaling>
                {walletNameString}
              </EdgeText>
            </View>
            {children}
          </View>
        )}
      </TouchableOpacity>
    </WalletRow>
  )
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
    flexDirection: 'column',
    marginRight: theme.rem(0.5)
  },
  detailsCurrency: {
    fontFamily: theme.fontFaceMedium,
    marginRight: theme.rem(0.75)
  },
  detailsName: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  detailsLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  detailsRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  // Difference Percentage Styles
  neutral: {
    color: theme.secondaryText
  },
  positive: {
    color: theme.positiveText
  },
  negative: {
    color: theme.negativeText
  }
}))
