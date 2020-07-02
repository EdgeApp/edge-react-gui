// @flow

import { createSimpleConfirmModal } from 'edge-components'
import React, { Component } from 'react'
import { Image, Platform, TouchableOpacity, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { launchModal } from '../../../../components/common/ModalProvider.js'
import { EXCLAMATION, MATERIAL_COMMUNITY } from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import { styles as sceneStyles } from '../../../../styles/scenes/CryptoExchangeQuoteSceneStyles.js'
import { THEME } from '../../../../theme/variables/airbitz.js'
import FormattedText from '../../components/FormattedText/FormattedText.ui.js'
import { Icon } from '../Icon/Icon.ui'

type Props = {
  isTop?: boolean | null,
  headline: string,
  walletIcon: string,
  cryptoAmount: string,
  currency: string,
  currencyCode: string,
  fiatCurrencyCode: string,
  fiatCurrencyAmount: string,
  walletName: string,
  miningFee?: string | null,
  isEstimate?: boolean
}
type State = {}

class ExchangeQuoteComponent extends Component<Props, State> {
  renderBottom = () => {
    const styles = sceneStyles.quoteDetailContainer
    if (this.props.isTop) {
      return (
        <View style={styles.bottomRow}>
          <View style={styles.bottomContentBox}>
            <View style={styles.bottomContentBoxLeft}>
              <FormattedText style={styles.minerFeeText}>{s.strings.mining_fee}</FormattedText>
            </View>
            <View style={styles.bottomContentBoxRight}>
              <FormattedText style={styles.minerFeeRightText}>{this.props.miningFee}</FormattedText>
            </View>
          </View>
        </View>
      )
    }
    return null
  }

  showExplanationForEstimate = () => {
    const modal = createSimpleConfirmModal({
      title: s.strings.estimated_exchange_rate,
      message: s.strings.estimated_exchange_rate_body,
      icon: <Icon type={MATERIAL_COMMUNITY} name={EXCLAMATION} size={30} />,
      buttonText: s.strings.string_ok
    })
    launchModal(modal).then((response: null) => {})
  }

  renderHeadline = () => {
    const styles = sceneStyles.quoteDetailContainer
    if (this.props.isEstimate) {
      return (
        <TouchableOpacity style={styles.headlineRow} onPress={this.showExplanationForEstimate}>
          <FormattedText style={styles.headlineEstimateText}>
            {s.strings.approximately} {this.props.headline}
          </FormattedText>
          <IonIcon
            name={Platform.OS === 'ios' ? 'ios-information-circle-outline' : 'md-information-circle-outline'}
            color={THEME.COLORS.ACCENT_ORANGE}
            size={THEME.rem(0.875)}
          />
        </TouchableOpacity>
      )
    }
    return <FormattedText style={styles.headlineText}>{this.props.headline}</FormattedText>
  }

  render() {
    const styles = sceneStyles.quoteDetailContainer
    const container = this.props.isTop ? styles.containerExpanded : styles.containerCollapsed
    return (
      <View style={styles.container}>
        {this.renderHeadline()}
        <View style={container}>
          <View style={styles.topRow}>
            <View style={styles.logoContainer}>
              <View style={styles.iconContainer}>
                <Image style={styles.currencyIcon} source={{ uri: this.props.walletIcon }} />
              </View>
            </View>
            <View style={styles.walletInfoContainer}>
              <FormattedText style={styles.currencyNameText} isBold numberOfLines={1}>
                {this.props.currency}
              </FormattedText>
              <FormattedText style={styles.walletNameText} numberOfLines={1}>
                {this.props.walletName}
              </FormattedText>
            </View>
            <View style={styles.amountInfoContainer}>
              <FormattedText style={styles.cryptoAmountText} isBold>
                {this.props.cryptoAmount} {this.props.currencyCode}
              </FormattedText>
              <FormattedText style={styles.fiatAmountText}>
                {this.props.fiatCurrencyAmount} {this.props.fiatCurrencyCode}
              </FormattedText>
            </View>
          </View>
          {this.renderBottom()}
        </View>
      </View>
    )
  }
}

export { ExchangeQuoteComponent }
