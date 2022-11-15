import { eq } from 'biggystring'
import * as React from 'react'
import { ReturnKeyType, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { useSelectedWallet } from '../../hooks/useSelectedWallet'
import { useState } from '../../types/reactHooks'
import { consify } from '../../util/utils'
import { Card } from '../cards/Card'
import { FlipInputModal2, FlipInputModalResult } from '../modals/FlipInputModal2'
import { Airship } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts, ExchangedFlipInputRef } from '../themed/ExchangedFlipInput2'
import { MainButton } from '../themed/MainButton'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'

export function ExchangedFlipInputTester(props: {}) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const selectedWallet = useSelectedWallet()
  // const account = useSelector(state => state.core.account)
  // const walletIds = Object.keys(account.currencyWallets)
  const [value0, setValue0] = useState<string>('')
  const [value1, setValue1] = useState<string>('')
  const walletId = selectedWallet?.wallet.id ?? ''
  const tokenId = selectedWallet?.tokenId
  const exchangedFlipInputRef = React.useRef<ExchangedFlipInputRef>(null)

  const onAmountChanged = (amounts: ExchangedFlipInputAmounts): void => {
    consify(amounts)
  }

  const onPress0 = () => {
    exchangedFlipInputRef.current?.setAmount('crypto', value0)
  }
  const onChangeText0 = (text: string) => {
    setValue0(text)
  }
  const onPress1 = () => {
    exchangedFlipInputRef.current?.setAmount('fiat', value1)
  }
  const onChangeText1 = (text: string) => {
    setValue1(text)
  }

  const onAmountsChanged = (amounts: ExchangedFlipInputAmounts) => {
    console.log(JSON.stringify(amounts, null, 2))
  }

  const handleFlipInputModal = () => {
    if (selectedWallet == null) return
    Airship.show<FlipInputModalResult>(bridge => {
      if (selectedWallet == null) return null
      return <FlipInputModal2 bridge={bridge} wallet={selectedWallet.wallet} tokenId={tokenId} onAmountsChanged={onAmountsChanged} />
    }).catch(error => console.log(error))
  }

  const coreWallet = selectedWallet?.wallet
  const currencyCode = coreWallet?.currencyInfo.currencyCode ?? ''
  let balance = coreWallet?.balances[currencyCode] ?? ''
  if (eq(balance, '0')) balance = ''
  const headerText = 'Select Wallet'
  const headerCallback = () => console.log('Header pressed')

  // Hack. If wallet name first char is lowercase, start with crypto focused, otherwise default to fiat
  const defaultField = (coreWallet?.name?.charAt(0).toLowerCase() ?? '') === (coreWallet?.name?.charAt(0) ?? '')

  // Hack. If wallet name 2nd char is lowercase, start with keyboard down
  const keyboardVisible = (coreWallet?.name?.charAt(1).toLowerCase() ?? '') !== (coreWallet?.name?.charAt(1) ?? '')

  const editable = (coreWallet?.name?.charAt(2).toLowerCase() ?? '') === (coreWallet?.name?.charAt(2) ?? '')
  const returnKeyType: ReturnKeyType = 'done'

  return (
    <View style={styles.headerContainer}>
      <Card>
        <ExchangedFlipInput2
          ref={exchangedFlipInputRef}
          walletId={walletId}
          headerText={headerText}
          editable={editable}
          headerCallback={headerCallback}
          returnKeyType={returnKeyType}
          forceField={defaultField ? 'crypto' : 'fiat'}
          keyboardVisible={keyboardVisible}
          tokenId={tokenId}
          startNativeAmount={balance}
          onAmountChanged={onAmountChanged}
        />
      </Card>
      <OutlinedTextInput value={value0} onChangeText={onChangeText0} autoFocus={false} />
      <MainButton label="Set Crypto Amt" onPress={onPress0} />
      <OutlinedTextInput value={value1} onChangeText={onChangeText1} autoFocus={false} />
      <MainButton label="Set Fiat Amt" onPress={onPress1} />
      <MainButton label="Launch FlipInputModal2" onPress={handleFlipInputModal} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // The sort & add buttons are stacked on top of the header component:
  // Header Stack style
  headerContainer: {
    margin: theme.rem(2),
    width: 320,
    height: 100
  },
  headerText: {
    flex: 1
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneButton: {
    color: theme.textLink
  },
  // The two lists are stacked vertically on top of each other:
  listStack: {
    flexGrow: 1
  },
  listSpinner: {
    flexGrow: 1,
    alignSelf: 'center'
  }
}))
