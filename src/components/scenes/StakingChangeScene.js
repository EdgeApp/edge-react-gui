// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { Image, View } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions'
import fioLogo from '../../assets/images/fio/fio_logo.png'
import { SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../../constants/WalletAndCurrencyConstants'
import { formatDate, formatNumber } from '../../locales/intl'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import { convertCurrency } from '../../selectors/WalletSelectors'
import { useEffect, useState } from '../../types/reactHooks'
import { connect } from '../../types/reactRedux'
import type { NavigationProp, RouteProp } from '../../types/routerTypes'
import type { FioAddress } from '../../types/types'
import { convertNativeToDenomination, getDefaultDenomination, getDenomination } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { FlipInputModal } from '../modals/FlipInputModal'
import { Airship, showToast } from '../services/AirshipInstance'
import { type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts'
import { SceneHeader } from '../themed/SceneHeader.js'
import { ThemedModal } from '../themed/ThemedModal'
import { Tile } from '../themed/Tile.js'

type OwnProps = {
  route: RouteProp<'stakingChange'>,
  navigation: NavigationProp<'stakingChange'>
}

type StateProps = {
  stakingBalances: {
    [cCode: string]: {
      native: string,
      crypto: string,
      fiat: string
    }
  },
  currencyWallet: EdgeCurrencyWallet,
  currencyDenomination: EdgeDenomination,
  fioAddresses: FioAddress[]
}
type DispatchProps = {
  refreshAllFioAddresses: () => void
}
type Props = StateProps & OwnProps & DispatchProps & ThemeProps

const makeSpendInfo = (nativeAmount: string, name: string, params: any) => {
  return {
    spendTargets: [
      {
        nativeAmount,
        publicAddress: ''
      }
    ],
    otherParams: {
      action: {
        name,
        params
      }
    }
  }
}

export const StakingChangeSceneComponent = (props: Props) => {
  const {
    theme,
    route: {
      params: { change, currencyCode, walletId }
    },
    currencyWallet,
    currencyDenomination,
    stakingBalances,
    navigation,
    fioAddresses
  } = props
  const styles = getStyles(theme)

  const [amount, setAmount] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tx, setTx] = useState(null)

  const onAmountChanged = (nativeAmount: string, exchangeAmount: string) => {
    setAmount(exchangeAmount)

    const actionName = SPECIAL_CURRENCY_INFO[currencyCode].stakeActions != null ? SPECIAL_CURRENCY_INFO[currencyCode].stakeActions[change] : ''
    currencyWallet
      .makeSpend(
        makeSpendInfo(nativeAmount, actionName, {
          fioAddress: fioAddresses.length > 0 ? fioAddresses[0].name : ''
        })
      )
      .then(tx => {
        setError(null)
        setTx(tx)
      })
      .catch(error => {
        setError(error)
      })
  }
  const onMaxSet = () => {
    switch (change) {
      case 'add': {
        currencyWallet
          .getMaxSpendable({
            currencyCode,
            spendTargets: [{ nativeAmount: '', otherParams: {}, publicAddress: '' }]
          })
          .then(nativeAmount => {
            onAmountChanged(nativeAmount, bns.add(convertNativeToDenomination(currencyDenomination.multiplier)(nativeAmount), '0'))
          })
        break
      }
      case 'remove': {
        onAmountChanged(
          stakingBalances[`${currencyCode}${STAKING_BALANCES.staked}`].native,
          stakingBalances[`${currencyCode}${STAKING_BALANCES.staked}`].crypto
        )
        break
      }
      default:
    }
  }
  const onFeesChange = () => {
    // todo
  }

  const handleSubmit = async () => {
    if (tx == null) return setError(s.strings.create_wallet_account_error_sending_transaction)
    setLoading(true)
    try {
      const signedTx = await currencyWallet.signTx(tx)
      await currencyWallet.broadcastTx(signedTx)
      const messages = {
        add: s.strings.staking_success,
        remove: s.strings.staking_unstake_success
      }
      showToast(messages[change])
      navigation.goBack()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const handleAmount = () => {
    Airship.show(bridge => (
      <FlipInputModal
        bridge={bridge}
        walletId={walletId}
        currencyCode={currencyCode}
        onFeesChange={onFeesChange}
        onAmountChanged={onAmountChanged}
        onMaxSet={onMaxSet}
      />
    )).catch(error => setError(error))
  }

  const handleUnlockDate = () => {
    Airship.show(bridge => {
      return (
        <ThemedModal bridge={bridge} onCancel={bridge.resolve} paddingRem={1}>
          <ModalTitle icon={<MaterialCommunityIcons name="chart-line" size={theme.rem(2)} color={theme.iconTappable} />}>
            {s.strings.staking_change_unlock_explainer_title}
          </ModalTitle>
          <ModalMessage>{s.strings.staking_change_unlock_explainer1}</ModalMessage>
          <ModalMessage>{s.strings.staking_change_unlock_explainer2}</ModalMessage>
          <ModalCloseArrow onPress={bridge.resolve} />
        </ThemedModal>
      )
    })
  }

  useEffect(() => {
    props.refreshAllFioAddresses()
  }, [])

  const sliderDisabled = tx == null || amount == null || amount === '0' || error != null

  const renderAdd = () => {
    return (
      <>
        <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_add_header, currencyCode)} underline withTopMargin>
          <Image style={styles.currencyLogo} source={fioLogo} />
        </SceneHeader>
        <View style={styles.explainer}>
          <ModalMessage>{s.strings.staking_change_explaner1}</ModalMessage>
          <ModalMessage>{s.strings.staking_change_explaner2}</ModalMessage>
        </View>
        <Tile type="editable" title={s.strings.staking_change_add_amount_title} onPress={handleAmount}>
          <EdgeText style={styles.amountText}>{amount}</EdgeText>
        </Tile>
      </>
    )
  }

  const renderRemove = () => {
    let unlockDate = ''
    if (SPECIAL_CURRENCY_INFO[currencyCode].stakeLockPeriod != null) {
      unlockDate = formatDate(new Date(new Date().getTime() + SPECIAL_CURRENCY_INFO[currencyCode].stakeLockPeriod), true)
    }
    let estReward = '0'
    if (tx != null && tx.otherParams != null && tx.otherParams.ui != null && tx.otherParams.ui.estReward != null) {
      estReward = bns.add(convertNativeToDenomination(currencyDenomination.multiplier)(tx.otherParams.ui.estReward), '0')
    }
    return (
      <>
        <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_remove_header, currencyCode)} underline withTopMargin>
          <Image style={styles.currencyLogo} source={fioLogo} />
        </SceneHeader>
        <Tile type="editable" title={s.strings.staking_change_remove_amount_title} onPress={handleAmount}>
          <EdgeText style={styles.amountText}>{amount}</EdgeText>
        </Tile>
        {estReward !== '0' && (
          <Tile type="static" title={s.strings.staking_estimated_rewards}>
            <EdgeText style={styles.amountText}>{estReward}</EdgeText>
          </Tile>
        )}
        <Tile type="questionable" title={s.strings.staking_change_remove_unlock_date} onPress={handleUnlockDate}>
          <EdgeText>{unlockDate}</EdgeText>
        </Tile>
      </>
    )
  }

  const renderError = () => {
    if (error == null) return null

    return (
      <Tile type="static" title={s.strings.send_scene_error_title}>
        <EdgeText style={styles.errorMessage} numberOfLines={3}>
          {error.toString()}
        </EdgeText>
      </Tile>
    )
  }

  return (
    <SceneWrapper background="theme">
      {(() => {
        switch (change) {
          case 'add':
            return renderAdd()
          case 'remove':
            return renderRemove()
          default:
            return null
        }
      })()}
      {renderError()}
      <View style={styles.sliderContainer}>
        <Slider onSlidingComplete={handleSubmit} disabled={sliderDisabled} showSpinner={loading} />
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
  explainer: {
    margin: theme.rem(0.5)
  },
  amountText: {
    fontSize: theme.rem(2)
  },
  sliderContainer: {
    paddingVertical: theme.rem(2)
  },
  errorMessage: {
    color: theme.dangerText
  }
}))

