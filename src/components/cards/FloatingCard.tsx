import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useSelector } from '../../types/reactRedux'
import { getLightAccountIconUri } from '../../util/CdnUris'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'

interface Props {
  title: string
  message: string
  visible?: boolean // Master toggle that trumps other visibility logic
}

const DUR_FADEIN = 250
const DUR_FADEOUT = 100

const FloatingCardComponent = (props: Props) => {
  const { title, message, visible = false } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const loginStatus = useSelector(state => state.ui.settings.loginStatus ?? false)
  const activeUsername = useSelector(state => state.core.account.username)

  const isCardShown = visible && loginStatus && activeUsername == null

  return (
    <Fade visible={isCardShown} duration={isCardShown ? DUR_FADEIN : DUR_FADEOUT}>
      <View style={styles.cardContainer}>
        <FastImage style={styles.icon} source={{ uri: getLightAccountIconUri(theme, 'icon-notif') }} />
        <View>
          <EdgeText style={styles.textTitle}>{title}</EdgeText>
          <EdgeText style={styles.textMessage} numberOfLines={3}>
            {message}
          </EdgeText>
        </View>
      </View>
    </Fade>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: theme.rem(6),
    height: theme.rem(3.5),
    backgroundColor: theme.modal,
    borderRadius: theme.rem(0.5),
    shadowOffset: { width: 0, height: theme.rem(0.125) },
    shadowOpacity: 0.7,
    shadowRadius: theme.rem(0.5),
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: theme.rem(0.5),
    padding: theme.rem(0.5)
  },
  icon: {
    height: theme.rem(2.5),
    width: theme.rem(2.5)
  },
  textTitle: {
    color: theme.warningIcon,
    marginLeft: theme.rem(0.5),
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold
  },
  textMessage: {
    color: theme.warningIcon,
    marginLeft: theme.rem(0.5),
    fontSize: theme.rem(0.75)
  }
}))

export const FloatingCard = React.memo(FloatingCardComponent)
