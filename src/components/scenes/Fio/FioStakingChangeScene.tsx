import { add, eq, gt } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Image, View } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import fioLogo from '../../../assets/images/fio/fio_logo.png'
import { SPECIAL_CURRENCY_INFO } from '../../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../../hooks/useDisplayDenom'
import { formatNumber, formatTimeDate, SHORT_DATE_FMT } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenom } from '../../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { FioStakingBalanceType, getFioStakingBalances } from '../../../util/stakeUtils'
import { convertCurrencyFromExchangeRates, convertNativeToDenomination } from '../../../util/utils'
import { AlertCardUi4 } from '../../cards/AlertCard'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { EdgeModal } from '../../modals/EdgeModal'
import { FlipInputModal2, FlipInputModalResult } from '../../modals/FlipInputModal2'
import { EdgeRow } from '../../rows/EdgeRow'
import { Airship, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText, Paragraph } from '../../themed/EdgeText'
import { ExchangedFlipInputAmounts } from '../../themed/ExchangedFlipInput2'
import { ModalTitle } from '../../themed/ModalParts'
import { SceneHeader } from '../../themed/SceneHeader'
import { Slider } from '../../themed/Slider'

interface Props extends EdgeSceneProps<'fioStakingChange'> {
  wallet: EdgeCurrencyWallet
}

type PartialAmounts = Pick<ExchangedFlipInputAmounts, 'nativeAmount' | 'exchangeAmount'>

