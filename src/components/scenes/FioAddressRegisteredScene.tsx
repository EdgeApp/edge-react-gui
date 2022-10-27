import * as React from 'react'
import { Image, View } from 'react-native'

import { formatDate } from '../../locales/intl'
import s from '../../locales/strings'
import { FormattedText } from '../../modules/UI/components/FormattedText/FormattedText.ui'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'

interface OwnProps {
  navigation: NavigationProp<'fioAddressRegisterSuccess'>
  route: RouteProp<'fioAddressRegisterSuccess'>
}

type Props = OwnProps & ThemeProps

export class FioAddressRegistered extends React.Component<Props> {
  renderExpDate() {
    const { theme, route } = this.props
    const { expiration } = route.params
    if (expiration != null) {
      const styles = getStyles(theme)

      return (
        <FormattedText style={styles.text}>
          {`${s.strings.fio_address_details_screen_expires} `}
          {formatDate(new Date(expiration))}
        </FormattedText>
      )
    }

    return null
  }

  render() {
    const { theme, navigation, route } = this.props
    const { fioName } = route.params
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="header">
        <View style={styles.view}>
          <View style={styles.texts}>
            <View style={styles.image}>
              <Image source={theme.fioAddressLogo} />
            </View>
            <FormattedText style={styles.text}>{s.strings.fio_address_details_screen_registered}</FormattedText>
            <FormattedText style={styles.title}>{fioName}</FormattedText>
            {this.renderExpDate()}
          </View>
          <MainButton marginRem={2} onPress={() => navigation.navigate('fioAddressList', {})} label={s.strings.title_fio_names} />
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
  expiration: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    textAlign: 'center',
    marginTop: theme.rem(-0.5),
    paddingBottom: theme.rem(0.75)
  }
}))

export const FioAddressRegisteredScene = withTheme(FioAddressRegistered)
