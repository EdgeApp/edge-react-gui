// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import fioLogo from '../../assets/images/fio/fio_logo.png'
import { SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../../constants/WalletAndCurrencyConstants'
import { formatDate, formatNumber } from '../../locales/intl'
import s from '../../locales/strings.js'
import { convertCurrency } from '../../selectors/WalletSelectors'
import { useEffect, useState } from '../../types/reactHooks.js'
import { connect } from '../../types/reactRedux'
import type { RouteProp } from '../../types/routerTypes'
import { Actions } from '../../types/routerTypes.js'
import { convertNativeToDenomination, getDefaultDenomination, getDenomination, getFiatSymbol } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ClickableText } from '../themed/ClickableText.js'
import { EdgeText } from '../themed/EdgeText.js'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader.js'
import { Tile } from '../themed/Tile.js'

type OwnProps = {
  route: RouteProp<'stakingOverview'>
}
type StateProps = {
  currencyWallet: EdgeCurrencyWallet,
  stakingCryptoAmountFormat: string,
  stakingFiatBalanceFormat: string,
  currencyDenomination: EdgeDenomination,
  fiatCurrencyCode: string,
  fiatSymbol: string,
  numTransactions: number
}
type Lock = {
  id: string,
  day: number,
  title: string,
  amount: string
}
type Props = StateProps & OwnProps & ThemeProps

export const StakingOverviewSceneComponent = (props: Props) => {
  const {
    theme,
    route: {
      params: { currencyCode, walletId }
    },
    currencyWallet,
    stakingCryptoAmountFormat,
    stakingFiatBalanceFormat,
    currencyDenomination,
    fiatCurrencyCode,
    fiatSymbol,
    numTransactions
  } = props
  const styles = getStyles(theme)
  const [locks, setLocks] = useState<Lock[]>([])

  const fetchLockPeriods = async () => {
    const lockPeriod = SPECIAL_CURRENCY_INFO[currencyCode].stakeLockPeriod != null ? SPECIAL_CURRENCY_INFO[currencyCode].stakeLockPeriod : 0
    const startDate = new Date(new Date().getTime() - lockPeriod)
    const txs: EdgeTransaction[] = await currencyWallet.getTransactions({ startDate, currencyCode: `${currencyCode}${STAKING_BALANCES.locked}` })
    if (txs.length) {
      setLocks(
        txs.reduce((acc, { txid: id, nativeAmount, date, otherParams, metadata }) => {
          const untilDate = new Date(date * 1000 + lockPeriod)
          const amount = bns.add(convertNativeToDenomination(currencyDenomination.multiplier)(nativeAmount), '0')
          const existingLock = acc.find(({ day }) => day === untilDate.getDay())
          if (existingLock != null) {
            existingLock.amount = formatNumber(bns.add(existingLock.amount, amount))
            return acc
          }

          acc.push({
            id,
            day: untilDate.getDay(),
            title: `Unstaked and locked until ${formatDate(untilDate, true)}`,
            amount: formatNumber(amount)
          })
          return acc
        }, [])
      )
    }
  }
  useEffect(() => {
    fetchLockPeriods()
  }, [])
  useEffect(() => {
    fetchLockPeriods()
  }, [numTransactions])

  const handlePressStake = () => {
    Actions.jump('stakingChange', { change: 'add', currencyCode, walletId })
  }
  const handlePressUnstake = () => {
    Actions.jump('stakingChange', { change: 'remove', currencyCode, walletId })
  }

  const renderItems = () =>
    locks.map(item => {
      const amount = `${item.amount} ${currencyCode}`
      return (
        <Tile key={item.id} type="static" title={item.title}>
          <EdgeText>{amount}</EdgeText>
        </Tile>
      )
    })

  const staked = `${stakingCryptoAmountFormat} ${currencyCode}`
  const fiatStaked = `(${fiatSymbol}${stakingFiatBalanceFormat} ${fiatCurrencyCode})`

  return (
    <SceneWrapper background="header" hasTabs={false}>
      <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_overview_header, currencyCode)} underline withTopMargin>
        <Image style={styles.currencyLogo} source={fioLogo} />
      </SceneHeader>
      <ScrollView style={styles.scrollContainer}>
        <EdgeText style={styles.explainerText}>{s.strings.staking_overview_explainer}</EdgeText>
        <Tile type="static" title="Currently Staked">
          <EdgeText>
            {staked}
            <EdgeText style={styles.fiatAmount}>{fiatStaked}</EdgeText>
          </EdgeText>
        </Tile>
        {renderItems()}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <MainButton onPress={handlePressStake} type="secondary" label={s.strings.staking_stake_funds_button} />
        <ClickableText onPress={handlePressUnstake} label={s.strings.staking_unstake_funds_button} />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
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
  scrollContainer: {
    flex: 1,
    marginVertical: theme.rem(0.5)
  },
  explainerText: {
    marginVertical: theme.rem(0.5),
    marginHorizontal: theme.rem(1)
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: theme.rem(0.5)
  },
  fiatAmount: {
    color: theme.secondaryText
  }
}))

export const StakingOverviewScene = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const {
      route: {
        params: { walletId, currencyCode }
      }
    } = ownProps
    const currencyWallet = state.core.account.currencyWallets[walletId]
    const guiWallet = state.ui.wallets.byId[walletId]

    const stakingCurrencyCode = `${currencyCode}${STAKING_BALANCES.staked}`

    const currencyDenomination = getDenomination(currencyCode, state.ui.settings, 'display')
    const stakingCryptoAmountFormat = formatNumber(
      bns.add(convertNativeToDenomination(currencyDenomination.multiplier)(guiWallet.nativeBalances[stakingCurrencyCode] || '0'), '0')
    )

    const defaultDenomination = getDefaultDenomination(currencyCode, state.ui.settings)
    const stakingDefaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(guiWallet.nativeBalances[stakingCurrencyCode] || '0')
    const stakingFiatBalance = convertCurrency(state, currencyCode, guiWallet.isoFiatCurrencyCode, stakingDefaultCryptoAmount)
    const stakingFiatBalanceFormat = formatNumber(stakingFiatBalance && bns.gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0, { toFixed: 2 })

    return {
      currencyWallet,
      stakingCryptoAmountFormat,
      stakingFiatBalanceFormat,
      currencyDenomination,
      numTransactions: state.ui.scenes.transactionList.numTransactions,
      fiatCurrencyCode: guiWallet.fiatCurrencyCode,
      fiatSymbol: getFiatSymbol(guiWallet.isoFiatCurrencyCode)
    }
  },
  dispatch => ({})
)(withTheme(StakingOverviewSceneComponent))