export const FioStakingChangeScene = withWallet((props: Props) => {
  const theme = useTheme()
  const {
    wallet: currencyWallet,
    route: {
      params: { change, tokenId, walletId }
    },
    navigation
  } = props

  const styles = getStyles(theme)
  const { pluginId } = currencyWallet.currencyInfo

  const maxApy = SPECIAL_CURRENCY_INFO[pluginId]?.stakeMaxApy

  const [nativeAmount, setNativeAmount] = React.useState('0')
  const [exchangeAmount, setExchangeAmount] = React.useState('0')
  const [apy, setApy] = React.useState(0)
  const [error, setError] = React.useState<Error | string | undefined>(undefined)
  const [loading, setLoading] = React.useState(false)
  const [tx, setTx] = React.useState<EdgeTransaction | undefined>(undefined)
  const [selectedFioAddress, setSelectedFioAddress] = React.useState<string | undefined>(undefined)
  const sliderDisabled = tx == null || exchangeAmount === '0' || error != null

  const dispatch = useDispatch()
  const { currencyConfig } = currencyWallet
  const currencyCode = getCurrencyCode(currencyWallet, tokenId)
  const currencyDenomination = useDisplayDenom(currencyConfig, tokenId)
  const defaultDenomination = getExchangeDenom(currencyConfig, tokenId)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const fioAddresses = useSelector(state => state.ui.fioAddress.fioAddresses)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)

  interface StakingDisplay {
    native: string
    crypto: string
    fiat: string
  }

  const stakingBalances: Record<FioStakingBalanceType, StakingDisplay> = {
    staked: {
      native: '0',
      crypto: '0',
      fiat: '0'
    },
    locked: {
      native: '0',
      crypto: '0',
      fiat: '0'
    }
  }
  if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported) {
    const balances = getFioStakingBalances(currencyWallet.stakingStatus)
    const stakeTypes = Object.keys(balances) as FioStakingBalanceType[]
    for (const stakedType of stakeTypes) {
      const stakingNativeAmount = balances[stakedType]
      const stakingCryptoAmount: string = convertNativeToDenomination(currencyDenomination.multiplier)(stakingNativeAmount)
      const stakingCryptoAmountFormat = formatNumber(add(stakingCryptoAmount, '0'))

      const stakingDefaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(stakingNativeAmount)
      const stakingFiatBalance = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, defaultIsoFiat, stakingDefaultCryptoAmount)
      const stakingFiatBalanceFormat = formatNumber(stakingFiatBalance && gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0, { toFixed: 2 })

      stakingBalances[stakedType] = {
        native: stakingNativeAmount,
        crypto: stakingCryptoAmountFormat,
        fiat: stakingFiatBalanceFormat
      }
    }
  }

  const onAmountsChanged = ({ exchangeAmount, nativeAmount }: PartialAmounts) => {
    setExchangeAmount(exchangeAmount)
    setNativeAmount(nativeAmount)
  }

  const onMaxSet = async () => {
    switch (change) {
      case 'add': {
        await currencyWallet
          .getMaxSpendable({
            tokenId,
            spendTargets: [{ publicAddress: '' }],
            otherParams: {
              action: {
                name: 'stakeFioTokens',
                params: {
                  fioAddress: selectedFioAddress
                }
              }
            }
          })
          .then(nativeAmount => {
            onAmountsChanged({ nativeAmount, exchangeAmount: add(convertNativeToDenomination(currencyDenomination.multiplier)(nativeAmount), '0') })
          })
        break
      }
      case 'remove': {
        const nativeAmt = stakingBalances.staked.native
        currencyWallet
          .nativeToDenomination(nativeAmt, 'FIO')
          .then(exchangeAmt => onAmountsChanged({ nativeAmount: nativeAmt, exchangeAmount: exchangeAmt }))
          .catch(e => console.error(e))
        break
      }
      default:
    }
  }

  const onFeesChange = () => {
    // todo
  }

  const handleSubmit = async () => {
    if (tx == null) return setError(lstrings.create_wallet_account_error_sending_transaction)
    setLoading(true)
    try {
      const signedTx = await currencyWallet.signTx(tx)
      const broadcastedTx = await currencyWallet.broadcastTx(signedTx)
      await currencyWallet.saveTx(broadcastedTx)
      const messages = {
        add: lstrings.staking_success,
        remove: lstrings.staking_unstake_success
      }
      showToast(messages[change])
      navigation.goBack()
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  const handleAmount = () => {
    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal2
        bridge={bridge}
        wallet={currencyWallet}
        tokenId={null}
        feeTokenId={null}
        onFeesChange={onFeesChange}
        onAmountsChanged={onAmountsChanged}
        startNativeAmount={eq(nativeAmount, '0') ? undefined : nativeAmount}
        onMaxSet={onMaxSet}
      />
    )).catch(error => setError(error))
  }

  const handleUnlockDate = async () => {
    await Airship.show(bridge => {
      return (
        <EdgeModal
          bridge={bridge}
          onCancel={bridge.resolve}
          title={
            <ModalTitle icon={<MaterialCommunityIcons name="chart-line" size={theme.rem(2)} color={theme.iconTappable} />}>
              {lstrings.staking_change_unlock_explainer_title}
            </ModalTitle>
          }
        >
          <Paragraph>{lstrings.staking_change_unlock_explainer1}</Paragraph>
          <Paragraph>{lstrings.staking_change_unlock_explainer2}</Paragraph>
        </EdgeModal>
      )
    })
  }

  useAsyncEffect(
    async () => {
      await dispatch(refreshAllFioAddresses())
    },
    [],
    'FioStakingChangeScene'
  )

  React.useEffect(() => {
    if (currencyConfig?.otherMethods?.getStakeEstReturn != null) {
      currencyConfig.otherMethods
        .getStakeEstReturn(exchangeAmount)
        // @ts-expect-error
        .then(apy => setApy(parseFloat(apy.toFixed(2))))
        .catch(() => {
          // If something goes wrong, silently fail to report an APY!?
        })
    }
  }, [exchangeAmount, currencyConfig])

  React.useEffect(() => {
    if (!selectedFioAddress && fioAddresses?.length > 0) {
      const fioAddress = fioAddresses
        .filter(({ walletId: fioAddressWalletId }) => fioAddressWalletId === walletId)
        .sort(({ bundledTxs }, { bundledTxs: bundledTxs2 }) => (bundledTxs <= bundledTxs2 ? 1 : -1))[0]

      // If no address is found, we do not define the selectedFioAddress
      if (fioAddress == null) return
      // Addresses must have at least 1 bundled transaction; we rely on bundle txs and don't yet support fee-based tx for staking
      if (fioAddress.bundledTxs < 1) return setError(new Error(sprintf(lstrings.staking_no_bundled_txs_error, fioAddress.name)))

      setSelectedFioAddress(fioAddress.name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...fioAddresses, selectedFioAddress])

  // Make spend transaction after amount change
  React.useEffect(() => {
    if (nativeAmount === '0') return

    let abort = false

    // If the selectedFioAddress is not defined, then we will not be able to complete the transaction.
    if (selectedFioAddress == null) {
      setError(new Error(lstrings.staking_no_fio_address_error))
      return
    }

    const { [change]: actionName } = SPECIAL_CURRENCY_INFO[pluginId]?.stakeActions ?? { [change]: '' }
    currencyWallet
      .makeSpend({
        tokenId: null,
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
        setError(undefined)
        setTx(tx)
      })
      .catch(error => {
        if (abort) return
        setError(error)
      })
    return () => {
      abort = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeAmount])

  const renderAdd = () => {
    const apyValue = sprintf(apy === maxApy ? lstrings.staking_estimated_return_up_to : lstrings.staking_estimated_return, `${apy}%`)
    return (
      <>
        <SceneHeader style={styles.sceneHeader} title={sprintf(lstrings.staking_change_add_header, currencyCode)} underline withTopMargin>
          <Image style={styles.currencyLogo} source={fioLogo} />
        </SceneHeader>
        <View style={styles.explainer}>
          <Paragraph>{lstrings.staking_change_explaner1}</Paragraph>
          <Paragraph>{lstrings.staking_change_explaner2}</Paragraph>
        </View>
        <EdgeCard marginRem={1}>
          <EdgeRow rightButtonType="editable" title={lstrings.staking_change_add_amount_title} onPress={handleAmount}>
            <EdgeText style={styles.amountText}>{exchangeAmount}</EdgeText>
          </EdgeRow>
        </EdgeCard>
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
    const unlockDateFormat = unlockDate ? formatTimeDate(unlockDate, SHORT_DATE_FMT) : ''
    let estReward = '0'
    if (tx != null && tx.otherParams != null && tx.otherParams.ui != null && tx.otherParams.ui.estReward != null) {
      estReward = add(convertNativeToDenomination(currencyDenomination.multiplier)(tx.otherParams.ui.estReward), '0')
    }
    return (
      <>
        <SceneHeader style={styles.sceneHeader} title={sprintf(lstrings.staking_change_remove_header, currencyCode)} underline withTopMargin>
          <Image style={styles.currencyLogo} source={fioLogo} />
        </SceneHeader>
        <EdgeCard sections>
          <EdgeRow rightButtonType="editable" title={lstrings.staking_change_remove_amount_title} onPress={handleAmount}>
            <EdgeText style={styles.amountText}>{exchangeAmount}</EdgeText>
          </EdgeRow>
          {estReward !== '0' && (
            <EdgeRow title={lstrings.staking_estimated_rewards}>
              <EdgeText style={styles.amountText}>{estReward}</EdgeText>
            </EdgeRow>
          )}
          <EdgeRow rightButtonType="questionable" title={lstrings.staking_change_remove_unlock_date} onPress={handleUnlockDate}>
            <EdgeText>{unlockDateFormat}</EdgeText>
          </EdgeRow>
        </EdgeCard>
      </>
    )
  }

  const renderError = () => {
    if (error == null) return null

    return <AlertCardUi4 marginRem={1} type="error" title={lstrings.fragment_error} body={String(error)} />
  }

  return (
    <SceneWrapper scroll>
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
})

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
  explainer: {
    margin: theme.rem(0.5),
    marginTop: theme.rem(1)
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
