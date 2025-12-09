import { add, div, eq, gt } from 'biggystring'
import type {
  EdgeAssetActionType,
  EdgeCurrencyWallet,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'
import * as React from 'react'
import { Image, View } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import fioLogo from '../../../assets/images/fio/fio_logo.png'
import { SPECIAL_CURRENCY_INFO } from '../../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../../hooks/useDisplayDenom'
import {
  formatNumber,
  formatTimeDate,
  SHORT_DATE_FMT
} from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenom } from '../../../selectors/DenominationSelectors'
import { convertCurrency } from '../../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../../types/routerTypes'
import { getCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import {
  type FioStakingBalanceType,
  getFioStakingBalances
} from '../../../util/stakeUtils'
import { convertNativeToDenomination } from '../../../util/utils'
import { AlertCardUi4 } from '../../cards/AlertCard'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { SceneContainer } from '../../layout/SceneContainer'
import { EdgeModal } from '../../modals/EdgeModal'
import {
  FlipInputModal2,
  type FlipInputModalResult
} from '../../modals/FlipInputModal2'
import { EdgeRow } from '../../rows/EdgeRow'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText, Paragraph } from '../../themed/EdgeText'
import type { ExchangedFlipInputAmounts } from '../../themed/ExchangedFlipInput2'
import { ModalTitle } from '../../themed/ModalParts'
import { SafeSlider } from '../../themed/SafeSlider'

interface Props extends EdgeAppSceneProps<'fioStakingChange'> {
  wallet: EdgeCurrencyWallet
}

export interface FioStakingChangeParams {
  assetActionType: Extract<EdgeAssetActionType, 'stake' | 'unstake'>
  tokenId: EdgeTokenId
  walletId: string
}

type PartialAmounts = Pick<
  ExchangedFlipInputAmounts,
  'nativeAmount' | 'exchangeAmount'
>

