// @flow

import { mul } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { getSpecialCurrencyInfo } from '../../../constants/WalletAndCurrencyConstants.js'
import { makeActionProgram } from '../../../controllers/action-queue/ActionProgram.js'
import { scheduleActionProgram } from '../../../controllers/action-queue/redux/actions'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect.js'
import { useHandler } from '../../../hooks/useHandler.js'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings.js'
import type { ApprovableAction, BorrowEngine } from '../../../plugins/borrow-plugins/types.js'
import { useMemo, useRef, useState } from '../../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../../types/reactRedux.js'
import { type NavigationProp, type ParamList } from '../../../types/routerTypes'
import { zeroString } from '../../../util/utils.js'
import { FlipInputTile } from '../../cards/FlipInputTile'
import { CollateralAmountTile, DebtAmountTile, ExchangeRateTile, NetworkFeeTile } from '../../cards/LoanDebtsAndCollateralComponents.js'
import { type WalletListResult, WalletListModal } from '../../modals/WalletListModal.js'
import { Airship, showError } from '../../services/AirshipInstance'
import { type ExchangedFlipInputAmounts } from '../../themed/ExchangedFlipInput.js'
import { AprCard } from '../../tiles/AprCard.js'
import { InterestRateChangeTile } from '../../tiles/InterestRateChangeTile.js'
import { LoanToValueTile } from '../../tiles/LoanToValueTile.js'
import { FormScene } from '../FormScene.js'

const WBTC = { pluginId: 'ethereum', tokenId: '2260fac5e5542a773aa44fbcfedf7c193bc2c599', currencyCode: 'WBTC' }

type ManageCollateralRequest = {
  tokenId?: string,
  ['fromWallet' | 'toWallet']: EdgeCurrencyWallet,
  nativeAmount: string
}

type Props<T: $Keys<ParamList>> = {
  borrowEngine: BorrowEngine,
  borrowPluginId: string, // TODO: make mandatory, reduce to just borrowPluginId?
  defaultTokenId?: string,
  action: (request: ManageCollateralRequest) => Promise<ApprovableAction>,
  actionOpType: string,
  actionWallet: 'fromWallet' | 'toWallet',
  ltvType: 'debts' | 'collaterals',
  ltvChange: 'increase' | 'decrease',
  debtChange?: 'increase' | 'decrease',

  showExchangeRateTile?: boolean,
  showTotalDebtTile?: boolean,
  showNewDebtTile?: boolean,
  showTotalCollateralTile?: boolean,
  showNewDebtAprChange?: true,

  headerText: string,

  navigation: NavigationProp<T>
}

