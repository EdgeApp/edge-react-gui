// @flow

import * as React from 'react'
import { Image, StyleSheet, Text, TouchableHighlight, View } from 'react-native'

import s from '../../locales/strings'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'

type Props = {
  currencyCode: string,
  image?: string,
  name: string,
  type: 'wallet' | 'token',
  onPress(): Promise<void>
}

export class WalletListModalCreateRow extends React.Component<Props> {
  render() {
    const { image, currencyCode, name, type, onPress } = this.props
    return (
      <View style={styles.container}>
        <TouchableHighlight
          underlayColor={THEME.COLORS.TRANSPARENT}
          onPress={onPress}
        >
          <View
            style={[
              type === 'token' ? styles.containerToken : null,
              styles.rowContainerTop
            ]}
          >
            <View style={styles.containerLeft}>
              <Image
                style={styles.imageContainer}
                source={{ uri: image }}
                resizeMode="contain"
              />
            </View>
            <View
              style={[styles.containerCenter, styles.containerCreateCenter]}
            >
              <FormattedText style={styles.containerCenterCurrency}>
                {currencyCode}
              </FormattedText>
              <FormattedText style={styles.containerCenterName}>
                {name}
              </FormattedText>
            </View>
            <View style={styles.containerRight}>
              <Text style={styles.createText}>
                {type === 'wallet'
                  ? s.strings.fragment_create_wallet_create_wallet
                  : s.strings.wallet_list_add_token}
              </Text>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}

const rawStyles = {
  container: {
    width: '100%'
  },
  containerToken: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.OFF_WHITE
  },
  rowContainerTop: {
    width: '100%',
    height: scale(76),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: scale(10),
    paddingRight: scale(10),
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  containerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    width: scale(36)
  },
  containerCenter: {
    flex: 9,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  containerCenterCurrency: {
    fontSize: scale(18)
  },
  containerCenterName: {
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  containerCreateCenter: {
    flexDirection: 'column',
    textAlign: 'left'
  },
  containerRight: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row'
  },
  imageContainer: {
    height: scale(24),
    width: scale(24)
  },
  createText: {
    fontFamily: THEME.FONTS.DEFAULT,
    textAlign: 'right',
    marginRight: 10
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