export const FioStakingChangeScene = withWallet((props: Props) => {
  const theme = useTheme()
  const {
    wallet: currencyWallet,
    route: {
      params: { assetActionType, tokenId, walletId }
    },
    navigation
  } = props

  const styles = getStyles(theme)
  const { pluginId } = currencyWallet.currencyInfo

  const maxApy = SPECIAL_CURRENCY_INFO[pluginId]?.stakeMaxApy

  const [nativeAmount, setNativeAmount] = React.useState('0')
  const [exchangeAmount, setExchangeAmount] = React.useState('0')
  const [apy, setApy] = React.useState(0)
  const [error, setError] = React.useState<Error | string | undefined>(
    undefined
  )
  const [loading, setLoading] = React.useState(false)
  const [tx, setTx] = React.useState<EdgeTransaction | undefined>(undefined)
  const [selectedFioAddress, setSelectedFioAddress] = React.useState<
    string | undefined
  >(undefined)
  const sliderDisabled =
    tx == null || exchangeAmount === '0' || error != null || loading
  const dispatch = useDispatch()
  const { currencyConfig } = currencyWallet
  const currencyCode = getCurrencyCode(currencyWallet, tokenId)
  const currencyDenomination = useDisplayDenom(currencyConfig, tokenId)
  const defaultDenomination = getExchangeDenom(currencyConfig, tokenId)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const fioAddresses = useSelector(state => state.ui.fioAddress.fioAddresses)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)

  const headerTitle =
    assetActionType === 'stake'
      ? sprintf(lstrings.staking_change_add_header, currencyCode)
      : assetActionType === 'unstake'
      ? sprintf(lstrings.staking_change_remove_header, currencyCode)
      : undefined
  const headerTitleChildren =
    headerTitle != null ? (
      <Image style={styles.currencyLogo} source={fioLogo} />
    ) : undefined

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
  if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true) {
    const balances = getFioStakingBalances(currencyWallet.stakingStatus)
    const stakeTypes = Object.keys(balances) as FioStakingBalanceType[]
    for (const stakedType of stakeTypes) {
      const stakingNativeAmount = balances[stakedType]
      const stakingCryptoAmount: string = convertNativeToDenomination(
        currencyDenomination.multiplier
      )(stakingNativeAmount)
      const stakingCryptoAmountFormat = formatNumber(
        add(stakingCryptoAmount, '0')
      )

      const stakingDefaultCryptoAmount = convertNativeToDenomination(
        defaultDenomination.multiplier
      )(stakingNativeAmount)
      const stakingFiatBalance = convertCurrency(
        exchangeRates,
        pluginId,
        tokenId,
        defaultIsoFiat,
        stakingDefaultCryptoAmount
      )
      const hasMeaningfulFiatBalance =
        stakingFiatBalance != null &&
        stakingFiatBalance !== '' &&
        gt(stakingFiatBalance, '0.000001')
      const stakingFiatBalanceFormat = formatNumber(
        hasMeaningfulFiatBalance ? stakingFiatBalance : 0,
        { toFixed: 2 }
      )

      stakingBalances[stakedType] = {
        native: stakingNativeAmount,
        crypto: stakingCryptoAmountFormat,
        fiat: stakingFiatBalanceFormat
      }
    }
  }

  const onAmountsChanged = ({
    exchangeAmount,
    nativeAmount
  }: PartialAmounts): void => {
    setExchangeAmount(exchangeAmount)
    setNativeAmount(nativeAmount)
  }

  const onMaxSet = (): void => {
    switch (assetActionType) {
      case 'stake': {
        currencyWallet
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
            onAmountsChanged({
              nativeAmount,
              exchangeAmount: add(
                convertNativeToDenomination(currencyDenomination.multiplier)(
                  nativeAmount
                ),
                '0'
              )
            })
          })
          .catch((err: unknown) => {
            showError(err)
          })
        break
      }
      case 'unstake': {
        const nativeAmount = stakingBalances.staked.native
        const { multiplier } = getExchangeDenom(
          currencyWallet.currencyConfig,
          null
        )
        const exchangeAmount = div(nativeAmount, multiplier, multiplier.length)
        onAmountsChanged({
          nativeAmount,
          exchangeAmount
        })
        break
      }
      default:
    }
  }

  const onFeesChange = (): void => {
    // todo
  }

  const handleSubmit = async (reset: () => void): Promise<void> => {
    if (tx == null) {
      setError(lstrings.create_wallet_account_error_sending_transaction)
      reset()
      return
    }
    setLoading(true)
    try {
      const signedTx = await currencyWallet.signTx(tx)
      const broadcastedTx = await currencyWallet.broadcastTx(signedTx)
      await currencyWallet.saveTx(broadcastedTx)

      showToast(
        assetActionType === 'stake'
          ? lstrings.staking_success
          : lstrings.staking_unstake_success
      )
      navigation.goBack()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setLoading(false)
      reset()
    }
  }

  const handleAmount = (): void => {
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
    )).catch((error: unknown) => {
      setError(error instanceof Error ? error : String(error))
    })
  }

  const handleUnlockDate = async (): Promise<void> => {
    await Airship.show(bridge => {
      const handleModalCancel = (): void => {
        bridge.resolve()
      }
      return (
        <EdgeModal
          bridge={bridge}
          onCancel={handleModalCancel}
          title={
            <ModalTitle
              icon={
                <MaterialCommunityIcons
                  name="chart-line"
                  size={theme.rem(2)}
                  color={theme.iconTappable}
                />
              }
            >
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
        // @ts-expect-error Plugin returns a non-standard numeric type
        .then(apy => {
          setApy(parseFloat(apy.toFixed(2)))
        })
        .catch(() => {})
    }
  }, [exchangeAmount, currencyConfig])

  React.useEffect(() => {
    if (selectedFioAddress != null) return
    if (fioAddresses == null || fioAddresses.length === 0) return

    const walletFioAddresses = fioAddresses
      .filter(
        ({ walletId: fioAddressWalletId }) => fioAddressWalletId === walletId
      )
      .sort(({ bundledTxs }, { bundledTxs: bundledTxs2 }) =>
        bundledTxs <= bundledTxs2 ? 1 : -1
      )

    const fioAddress = walletFioAddresses[0]

    if (fioAddress == null) return
    // Addresses must have at least 1 bundled transaction; we rely on bundle txs and don't yet support fee-based tx for staking
    if (fioAddress.bundledTxs < 1) {
      setError(
        new Error(
          sprintf(lstrings.staking_no_bundled_txs_error, fioAddress.name)
        )
      )
      return
    }

    setSelectedFioAddress(fioAddress.name)
  }, [fioAddresses, selectedFioAddress, walletId])

  // Make spend transaction after amount change
  React.useEffect(() => {
    if (nativeAmount === '0') return

    let abort = false

    // If the selectedFioAddress is not defined, then we will not be able to complete the transaction.
    if (selectedFioAddress == null) {
      setError(new Error(lstrings.staking_no_fio_address_error))
      return
    }

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
            name:
              assetActionType === 'stake'
                ? 'stakeFioTokens'
                : 'unStakeFioTokens',
            params: {
              fioAddress: selectedFioAddress
            }
          }
        },
        assetAction: { assetActionType },
        savedAction: {
          actionType: 'stake',
          pluginId: 'fio',
          stakeAssets: [
            {
              pluginId,
              tokenId: null,
              nativeAmount
            }
          ]
        }
      })
      .then(tx => {
        if (abort) return
        setError(undefined)
        setTx(tx)
      })
      .catch((error: unknown) => {
        if (abort) return
        setError(error instanceof Error ? error : String(error))
      })
    return () => {
      abort = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeAmount])

  const renderAdd = (): React.ReactElement => {
    const apyValue = sprintf(
      apy === maxApy
        ? lstrings.staking_estimated_return_up_to
        : lstrings.staking_estimated_return,
      `${apy}%`
    )
    return (
      <>
        <View style={styles.explainer}>
          <Paragraph>{lstrings.staking_change_explaner1}</Paragraph>
          <Paragraph>{lstrings.staking_change_explaner2}</Paragraph>
        </View>
        <View style={styles.cardWrapper}>
          <EdgeCard>
            <EdgeRow
              rightButtonType="editable"
              title={lstrings.staking_change_add_amount_title}
              onPress={handleAmount}
            >
              <EdgeText style={styles.amountText}>{exchangeAmount}</EdgeText>
            </EdgeRow>
          </EdgeCard>
        </View>
        {apy != null && apy !== 0 && (
          <View style={styles.estReturn}>
            <EdgeText>{apyValue}</EdgeText>
          </View>
        )}
      </>
    )
  }

  const renderRemove = (): React.ReactElement => {
    const unlockDate = tx?.otherParams?.ui?.unlockDate
    const unlockDateFormat =
      unlockDate != null && unlockDate !== ''
        ? formatTimeDate(unlockDate, SHORT_DATE_FMT)
        : ''
    let estReward = '0'
    if (tx?.otherParams?.ui?.estReward != null) {
      estReward = add(
        convertNativeToDenomination(currencyDenomination.multiplier)(
          tx.otherParams.ui.estReward
        ),
        '0'
      )
    }
    return (
      <>
        <EdgeCard sections>
          <EdgeRow
            rightButtonType="editable"
            title={lstrings.staking_change_remove_amount_title}
            onPress={handleAmount}
          >
            <EdgeText style={styles.amountText}>{exchangeAmount}</EdgeText>
          </EdgeRow>
          {estReward !== '0' && (
            <EdgeRow title={lstrings.staking_estimated_rewards}>
              <EdgeText style={styles.amountText}>{estReward}</EdgeText>
            </EdgeRow>
          )}
          <EdgeRow
            rightButtonType="questionable"
            title={lstrings.staking_change_remove_unlock_date}
            onPress={handleUnlockDate}
          >
            <EdgeText>{unlockDateFormat}</EdgeText>
          </EdgeRow>
        </EdgeCard>
      </>
    )
  }

  const renderError = (): React.ReactNode => {
    if (error == null) return null

    return (
      <View style={styles.alertCardWrapper}>
        <AlertCardUi4
          type="error"
          title={lstrings.fragment_error}
          body={String(error)}
        />
      </View>
    )
  }

  return (
    <SceneWrapper scroll>
      <SceneContainer
        headerTitle={headerTitle}
        headerTitleChildren={headerTitleChildren}
      >
        {(() => {
          switch (assetActionType) {
            case 'stake':
              return renderAdd()
            case 'unstake':
              return renderRemove()
            default:
              return null
          }
        })()}
        {renderError()}
        <View style={styles.sliderContainer}>
          <SafeSlider
            onSlidingComplete={handleSubmit}
            disabled={sliderDisabled}
          />
        </View>
      </SceneContainer>
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
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
  cardWrapper: {
    marginHorizontal: theme.rem(1),
    marginVertical: theme.rem(0.5)
  },
  alertCardWrapper: {
    marginHorizontal: theme.rem(1),
    marginVertical: theme.rem(0.5)
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
