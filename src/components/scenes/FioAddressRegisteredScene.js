// @flow

import * as React from 'react'
import { Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/SceneKeys'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling'
import { SceneWrapper } from '../common/SceneWrapper'

export type NavProps = {
  fioName: string,
  expiration: string,
  feeCollected: number,
  navigation: any
}

type Props = NavProps

export class FioAddressRegisteredScene extends React.Component<Props> {
  componentDidMount() {
    const { fioName } = this.props
    this.props.navigation.setParams({
      renderTitle: this.renderTitle(fioName)
    })
  }

  renderTitle = (title: string) => {
    return (
      <View style={styles.titleWrapper}>
        <T style={styles.titleStyle}>{title}</T>
      </View>
    )
  }

  renderButton() {
    return (
      <View style={styles.buttons}>
        <TouchableHighlight style={styles.bottomButton} onPress={Actions[Constants.FIO_ADDRESS_LIST]} underlayColor={THEME.COLORS.SECONDARY}>
          <View style={styles.bottomButtonTextWrap}>
            <T style={styles.bottomButtonText}>{s.strings.title_fio_names}</T>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  render() {
    const { fioName, expiration } = this.props
    return (
      <SceneWrapper>
        <View style={styles.view}>
          <View style={styles.texts}>
            <View style={styles.image}>
              <Image source={fioAddressDetailsIcon} />
            </View>
            <T style={styles.text}>{s.strings.fio_address_details_screen_registered}</T>
            <T style={styles.title}>{fioName}</T>
            <T style={styles.text}>
              {`${s.strings.fio_address_details_screen_expires} `}
              {intl.formatExpDate(expiration)}
            </T>
          </View>
          {this.renderButton()}
        </View>
      </SceneWrapper>
    )
  }
}

const rawStyles = {
  view: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.rem(1)
  },
  texts: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(40)
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
  },
  image: {
    marginBottom: scale(50)
  },
  title: {
    fontSize: scale(28),
    color: THEME.COLORS.WHITE,
    marginTop: scale(20),
    marginBottom: scale(10)
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: scale(35)
  },
  bottomButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    borderRadius: scale(3),
    height: scale(50),
    marginLeft: scale(1),
    marginRight: scale(1),
    marginTop: scale(15)
  },
  bottomButtonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomButtonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  expiration: {
    fontSize: THEME.rem(0.75),
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    marginTop: THEME.rem(-0.5),
    paddingBottom: THEME.rem(0.75)
  },
  titleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
