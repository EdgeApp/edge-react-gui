// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import { CryptoIcon } from '../icons/CryptoIcon'
import { MaskedText, MaskedTextInput } from "react-native-mask-text";
import { useState } from '../../types/reactHooks.js'

// MBztBV7R8kT37NvxnWZX6egAcM1qihxJBv

type Props = {|
  title: string,
  token?: EdgeToken,
  tokenId?: string,
  wallet: EdgeCurrencyWallet,
|}

export function FlipInput(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [amountInput, setAmountInput] = useState(0)
  const { title, wallet, tokenId } = props

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CryptoIcon marginRem={[0, 1, 0, 0]} sizeRem={1.75} tokenId={tokenId} walletId={wallet.id} />
        <EdgeText>{title}</EdgeText>
      </View>
      <View>
        <MaskedText
          style={styles.output}
          type="currency"
          options={{
            decimalSeparator: '.',
            groupSeparator: ',',
            precision: 5
          }}
        >
          {amountInput}
        </MaskedText>
        <MaskedTextInput
          style={styles.input}
          type="currency"
          keyboardType="numeric"
          options={{
            decimalSeparator: '.',
            groupSeparator: ',',
            precision: 5,
          }}
          onChangeText={(text, rawText) => {
            setAmountInput(parseInt(rawText))
          }}
        />
      </View>
    </View>

  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {

  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  input: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1.5),
  },
  output: {
    color: theme.primaryText,
    fontSize: theme.rem(1),
    marginTop: theme.rem(1)
  }
}))