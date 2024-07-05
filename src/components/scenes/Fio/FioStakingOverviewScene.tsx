import { add, gt } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import fioLogo from '../../../assets/images/fio/fio_logo.png'
import { getFiatSymbol } from '../../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useWatch } from '../../../hooks/useWatch'
import { formatNumber, formatTimeDate } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenomByCurrencyCode, selectDisplayDenomByCurrencyCode } from '../../../selectors/DenominationSelectors'
import { convertCurrency } from '../../../selectors/WalletSelectors'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { getFioStakingBalances } from '../../../util/stakeUtils'
import { convertNativeToDenomination } from '../../../util/utils'
import { ButtonsView } from '../../buttons/ButtonsView'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { EdgeRow } from '../../rows/EdgeRow'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

interface OwnProps extends EdgeSceneProps<'fioStakingOverview'> {}

interface StateProps {
  currencyWallet: EdgeCurrencyWallet
  stakingCryptoAmountFormat: string
  stakingFiatBalanceFormat: string
  currencyDenomination: EdgeDenomination
  fiatCurrencyCode: string
  fiatSymbol: string
}
interface DispatchProps {
  refreshAllFioAddresses: () => Promise<void>
}
interface Lock {
  id: string
  title: string
  amount: string
}
type Props = StateProps & DispatchProps & OwnProps & ThemeProps

export const FioStakingOverviewSceneComponent = (props: Props) => {
  const {
    navigation,
    theme,
    route: {
      params: { tokenId, walletId }
    },
    currencyWallet,
    stakingCryptoAmountFormat,
    stakingFiatBalanceFormat,
    currencyDenomination,
    refreshAllFioAddresses,
    fiatCurrencyCode,
    fiatSymbol
  } = props
  const styles = getStyles(theme)
  const [locks, setLocks] = React.useState<Lock[]>([])
  const stakingStatus = useWatch(currencyWallet, 'stakingStatus')
  const currencyCode = getCurrencyCode(currencyWallet, tokenId)

  useAsyncEffect(
    async () => {
      await refreshAllFioAddresses()
    },
    [refreshAllFioAddresses],
    'FioStakingOverviewSceneComponent'
  )

  React.useEffect(() => {
    setLocks(
      stakingStatus.stakedAmounts
        .filter(({ unlockDate }) => unlockDate != null && new Date(unlockDate).getTime() >= new Date().getTime())
        .map(({ nativeAmount, unlockDate }) => {
          const displayAmount = convertNativeToDenomination(currencyDenomination.multiplier)(nativeAmount)
          const formattedAmount = formatNumber(displayAmount)
          return {
            // @ts-expect-error Flow does not understand that unlockDate here can't be undefined
            id: new Date(unlockDate).toDateString(),
            // @ts-expect-error Flow does not understand that unlockDate here can't be undefined
            title: sprintf(lstrings.staking_locked_title, formatTimeDate(new Date(unlockDate), true)),
            amount: formattedAmount
          }
        })
    )
  }, [stakingStatus, currencyDenomination])

  const handlePressStake = () => {
    navigation.navigate('fioStakingChange', { change: 'add', tokenId, walletId })
  }
  const handlePressUnstake = () => {
    navigation.navigate('fioStakingChange', { change: 'remove', tokenId, walletId })
  }

  const renderItems = () =>
    locks.map(item => {
      const amount = `${item.amount} ${currencyCode}`
      return (
        <EdgeRow key={item.id} title={item.title}>
          <EdgeText>{amount}</EdgeText>
        </EdgeRow>
      )
    })

  const staked = `${stakingCryptoAmountFormat} ${currencyCode}`
  const fiatStaked = ` (${fiatSymbol}${stakingFiatBalanceFormat} ${fiatCurrencyCode})`

  return (
    <>
      <SceneWrapper scroll>
        <SceneHeader style={styles.sceneHeader} title={sprintf(lstrings.staking_overview_header, currencyCode)} underline withTopMargin>
          <Image style={styles.currencyLogo} source={fioLogo} />
        </SceneHeader>
        <View style={styles.container}>
          <EdgeText style={styles.explainerText}>{lstrings.staking_overview_explainer}</EdgeText>

          <EdgeCard>
            <EdgeRow title="Currently Staked">
              <EdgeText>
                {staked}
                <EdgeText style={styles.fiatAmount}>{fiatStaked}</EdgeText>
              </EdgeText>
            </EdgeRow>
          </EdgeCard>
          <EdgeCard sections>{renderItems()}</EdgeCard>
        </View>
      </SceneWrapper>

      <ButtonsView
        parentType="scene"
        primary={{ label: lstrings.staking_stake_funds_button, onPress: handlePressStake }}
        tertiary={{ label: lstrings.staking_unstake_funds_button, onPress: handlePressUnstake }}
      />
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  currencyLogo: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    resizeMode: 'contain',
    marginLeft: theme.rem(1)
  },
  container: {
    marginHorizontal: theme.rem(0.5)
  },
  explainerText: {
    marginVertical: theme.rem(0.5),
    marginHorizontal: theme.rem(1)
  },
  buttonContainer: {
    position: 'absolute',
    bottom: theme.rem(1),
    alignSelf: 'center'
  },
  fiatAmount: {
    color: theme.secondaryText
  }
}))

export const FioStakingOverviewScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    const {
      route: {
        params: { walletId, tokenId }
      }
    } = ownProps
    const { account } = state.core
    const { defaultIsoFiat, defaultFiat } = state.ui.settings
    const currencyWallet = account.currencyWallets[walletId]
    const currencyCode = getCurrencyCode(currencyWallet, tokenId)

    const { staked } = getFioStakingBalances(currencyWallet.stakingStatus)
    const stakedNativeAmount = staked

    const currencyDenomination = selectDisplayDenomByCurrencyCode(state, currencyWallet.currencyConfig, currencyCode)
    const stakingCryptoAmountFormat = formatNumber(add(convertNativeToDenomination(currencyDenomination.multiplier)(stakedNativeAmount), '0'))

    const defaultDenomination = getExchangeDenomByCurrencyCode(currencyWallet.currencyConfig, currencyCode)
    const stakingDefaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(stakedNativeAmount ?? '0')
    const stakingFiatBalance = convertCurrency(state, currencyCode, defaultIsoFiat, stakingDefaultCryptoAmount)
    const stakingFiatBalanceFormat = formatNumber(stakingFiatBalance && gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0, { toFixed: 2 })

    return {
      currencyWallet,
      stakingCryptoAmountFormat,
      stakingFiatBalanceFormat,
      currencyDenomination,
      fiatCurrencyCode: defaultFiat,
      fiatSymbol: getFiatSymbol(defaultIsoFiat)
    }
  },
  dispatch => ({
    async refreshAllFioAddresses() {
      await dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioStakingOverviewSceneComponent))
