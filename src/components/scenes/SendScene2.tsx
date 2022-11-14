import { EdgeAccount, EdgeSpendInfo, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useExchangeDenom } from '../../hooks/useExchangeDenom'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import { RouteProp } from '../../types/routerTypes'
import { GuiExchangeRates } from '../../types/types'
import { getCurrencyCode, getTokenId } from '../../util/CurrencyInfoHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { FlipInputModal2, FlipInputModalRef, FlipInputModalResult } from '../modals/FlipInputModal2'
import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { ExchangedFlipInputAmounts, ExchangeFlipInputFields } from '../themed/ExchangedFlipInput2'
import { AddressTile2, ChangeAddressResult } from '../tiles/AddressTile2'
import { EditableAmountTile } from '../tiles/EditableAmountTile'

interface Props {
  // navigation: NavigationProp<'send2'>
  route: RouteProp<'send2'>
}

const blankSpendInfo: EdgeSpendInfo = {
  spendTargets: [{}]
}

const SendComponent = (props: Props) => {
  const { route } = props
  const theme = useTheme()

  const flipInputModalRef = React.useRef<FlipInputModalRef>(null)
  const { walletId: initWalletId = '', tokenId: tokenIdProp, spendInfo: initSpendInfo, openCamera } = route.params

  const [walletId] = useState<string>(initWalletId)
  const [spendInfo, setSpendInfo] = useState<EdgeSpendInfo>(initSpendInfo ?? blankSpendInfo)
  const [fieldChanged, setFieldChanged] = useState<ExchangeFlipInputFields>('fiat')
  const [feeNativeAmount, setFeeNativeAmount] = useState<string>('')
  const [edgeTransaction, setEdgeTransaction] = useState<EdgeTransaction | null>(null)
  console.log(edgeTransaction?.currencyCode ?? '')

  const account = useSelector<EdgeAccount>(state => state.core.account)
  const exchangeRates = useSelector<GuiExchangeRates>(state => state.exchangeRates)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyCode = spendInfo?.currencyCode ?? currencyWallets[walletId].currencyInfo.currencyCode
  const { pluginId } = currencyWallets[walletId].currencyInfo
  const cryptoDisplayDenomination = useDisplayDenom(pluginId, currencyCode)
  const cryptoExchangeDenomination = useExchangeDenom(pluginId, currencyCode)
  const coreWallet = currencyWallets[walletId]

  const { lockTilesMap = {}, hiddenTilesMap = {} } = route.params
  const tokenId = tokenIdProp ?? getTokenId(account, pluginId, currencyCode)
  spendInfo.currencyCode = getCurrencyCode(coreWallet, tokenId)

  const handleChangeAddress =
    (spendTarget: EdgeSpendTarget) =>
    async (changeAddressResult: ChangeAddressResult): Promise<void> => {
      spendTarget.publicAddress = changeAddressResult.parsedUri?.publicAddress ?? ''

      // We can assume the spendTarget object came from the Component spendInfo so simply resetting the spendInfo
      // should properly re-render with new spendTargets
      setSpendInfo({ ...spendInfo })
    }

  const renderAddressTile = (spendTarget: EdgeSpendTarget) => {
    if (coreWallet != null && !hiddenTilesMap.address) {
      // TODO: Change API of AddressTile to access undefined recipientAddress
      const { publicAddress = '' } = spendTarget
      return (
        <AddressTile2
          title={s.strings.send_scene_send_to_address}
          recipientAddress={publicAddress}
          coreWallet={coreWallet}
          currencyCode={currencyCode}
          onChangeAddress={handleChangeAddress(spendTarget)}
          resetSendTransaction={() => {
            spendTarget.publicAddress = undefined
            setSpendInfo({ ...spendInfo })
          }}
          lockInputs={lockTilesMap.address}
          isCameraOpen={!!openCamera}
        />
      )
    }

    return null
  }

  const handleAmountsChanged = (spendTarget: EdgeSpendTarget) => (amounts: ExchangedFlipInputAmounts) => {
    const { nativeAmount, fieldChanged: newField } = amounts
    spendTarget.nativeAmount = nativeAmount === '' ? undefined : nativeAmount

    // This works since the spendTarget object is guaranteed to be inside
    // the spendInfo object
    setSpendInfo({ ...spendInfo })
    setFieldChanged(newField)
  }

  const handleFlipInputModal = (spendTarget: EdgeSpendTarget) => () => {
    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal2
        ref={flipInputModalRef}
        bridge={bridge}
        startNativeAmount={spendTarget.nativeAmount}
        forceField={fieldChanged}
        onAmountsChanged={handleAmountsChanged(spendTarget)}
        onMaxSet={() => undefined}
        onFeesChange={() => undefined}
        wallet={coreWallet}
        tokenId={tokenId}
        feeNativeAmount={feeNativeAmount}
      />
    )).catch(error => console.log(error))
  }

  const renderAmount = (spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    if (publicAddress != null && !hiddenTilesMap.amount) {
      return (
        <EditableAmountTile
          title={s.strings.fio_request_amount}
          exchangeRates={exchangeRates}
          nativeAmount={nativeAmount ?? ''}
          wallet={coreWallet}
          currencyCode={currencyCode}
          exchangeDenomination={cryptoExchangeDenomination}
          displayDenomination={cryptoDisplayDenomination}
          lockInputs={lockTilesMap.amount ?? false}
          // TODO: Handle press
          onPress={handleFlipInputModal(spendTarget)}
        />
      )
    }

    return null
  }

  const renderAddressAmountPairs = () => {
    const out: Array<JSX.Element | null> = []
    for (const spendTarget of spendInfo?.spendTargets ?? []) {
      let element = renderAddressTile(spendTarget)
      if (element != null) out.push(element)
      element = renderAmount(spendTarget)
      if (element != null) out.push(element)
    }
    return out
  }

  useAsyncEffect(async () => {
    if (spendInfo.spendTargets[0].nativeAmount == null) {
      flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
      return
    }
    try {
      const edgeTx = await coreWallet.makeSpend(spendInfo)
      setEdgeTransaction(edgeTx)
      const { parentNetworkFee, networkFee } = edgeTx
      const feeNativeAmount = parentNetworkFee ?? networkFee
      const feeTokenId = parentNetworkFee == null ? tokenId : undefined
      setFeeNativeAmount(feeNativeAmount)
      flipInputModalRef.current?.setFees({ feeTokenId, feeNativeAmount })
      flipInputModalRef.current?.setError(null)
    } catch (e: any) {
      flipInputModalRef.current?.setError(e.message)
      flipInputModalRef.current?.setFees({ feeNativeAmount: '' })
    }
  }, [spendInfo])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {renderAddressAmountPairs()}
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

export const SendScene2 = React.memo(SendComponent)
