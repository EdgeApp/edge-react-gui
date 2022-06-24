// @flow

import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { DebtAmountTile, NetworkFeeTile } from '../../cards/LoanDebtsAndCollateralComponents'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoFiatAmountRow } from '../../data/row/CryptoFiatAmountRow'
import { Space } from '../../layout/Space'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { CurrencyRow } from '../../shared/CurrencyRow'
import { Alert } from '../../themed/Alert'
import { SafeSlider } from '../../themed/SafeSlider'
import { SceneHeader } from '../../themed/SceneHeader'
import { TappableRow } from '../../themed/TappableRow'
import { Tile } from '../../tiles/Tile'

export type Props = {
  // borrowEngine: BorrowEngine,
}

export const LoanCloseScene = (props: Props) => {
  // const { borrowEngine } = props
  const { wallet, debts, networkFee, nativeAmount, tokenId } = useDummy()

  const theme = useTheme()
  const styles = getStyles(theme)

  // Placeholders
  const onSliderComplete = async (reset: () => void) => {
    console.log('🕺')
  }

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_close_loan_title} style={styles.sceneHeader}>
        <Space right>
          <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
        </Space>
      </SceneHeader>
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <DebtAmountTile title={s.strings.loan_remaining_principle} wallet={wallet} debts={debts} />
        <NetworkFeeTile wallet={wallet} nativeAmount={networkFee} />
        <Tile title={s.strings.loan_collateral_amount} type="static">
          <CryptoFiatAmountRow nativeAmount={nativeAmount} tokenId={tokenId} wallet={wallet} />
        </Tile>
        <Tile title={s.strings.loan_collateral_destination} type="static">
          <TappableRow>
            <CurrencyRow wallet={wallet} tokenId={tokenId} />
          </TappableRow>
        </Tile>
        <Alert title={s.strings.loan_close_loan_title} message={s.strings.loan_close_loan_message} type="warning" numberOfLines={7} marginRem={[1, 1]} />
        <Space top bottom={2}>
          <SafeSlider onSlidingComplete={onSliderComplete} disabled={false} />
        </Space>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.rem(1)
  }
}))

const useDummy = () => {
  const account = useSelector(state => state.core.account)

  const wallet = account.currencyWallets['+kO8fywA3JrvsRcJ9bp0nYM/ojRE4VloRC8aqfI8sSc=']
  const tokenId = '2260fac5e5542a773aa44fbcfedf7c193bc2c599'
  const nativeAmount = '100000000'
  const debts = [
    {
      tokenId,
      nativeAmount,
      apr: 0
    }
  ]
  const networkFee = '10000000000000000'

  return { wallet, debts, networkFee, nativeAmount, tokenId }
}
