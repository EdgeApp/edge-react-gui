// @flow

import React, { Component } from 'react'
import { Image, Text, View } from 'react-native'
import MDIcon from 'react-native-vector-icons/MaterialIcons'

import accountIcon from '../../../../assets/images/sidenav/accounts.png'
import { SceneWrapper } from '../../../../components/common/SceneWrapper.js'
import s from '../../../../locales/strings'
import { emptyGuiDenomination } from '../../../../types/types.js'
import type { GuiDenomination } from '../../../../types/types.js'
import { getDenomFromIsoCode, getObjectDiff } from '../../../../util/utils.js'
import ExchangeRate from '../ExchangeRate/index.js'
import FormattedText from '../FormattedText'
import { Button } from './Component/Button/Button.ui'
import Main from './Component/MainConnector'
import styles from './style'

export type Props = {
  currencyLogo: string,
  primaryDisplayCurrencyCode: string,
  primaryDisplayDenomination: GuiDenomination,
  primaryExchangeDenomination: GuiDenomination,
  secondaryDisplayCurrencyCode: string,
  secondaryToPrimaryRatio: number,
  styles: Object,
  username: string,
  openSelectUser: () => void,
  closeSelectUser: () => void,
  usersView: boolean,
  exchangeRate: number
}

export default class ControlPanel extends Component<Props> {
  shouldComponentUpdate (nextProps: Props) {
    const diffElement = getObjectDiff(this.props, nextProps, {
      primaryDisplayDenomination: true,
      primaryExchangeDenomination: true,
      styles: true
    })

    return !!diffElement
  }

  render () {
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
      <SceneWrapper background="drawer" hasHeader={false} hasTabs={false}>
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
              <Image style={styles.iconImage} resizeMode={'contain'} source={accountIcon} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{this.props.username}</Text>
              </Button.Text>
            </Button.Center>

            <Button.Right>
              <MDIcon style={styles.toggleIcon} name={arrowIcon} />
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
