// @flow

import { createSimpleConfirmModal } from 'edge-components'
import * as React from 'react'
import { Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { launchModal } from '../../../../components/common/ModalProvider.js'
import { EXCLAMATION, MATERIAL_COMMUNITY } from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import { THEME } from '../../../../theme/variables/airbitz.js'
import { scale } from '../../../../util/scaling.js'
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

export class ExchangeQuoteComponent extends React.Component<Props, State> {
  renderBottom = () => {
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

const rawStyles = {
  container: {
    width: '90%',
    borderRadius: 3
  },
  containerCollapsed: {
    width: '100%',
    minHeight: scale(65),
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    borderRadius: 3
  },
  containerExpanded: {
    width: '100%',
    height: scale(94),
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    borderRadius: 3
  },
  headlineEstimateText: {
    color: THEME.COLORS.ACCENT_ORANGE,
    fontSize: scale(14),
    marginRight: THEME.rem(0.375)
  },
  headlineRow: {
    flexDirection: 'row',
    paddingTop: scale(10),
    paddingBottom: scale(10),
    alignItems: 'center'
  },
  headlineText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    paddingTop: scale(10),
    paddingBottom: scale(10)
  },
  minerFeeText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    paddingTop: scale(5),
    paddingBottom: scale(10)
  },
  minerFeeRightText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    paddingTop: scale(5),
    paddingBottom: scale(10),
    alignSelf: 'flex-end'
  },
  currencyNameText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    paddingTop: scale(10),
    paddingLeft: scale(10)
  },
  cryptoAmountText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    paddingTop: scale(10),
    paddingRight: scale(10),
    textAlign: 'right'
  },
  walletNameText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    paddingLeft: scale(10),
    paddingBottom: scale(9)
  },
  fiatAmountText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    paddingRight: 10,
    paddingBottom: scale(9),
    textAlign: 'right'
  },
  topRow: {
    flexDirection: 'row'
  },
  bottomRow: {
    height: scale(45),
    paddingRight: 10,
    paddingLeft: 10
  },
  bottomContentBox: {
    borderTopWidth: 1,
    flexDirection: 'row',
    borderColor: THEME.COLORS.WHITE
  },
  bottomContentBoxLeft: {
    flex: 1
  },
  bottomContentBoxRight: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  walletInfoContainer: {
    flex: 8,
    alignItems: 'flex-start'
  },
  amountInfoContainer: {
    flex: 11,
    alignItems: 'flex-end'
  },
  logoContainer: {
    flex: 2,
    alignItems: 'center',
    paddingTop: scale(10),
    paddingLeft: 5
  },
  iconContainer: {
    position: 'relative',
    height: scale(29),
    width: scale(29),
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  currencyIcon: {
    height: scale(25),
    width: scale(25),
    resizeMode: 'contain'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