export const ManageCollateralScene = <T: $Keys<ParamList>>(props: Props<T>) => {
  const {
    action,
    actionOpType,
    actionWallet,
    borrowEngine,
    borrowPluginId,
    defaultTokenId,
    headerText,
    ltvChange,
    ltvType,
    showExchangeRateTile,
    showTotalDebtTile,
    showNewDebtTile,
    debtChange = 'increase',
    showTotalCollateralTile,
    showNewDebtAprChange,
    navigation
  } = props

  const { currencyWallet } = borrowEngine
  const {
    currencyConfig: { allTokens },
    currencyInfo
  } = currencyWallet
  const { pluginId } = currencyInfo

  // State
  const account = useSelector(state => state.core.account)
  const wallets = useWatch(account, 'currencyWallets')

  // Flip input selected wallet
  const [selectedWallet, setSelectedWallet] = useState<EdgeCurrencyWallet>(currencyWallet)
  const [selectedTokenId, setSelectedTokenId] = useState<string | void>(defaultTokenId)
  const selectedWalletName = useWatch(selectedWallet, 'name') ?? ''
  const { currencyCode: selectedWalletCurrencyCode } = selectedTokenId == null ? currencyInfo : allTokens[selectedTokenId]
  const hasMaxSpend = getSpecialCurrencyInfo(pluginId).noMaxSpend !== true

  // Borrow engine stuff
  const [approvalAction, setApprovalAction] = useState<ApprovableAction | null>(null)
  const [actionNativeAmount, setActionNativeAmount] = useState('0')
  const [newDebtApr, setNewDebtApr] = useState(0)

  // TODO: WIP ActionQueue
  const dispatch = useDispatch()
  const [aqProg, setAqProg] = useState()

  useAsyncEffect(async () => {
    // const testAOpType = ''
    const aOp = {
      type: 'seq',
      actions: [
        // $FlowFixMe
        {
          type: actionOpType,
          borrowPluginId,
          nativeAmount: actionNativeAmount,
          walletId: selectedWallet.id,
          tokenId: selectedTokenId
        }
      ]
    }
    const prog = await makeActionProgram(aOp)
    setAqProg(prog)
  }, [actionNativeAmount, selectedWallet, selectedTokenId])

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

    if (showNewDebtAprChange) {
      const apr = await borrowEngine.getAprQuote(selectedTokenId)
      setNewDebtApr(apr)
    }
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
    if (aqProg != null && approvalAction != null) {
      try {
        aqProg.programId = actionOpType + '_' + Date.now()
        await dispatch(scheduleActionProgram(aqProg))
        navigation.navigate('loanStatus', { actionQueueId: aqProg.programId })

        // const approvableAction = await borrowEngine.deposit({ nativeAmount: aqProg.nativeAmount, tokenId: aqProg.tokenId })
        // const txs = await approvableAction.approve()

        // await approvalAction.approve()
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

  const renderNewAprCard = useMemo(() => {
    return showNewDebtAprChange ? <AprCard apr={newDebtApr} /> : null
  }, [newDebtApr, showNewDebtAprChange])

  const renderTotalDebtTile = useMemo(() => {
    return showTotalDebtTile ? <DebtAmountTile title={s.strings.loan_current_principle} wallet={currencyWallet} debts={borrowEngine.debts} /> : null
  }, [currencyWallet, borrowEngine, showTotalDebtTile])

  const renderNewDebtTile = useMemo(() => {
    const multiplier = debtChange === 'increase' ? '1' : '-1'
    const newDebt = { nativeAmount: mul(actionNativeAmount, multiplier), tokenId: selectedTokenId, apr: 0 } // APR is only present to appease Flow. It does not mean anything.
    return showNewDebtTile ? <DebtAmountTile title={s.strings.loan_new_principle} wallet={currencyWallet} debts={[...borrowEngine.debts, newDebt]} /> : null
  }, [debtChange, actionNativeAmount, selectedTokenId, showNewDebtTile, currencyWallet, borrowEngine.debts])

  const renderTotalCollateralTile = useMemo(() => {
    return showTotalCollateralTile ? (
      <CollateralAmountTile title={s.strings.loan_total_collateral_value} wallet={currencyWallet} collaterals={borrowEngine.collaterals} />
    ) : null
  }, [currencyWallet, borrowEngine, showTotalCollateralTile])

  const renderFeeTile = useMemo(() => {
    const nativeAmount = approvalAction != null ? approvalAction.networkFee.nativeAmount : '0'
    return <NetworkFeeTile wallet={currencyWallet} nativeAmount={nativeAmount} />
  }, [currencyWallet, approvalAction])

  const renderInterestRateChangeTile = useMemo(() => {
    const newDebt = { nativeAmount: actionNativeAmount, tokenId: selectedTokenId, apr: newDebtApr } // APR is only present to appease Flow. It does not mean anything.
    return showNewDebtAprChange != null ? <InterestRateChangeTile borrowEngine={borrowEngine} newDebt={newDebt} /> : null
  }, [actionNativeAmount, borrowEngine, newDebtApr, selectedTokenId, showNewDebtAprChange])

  const renderLTVRatioTile = useMemo(() => {
    return <LoanToValueTile borrowEngine={borrowEngine} tokenId={selectedTokenId} nativeAmount={actionNativeAmount} type={ltvType} direction={ltvChange} />
  }, [borrowEngine, ltvChange, ltvType, selectedTokenId, actionNativeAmount])

  const tiles = [
    renderFlipInput,
    renderExchangeRateTile,
    renderNewAprCard,
    renderTotalDebtTile,
    renderNewDebtTile,
    renderTotalCollateralTile,
    renderFeeTile,
    renderInterestRateChangeTile,
    renderLTVRatioTile
  ]

  return (
    <FormScene headerText={headerText} onSliderComplete={onSliderComplete} sliderDisabled={approvalAction == null}>
      {tiles}
    </FormScene>
  )
}
