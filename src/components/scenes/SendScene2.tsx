import { EdgeAccount, EdgeSpendInfo, EdgeSpendTarget } from 'edge-core-js'
import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useExchangeDenom } from '../../hooks/useExchangeDenom'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import { RouteProp } from '../../types/routerTypes'
import { GuiExchangeRates } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { useTheme } from '../services/ThemeContext'
import { AddressTile, ChangeAddressResult } from '../tiles/AddressTile'
import { EditableAmountTile } from '../tiles/EditableAmountTile'

type Props = {
  // navigation: NavigationProp<'send2'>
  route: RouteProp<'send2'>
}

const blankSpendInfo: EdgeSpendInfo = {
  spendTargets: [{}]
}

const SendComponent = (props: Props) => {
  const { route } = props
  const theme = useTheme()

  const { walletId: initWalletId = '', spendInfo: initSpendInfo, openCamera } = props.route.params

  const [walletId] = useState<string>(initWalletId)
  const [spendInfo, setSpendInfo] = useState<EdgeSpendInfo>(initSpendInfo ?? blankSpendInfo)

  const account = useSelector<EdgeAccount>(state => state.core.account)
  const exchangeRates = useSelector<GuiExchangeRates>(state => state.exchangeRates)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyCode = spendInfo?.currencyCode ?? currencyWallets[walletId].currencyInfo.currencyCode
  const cryptoDisplayDenomination = useDisplayDenom(currencyWallets[walletId].currencyInfo.pluginId, currencyCode)
  const cryptoExchangeDenomination = useExchangeDenom(currencyWallets[walletId].currencyInfo.pluginId, currencyCode)
  const coreWallet = currencyWallets[walletId]

  const { lockTilesMap = {}, hiddenTilesMap = {} } = route.params

  const handleChangeAddress = useHandler((spendTarget: EdgeSpendTarget) => async (changeAddressResult: ChangeAddressResult): Promise<void> => {
    spendTarget.publicAddress = changeAddressResult.parsedUri?.publicAddress ?? ''

    // We can assume the spendTarget object came from the Component spendInfo so simply resetting the spendInfo
    // should properly re-render with new spendTargets
    setSpendInfo({ ...spendInfo })
  })

  const renderAddressTile = useHandler((spendTarget: EdgeSpendTarget) => {
    if (coreWallet != null && !hiddenTilesMap.address) {
      // TODO: Change API of AddressTile to access undefined recipientAddress
      const { publicAddress = '' } = spendTarget
      return (
        <AddressTile
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
          ref={() => {}}
        />
      )
    }

    return null
  })

  const renderAmount = useHandler((spendTarget: EdgeSpendTarget) => {
    const { publicAddress, nativeAmount } = spendTarget
    if (publicAddress != null && !hiddenTilesMap.amount) {
      return (
        <EditableAmountTile
          title={s.strings.fio_request_amount}
          exchangeRates={exchangeRates}
          nativeAmount={nativeAmount ?? '0'}
          wallet={coreWallet}
          currencyCode={currencyCode}
          exchangeDenomination={cryptoExchangeDenomination}
          displayDenomination={cryptoDisplayDenomination}
          lockInputs={lockTilesMap.amount ?? false}
          // TODO: Handle press
          onPress={() => {}}
        />
      )
    }

    return null
  })

  const renderAddressAmountPairs = useHandler(() => {
    const out: Array<JSX.Element | null> = []
    for (const spendTarget of spendInfo?.spendTargets ?? []) {
      let element = renderAddressTile(spendTarget)
      if (element != null) out.push(element)
      element = renderAmount(spendTarget)
      if (element != null) out.push(element)
    }
    return out
  })

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        {renderAddressAmountPairs()}
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

export const SendScene2 = React.memo(SendComponent)
