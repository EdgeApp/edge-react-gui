// @flow

import * as React from 'react'
import { Image, Text, View } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'

import accountIcon from '../../../../assets/images/sidenav/accounts.png'
import { ExchangeRate } from '../../../../components/common/ExchangeRate.js'
import { SceneWrapper } from '../../../../components/common/SceneWrapper.js'
import s from '../../../../locales/strings'
import { getDisplayDenominationFull, getPrimaryExchangeDenomination } from '../../../../selectors/DenominationSelectors.js'
import { getExchangeRate, getSelectedWallet } from '../../../../selectors/WalletSelectors.js'
import { connect } from '../../../../types/reactRedux.js'
import type { GuiDenomination } from '../../../../types/types.js'
import { emptyGuiDenomination } from '../../../../types/types.js'
import { getCurrencyIcon } from '../../../../util/CurrencyInfoHelpers.js'
import { getDenomFromIsoCode, getObjectDiff } from '../../../../util/utils.js'
import FormattedText from '../FormattedText/FormattedText.ui.js'
import { Button } from './Component/Button/Button.ui'
import { Main } from './Component/Main.js'
import styles from './style'

type StateProps = {
  currencyLogo: string,
  primaryDisplayCurrencyCode: string,
  primaryDisplayDenomination: GuiDenomination,
  primaryExchangeDenomination: GuiDenomination,
  secondaryDisplayCurrencyCode: string,
  secondaryToPrimaryRatio: number,
  username: string,
  usersView: boolean,
  exchangeRate: number
}
type DispatchProps = {
  openSelectUser: () => void,
  closeSelectUser: () => void
}
type Props = StateProps & DispatchProps

class ControlPanelComponent extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const diffElement = getObjectDiff(this.props, nextProps, {
      primaryDisplayDenomination: true,
      primaryExchangeDenomination: true,
      styles: true
    })

    return !!diffElement
  }

  render() {
    const {
      exchangeRate,
      currencyLogo,
      primaryDisplayCurrencyCode,
      primaryDisplayDenomination,
      primaryExchangeDenomination,
      secondaryDisplayCurrencyCode,
      secondaryToPrimaryRatio
    } = this.props

    const secondaryExchangeDenomination = secondaryDisplayCurrencyCode ? getDenomFromIsoCode(secondaryDisplayCurrencyCode) : ''

    const primaryCurrencyInfo = {
      displayCurrencyCode: primaryDisplayCurrencyCode,
      displayDenomination: primaryDisplayDenomination || emptyGuiDenomination,
      exchangeDenomination: primaryExchangeDenomination || emptyGuiDenomination,
      exchangeCurrencyCode: primaryDisplayCurrencyCode
    }
    const secondaryCurrencyInfo = {
      displayCurrencyCode: secondaryDisplayCurrencyCode,
      displayDenomination: secondaryExchangeDenomination || emptyGuiDenomination,
      exchangeDenomination: secondaryExchangeDenomination || emptyGuiDenomination,
      exchangeCurrencyCode: secondaryDisplayCurrencyCode
    }

    const arrowIcon = this.props.usersView ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
    const currencyLogoIcon = { uri: currencyLogo }

    return (
      <SceneWrapper hasHeader={false} hasTabs={false}>
        <View style={styles.header}>
          {!!currencyLogo && <Image style={styles.iconImage} source={currencyLogoIcon} />}
          <View style={styles.exchangeContainer}>
            {exchangeRate ? (
              <ExchangeRate primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={secondaryToPrimaryRatio} />
            ) : (
              <FormattedText style={styles.exchangeRateText}>{s.strings.exchange_rate_loading_singular}</FormattedText>
            )}
          </View>
        </View>

        <Button onPress={this.toggleUserList} style={styles.toggleButton} underlayColor={styles.underlay.color}>
          <Button.Row>
            <Button.Left>
              <Image style={styles.iconImage} resizeMode="contain" source={accountIcon} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{this.props.username}</Text>
              </Button.Text>
            </Button.Center>

            <Button.Right>
              <MaterialIcon style={styles.toggleIcon} name={arrowIcon} />
            </Button.Right>
          </Button.Row>
        </Button>
        <Main />
      </SceneWrapper>
    )
  }

  toggleUserList = () => {
    return this.props.usersView ? this.props.closeSelectUser() : this.props.openSelectUser()
  }
}

export const ControlPanel = connect<StateProps, DispatchProps, {}>(
  state => {
    const guiWallet = getSelectedWallet(state)
    const currencyCode = state.ui.wallets.selectedCurrencyCode
    const exchangeRate = guiWallet ? getExchangeRate(state, currencyCode, guiWallet.isoFiatCurrencyCode) : 0

    // Try catch block to check specific details why the guiWallet.metaTokens becomes undefined
    const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
    // if selected currencyCode is parent wallet currencyCode
    const currencyLogo = getCurrencyIcon(guiWallet.currencyCode, currencyCode).symbolImage
    const secondaryDisplayCurrencyCode = guiWallet.fiatCurrencyCode
    const secondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    const primaryDisplayDenomination = getDisplayDenominationFull(state, currencyCode)
    const primaryExchangeDenomination = getPrimaryExchangeDenomination(state, currencyCode)
    const secondaryDisplayAmount =
      (parseFloat(1) * parseFloat(secondaryToPrimaryRatio) * parseFloat(primaryDisplayDenomination.multiplier)) /
      parseFloat(primaryExchangeDenomination.multiplier)

    return {
      currencyCode,
      currencyLogo,
      primaryDisplayCurrencyCode: currencyCode,
      primaryDisplayDenomination,
      primaryExchangeDenomination,
      exchangeRate,
      secondaryDisplayCurrencyCode,
      secondaryDisplayAmount,
      secondaryToPrimaryRatio,
      usersView: state.ui.scenes.controlPanel.usersView,
      username: state.core.account.username
    }
  },
  dispatch => ({
    openSelectUser() {
      dispatch({ type: 'OPEN_SELECT_USER' })
    },
    closeSelectUser() {
      dispatch({ type: 'CLOSE_SELECT_USER' })
    }
  })
)(ControlPanelComponent)
