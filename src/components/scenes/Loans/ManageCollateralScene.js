// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { getSpecialCurrencyInfo } from '../../../constants/WalletAndCurrencyConstants.js'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect.js'
import { useHandler } from '../../../hooks/useHandler.js'
import { useWatchAccount, useWatchWallet } from '../../../hooks/useWatch.js'
import s from '../../../locales/strings.js'
import type { ApprovableAction, BorrowEngine } from '../../../plugins/borrow-plugins/types.js'
import { useMemo, useRef, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux.js'
import { zeroString } from '../../../util/utils.js'
import { FlipInputTile } from '../../cards/FlipInputTile.js'
import { CollateralAmountTile, DebtAmountTile, ExchangeRateTile, NetworkFeeTile } from '../../cards/LoanDebtsAndCollateralComponents.js'
import { type WalletListResult, WalletListModal } from '../../modals/WalletListModal.js'
import { Airship, showError } from '../../services/AirshipInstance'
import { type ExchangedFlipInputAmounts } from '../../themed/ExchangedFlipInput.js'
import { LoanToValueTile } from '../../tiles/LoanToValueTile.js'
import { FormScene } from '../FormScene.js'

const WBTC = { pluginId: 'ethereum', tokenId: '2260fac5e5542a773aa44fbcfedf7c193bc2c599', currencyCode: 'WBTC' }

type Props = {
  borrowEngine: BorrowEngine,
  defaultTokenId?: string,
  action: (request: { tokenId?: string, ['fromWallet' | 'toWallet']: EdgeCurrencyWallet, nativeAmount: string }) => Promise<ApprovableAction>,
  actionWallet: 'fromWallet' | 'toWallet',
  ltvType: 'debts' | 'collaterals',
  ltvChange: 'increase' | 'decrease',
  debtChange?: 'increase' | 'decrease',

  showExchangeRateTile?: boolean,
  showTotalDebtTile?: boolean,
  showNewDebtTile?: boolean,
  showTotalCollateralTile?: boolean,

  headerText: string,
  goBack: () => void
}

export const ManageCollateralScene = (props: Props) => {
  const {
    action,
    actionWallet,
    borrowEngine,
    defaultTokenId,
    headerText,
    ltvChange,
    ltvType,
    showExchangeRateTile,
    showTotalDebtTile,
    showNewDebtTile,
    debtChange = 'increase',
    showTotalCollateralTile,
    goBack
  } = props

  const { currencyWallet } = borrowEngine
  const {
    currencyConfig: { allTokens },
    currencyInfo
  } = currencyWallet
  const { pluginId } = currencyInfo

  // State
  const account = useSelector(state => state.core.account)
  const wallets = useWatchAccount(account, 'currencyWallets')

  // Flip input selected wallet
  const [selectedWallet, setSelectedWallet] = useState<EdgeCurrencyWallet>(currencyWallet)
  const [selectedTokenId, setSelectedTokenId] = useState<string | void>(defaultTokenId)
  const selectedWalletName = useWatchWallet(selectedWallet, 'name') ?? ''
  const { currencyCode: selectedWalletCurrencyCode } = selectedTokenId == null ? currencyInfo : allTokens[selectedTokenId]
  const hasMaxSpend = getSpecialCurrencyInfo(pluginId).noMaxSpend !== true

  // Borrow engine stuff
  const [approvalAction, setApprovalAction] = useState<ApprovableAction | null>(null)
  const [actionNativeAmount, setActionNativeAmount] = useState('0')

  useAsyncEffect(async () => {
    if (zeroString(actionNativeAmount)) {
      setApprovalAction(null)
      return
    }

    const request = {
      nativeAmount: actionNativeAmount,
      [actionWallet]: selectedWallet,
      tokenId: selectedTokenId
    }

    const approvalAction = await action(request)
    setApprovalAction(approvalAction)
  }, [actionNativeAmount])

  // Max send utils
  const toggleMaxSpend = useRef(false)

  const onMaxSpend = useHandler(() => {
    toggleMaxSpend.current = !toggleMaxSpend.current
  })

  const [firstLaunch, setFirstLaunch] = useState(true)
  useAsyncEffect(async () => {
    if (firstLaunch) {
      // Don't call getMaxSpendable when the component is mounted
      setFirstLaunch(false)
      return
    }

    const spendInfo = {
      currencyCode: selectedWalletCurrencyCode,
      spendTargets: [
        {
          publicAddress: `0x${WBTC.tokenId}` // TODO: replace with aave contract? Just needed a contract address here
        }
      ]
    }
    const nativeAmount = await selectedWallet.getMaxSpendable(spendInfo)
    setActionNativeAmount(nativeAmount)
  }, [toggleMaxSpend.current])

  const handleAmountChanged = useHandler((amounts: ExchangedFlipInputAmounts) => {
    setActionNativeAmount(amounts.nativeAmount)
  })

  const showWalletPicker = useHandler(() => {
    const allowedAssets = [WBTC]
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_src_wallet} showCreateWallet={false} allowedAssets={allowedAssets} />
    )).then(({ walletId, currencyCode, tokenId }: WalletListResult) => {
      if (walletId != null && currencyCode != null) {
        setSelectedWallet(wallets[walletId])
        setSelectedTokenId(tokenId)
        setActionNativeAmount('0')
      }
    })
  })

  const onSliderComplete = async (resetSlider: () => void) => {
    if (approvalAction != null) {
      try {
        await approvalAction.approve()
        goBack()
      } catch (e) {
        showError(e)
        resetSlider()
      }
    }
  }

  // Tiles
  const renderFlipInput = useMemo(() => {
    return (
      <FlipInputTile
        hasMaxSpend={hasMaxSpend}
        onMaxSpend={onMaxSpend}
        headerText={sprintf(s.strings.loan_add_from, selectedWalletName)}
        launchWalletSelector={showWalletPicker}
        onCryptoExchangeAmountChanged={handleAmountChanged}
        wallet={selectedWallet}
        tokenId={selectedTokenId}
      />
    )
  }, [handleAmountChanged, hasMaxSpend, onMaxSpend, selectedTokenId, selectedWallet, selectedWalletName, showWalletPicker])

  const renderExchangeRateTile = useMemo(() => {
    return showExchangeRateTile ? <ExchangeRateTile wallet={currencyWallet} tokenId={selectedTokenId} /> : null
  }, [currencyWallet, selectedTokenId, showExchangeRateTile])

  const renderTotalDebtTile = useMemo(() => {
    return showTotalDebtTile ? <DebtAmountTile title={s.strings.loan_current_principle} wallet={currencyWallet} debts={borrowEngine.debts} /> : null
  }, [currencyWallet, borrowEngine, showTotalDebtTile])

  const renderNewDebtTile = useMemo(() => {
    const multiplier = debtChange === 'increase' ? '1' : '-1'
    const newDebt = { nativeAmount: mul(actionNativeAmount, multiplier), tokenId: selectedTokenId, apr: 0 } // APR is only present to appease Flow. It does not mean anything.
    return showNewDebtTile ? <DebtAmountTile title={s.strings.loan_new_principle} wallet={currencyWallet} debts={[...borrowEngine.debts, newDebt]} /> : null
  }, [currencyWallet, borrowEngine, actionNativeAmount, selectedTokenId, showNewDebtTile])

  const renderTotalCollateralTile = useMemo(() => {
    return showTotalCollateralTile ? (
      <CollateralAmountTile title={s.strings.loan_total_collateral_value} wallet={currencyWallet} collaterals={borrowEngine.collaterals} />
    ) : null
  }, [currencyWallet, borrowEngine, showTotalCollateralTile])

  const renderFeeTile = useMemo(() => {
    const nativeAmount = approvalAction != null ? approvalAction.networkFee.nativeAmount : '0'
    return <NetworkFeeTile wallet={currencyWallet} nativeAmount={nativeAmount} />
  }, [currencyWallet, approvalAction])

  const renderLTVRatioTile = useMemo(() => {
    return <LoanToValueTile borrowEngine={borrowEngine} tokenId={selectedTokenId} nativeAmount={actionNativeAmount} type={ltvType} direction={ltvChange} />
  }, [borrowEngine, ltvChange, ltvType, selectedTokenId, actionNativeAmount])

  const tiles = [renderFlipInput, renderExchangeRateTile, renderTotalDebtTile, renderNewDebtTile, renderTotalCollateralTile, renderFeeTile, renderLTVRatioTile]

  return (
    <FormScene headerText={headerText} onSliderComplete={onSliderComplete} sliderDisabled={approvalAction == null}>
      {tiles}
    </FormScene>
  )
}
