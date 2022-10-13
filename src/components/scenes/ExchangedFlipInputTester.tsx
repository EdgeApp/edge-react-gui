import * as React from 'react'
import { ReturnKeyType, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { useSelectedWallet } from '../../hooks/useSelectedWallet'
import { useState } from '../../types/reactHooks'
import { consify } from '../../util/utils'
import { Card } from '../cards/Card'
import { Theme, useTheme } from '../services/ThemeContext'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts, ExchangedFlipInputGetMethodsResponse } from '../themed/ExchangedFlipInput2'
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
  const methods = React.useRef<ExchangedFlipInputGetMethodsResponse | undefined>()

  const onAmountChanged = (amounts: ExchangedFlipInputAmounts): void => {
    consify(amounts)
  }

  const onPress0 = () => {
    methods.current?.setAmount('crypto', value0)
  }
  const onChangeText0 = (text: string) => {
    setValue0(text)
  }
  const onPress1 = () => {
    methods.current?.setAmount('fiat', value1)
  }
  const onChangeText1 = (text: string) => {
    setValue1(text)
  }

  const getMethods = (m: ExchangedFlipInputGetMethodsResponse) => {
    methods.current = m
  }
  const coreWallet = selectedWallet?.wallet
  const currencyCode = coreWallet?.currencyInfo.currencyCode ?? ''
  const balance = coreWallet?.balances[currencyCode] ?? ''
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
          walletId={walletId}
          headerText={headerText}
          editable={editable}
          headerCallback={headerCallback}
          returnKeyType={returnKeyType}
          forceField={defaultField ? 'crypto' : 'fiat'}
          keyboardVisible={keyboardVisible}
          getMethods={getMethods}
          tokenId={tokenId}
          startNativeAmount={balance}
          onAmountChanged={onAmountChanged}
        />
      </Card>
      <OutlinedTextInput value={value0} onChangeText={onChangeText0} autoFocus={false} />
      <MainButton label="Set Crypto Amt" onPress={onPress0} />
      <OutlinedTextInput value={value1} onChangeText={onChangeText1} autoFocus={false} />
      <MainButton label="Set Fiat Amt" onPress={onPress1} />
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