export const StakingChangeScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    const {
      route: {
        params: { walletId, currencyCode }
      }
    } = ownProps
    const currencyWallet = state.core.account.currencyWallets[walletId]
    const guiWallet = state.ui.wallets.byId[walletId]
    const stakingBalances = {}

    const currencyDenomination = getDenomination(currencyCode, state.ui.settings, 'display')
    const defaultDenomination = getDefaultDenomination(currencyCode, state.ui.settings)

    if (SPECIAL_CURRENCY_INFO[currencyCode].isStakingSupported) {
      for (const cCodeKey in STAKING_BALANCES) {
        const stakingCurrencyCode = `${currencyCode}${STAKING_BALANCES[cCodeKey]}`

        const stakingNativeAmount = guiWallet.nativeBalances[stakingCurrencyCode] || '0'
        const stakingCryptoAmount: string = convertNativeToDenomination(currencyDenomination.multiplier)(stakingNativeAmount)
        const stakingCryptoAmountFormat = formatNumber(bns.add(stakingCryptoAmount, '0'))

        const stakingDefaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(stakingNativeAmount)
        const stakingFiatBalance = convertCurrency(state, currencyCode, guiWallet.isoFiatCurrencyCode, stakingDefaultCryptoAmount)
        const stakingFiatBalanceFormat = formatNumber(stakingFiatBalance && bns.gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0, { toFixed: 2 })

        stakingBalances[stakingCurrencyCode] = {
          native: stakingNativeAmount,
          crypto: stakingCryptoAmountFormat,
          fiat: stakingFiatBalanceFormat
        }
      }
    }
    return {
      stakingBalances,
      currencyWallet,
      currencyDenomination,
      fioAddresses: state.ui.scenes.fioAddress.fioAddresses
    }
  },
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(StakingChangeSceneComponent))
