// @flow

import { add, gt } from 'biggystring'
import type { EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { Image, View } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions'
import fioLogo from '../../assets/images/fio/fio_logo.png'
import { SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../../constants/WalletAndCurrencyConstants'
import { formatNumber, formatTimeDate } from '../../locales/intl'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrency } from '../../selectors/WalletSelectors'
import { useEffect, useState } from '../../types/reactHooks'
import { connect } from '../../types/reactRedux'
import type { NavigationProp, RouteProp } from '../../types/routerTypes'
import type { FioAddress } from '../../types/types'
import { convertNativeToDenomination } from '../../util/utils'
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
  currencyPlugin: EdgeCurrencyConfig,
  currencyDenomination: EdgeDenomination,
  fioAddresses: FioAddress[]
}
type DispatchProps = {
  refreshAllFioAddresses: () => void
}
type Props = StateProps & OwnProps & DispatchProps & ThemeProps

export const StakingChangeSceneComponent = (props: Props) => {
  const {
    theme,
    route: {
      params: { change, currencyCode, walletId }
    },
    currencyWallet,
    currencyPlugin,
    currencyDenomination,
    stakingBalances,
    navigation,
    fioAddresses
  } = props
  const styles = getStyles(theme)
  const { pluginId } = currencyWallet.currencyInfo

  const maxApy = SPECIAL_CURRENCY_INFO[pluginId]?.stakeMaxApy

  const [nativeAmount, setNativeAmount] = useState('0')
  const [exchangeAmount, setExchangeAmount] = useState('0')
  const [apy, setApy] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tx, setTx] = useState(null)
  const [selectedFioAddress, setSelectedFioAddress] = useState()
  const sliderDisabled = tx == null || exchangeAmount === '0' || error != null

  const onAmountChanged = (nativeAmount: string, exchangeAmount: string) => {
    setExchangeAmount(exchangeAmount)
    setNativeAmount(nativeAmount)
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
            onAmountChanged(nativeAmount, add(convertNativeToDenomination(currencyDenomination.multiplier)(nativeAmount), '0'))
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
        overrideExchangeAmount={exchangeAmount}
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

  useEffect(() => {
    if (currencyPlugin != null && currencyPlugin.otherMethods != null && currencyPlugin.otherMethods.getStakeEstReturn != null) {
      currencyPlugin.otherMethods
        .getStakeEstReturn(exchangeAmount)
        .then(apy => setApy(parseFloat(apy.toFixed(2))))
        .catch(() => {
          //
        })
    }
  }, [exchangeAmount, currencyPlugin])

  useEffect(() => {
    if (!selectedFioAddress && fioAddresses?.length > 0) {
      const fioAddress = fioAddresses
        .filter(({ walletId: fioAddressWalletId }) => fioAddressWalletId === walletId)
        .sort(({ bundledTxs }, { bundledTxs: bundledTxs2 }) => (bundledTxs <= bundledTxs2 ? 1 : -1))[0]

      // If no address is found, we do not define the selectedFioAddress
      if (fioAddress == null) return
      // Addresses must have at least 1 bundled transaction; we rely on bundle txs and don't yet support fee-based tx for staking
      if (fioAddress.bundledTxs < 1) return setError(new Error(sprintf(s.strings.staking_no_bundled_txs_error, fioAddress.name)))

      setSelectedFioAddress(fioAddress.name)
    }
  }, [...fioAddresses, selectedFioAddress])

  // Make spend transaction after amount change
  useEffect(() => {
    if (nativeAmount === '0') return

    let abort = false

    // If the selectedFioAddress is not defined, then we will not be able to complete the transaction.
    if (selectedFioAddress == null) {
      setError(new Error(s.strings.staking_no_fio_address_error))
      return
    }

    const { [change]: actionName } = SPECIAL_CURRENCY_INFO[pluginId]?.stakeActions ?? { [change]: '' }
    currencyWallet
      .makeSpend({
        spendTargets: [
          {
            nativeAmount,
            publicAddress: ''
          }
        ],
        otherParams: {
          action: {
            name: actionName,
            params: {
              fioAddress: selectedFioAddress
            }
          }
        }
      })
      .then(tx => {
        if (abort) return
        setError(null)
        setTx(tx)
      })
      .catch(error => {
        if (abort) return
        setError(error)
      })
    return () => {
      abort = true
    }
  }, [nativeAmount])

  const renderAdd = () => {
    const apyValue = sprintf(apy === maxApy ? s.strings.staking_estimated_return_up_to : s.strings.staking_estimated_return, `${apy}%`)
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
          <EdgeText style={styles.amountText}>{exchangeAmount}</EdgeText>
        </Tile>
        {apy != null && apy !== 0 && (
          <View style={styles.estReturn}>
            <EdgeText>{apyValue}</EdgeText>
          </View>
        )}
      </>
    )
  }

  const renderRemove = () => {
    const unlockDate = tx?.otherParams?.ui.unlockDate
    const unlockDateFormat = unlockDate ? formatTimeDate(unlockDate, true) : ''
    let estReward = '0'
    if (tx != null && tx.otherParams != null && tx.otherParams.ui != null && tx.otherParams.ui.estReward != null) {
      estReward = add(convertNativeToDenomination(currencyDenomination.multiplier)(tx.otherParams.ui.estReward), '0')
    }
    return (
      <>
        <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_remove_header, currencyCode)} underline withTopMargin>
          <Image style={styles.currencyLogo} source={fioLogo} />
        </SceneHeader>
        <Tile type="editable" title={s.strings.staking_change_remove_amount_title} onPress={handleAmount}>
          <EdgeText style={styles.amountText}>{exchangeAmount}</EdgeText>
        </Tile>
        {estReward !== '0' && (
          <Tile type="static" title={s.strings.staking_estimated_rewards}>
            <EdgeText style={styles.amountText}>{estReward}</EdgeText>
          </Tile>
        )}
        <Tile type="questionable" title={s.strings.staking_change_remove_unlock_date} onPress={handleUnlockDate}>
          <EdgeText>{unlockDateFormat}</EdgeText>
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
  },
  estReturn: {
    padding: theme.rem(0.75),
    marginTop: theme.rem(1),
    marginHorizontal: theme.rem(2.5),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.cardBorderColor,
    borderRadius: theme.rem(0.5),
    alignItems: 'center',
    justifyContent: 'center'
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
    const currencyPlugin = state.core.account.currencyConfig[currencyWallet.currencyInfo.pluginId]
    const guiWallet = state.ui.wallets.byId[walletId]
    const stakingBalances = {}

    const currencyDenomination = getDisplayDenomination(state, currencyWallet.currencyInfo.pluginId, currencyCode)
    const defaultDenomination = getExchangeDenomination(state, currencyWallet.currencyInfo.pluginId, currencyCode)

    if (SPECIAL_CURRENCY_INFO[currencyWallet.currencyInfo.pluginId]?.isStakingSupported) {
      for (const cCodeKey in STAKING_BALANCES) {
        const stakingCurrencyCode = `${currencyCode}${STAKING_BALANCES[cCodeKey]}`

        const stakingNativeAmount = guiWallet.nativeBalances[stakingCurrencyCode] || '0'
        const stakingCryptoAmount: string = convertNativeToDenomination(currencyDenomination.multiplier)(stakingNativeAmount)
        const stakingCryptoAmountFormat = formatNumber(add(stakingCryptoAmount, '0'))

        const stakingDefaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(stakingNativeAmount)
        const stakingFiatBalance = convertCurrency(state, currencyCode, guiWallet.isoFiatCurrencyCode, stakingDefaultCryptoAmount)
        const stakingFiatBalanceFormat = formatNumber(stakingFiatBalance && gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0, { toFixed: 2 })

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
      currencyPlugin,
      fioAddresses: state.ui.scenes.fioAddress.fioAddresses
    }
  },
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(StakingChangeSceneComponent))
