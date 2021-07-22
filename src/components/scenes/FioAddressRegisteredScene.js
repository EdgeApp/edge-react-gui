// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import { FIO_ADDRESS_LIST } from '../../constants/SceneKeys.js'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type NavigationProp, Actions } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { PrimaryButton } from '../themed/ThemedButtons'

export type OwnProps = {
  fioName: string,
  expiration: string,
  navigation: NavigationProp<'fioAddressRegisterSuccess'>
}

type Props = OwnProps & ThemeProps

class FioAddressRegistered extends React.Component<Props> {
  componentDidMount() {
    const { fioName } = this.props
    this.props.navigation.setParams({
      renderTitle: this.renderTitle(fioName)
    })
  }

  renderTitle = (title: string) => {
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.titleWrapper}>
        <T style={styles.titleStyle}>{title}</T>
      </View>
    )
  }

  render() {
    const { fioName, expiration, theme } = this.props
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="header">
        <View style={styles.view}>
          <View style={styles.texts}>
            <View style={styles.image}>
              <Image source={theme.fioAddressLogo} />
            </View>
            <T style={styles.text}>{s.strings.fio_address_details_screen_registered}</T>
            <T style={styles.title}>{fioName}</T>
            <T style={styles.text}>
              {`${s.strings.fio_address_details_screen_expires} `}
              {formatDate(new Date(expiration))}
            </T>
          </View>
          <PrimaryButton marginRem={2} onPress={() => Actions.push(FIO_ADDRESS_LIST)} label={s.strings.title_fio_names} />
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  view: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: theme.rem(1)
  },
  texts: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.rem(2.5)
  },
  text: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  image: {
    marginLeft: theme.rem(0.25),
    marginBottom: theme.rem(3)
  },
  title: {
    fontSize: theme.rem(1.75),
    color: theme.primaryText,
    marginTop: theme.rem(1.25),
    marginBottom: theme.rem(0.75)
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: theme.rem(1.25),
    color: theme.primaryText
  },
  expiration: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    textAlign: 'center',
    marginTop: theme.rem(-0.5),
    paddingBottom: theme.rem(0.75)
  },
  titleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
}))

export const FioAddressRegisteredScene = withTheme(FioAddressRegistered)
