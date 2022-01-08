// @flow

import * as React from 'react'
import { View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext.js'
import { ClickableRow } from '../../../components/themed/ClickableRow'
import { EdgeText } from '../../../components/themed/EdgeText'
import { formatDate } from '../../../locales/intl.js'
import s from '../../../locales/strings.js'

type FioNameProps = {
  name: string,
  expiration?: string,
  bundledTxs?: string,
  icon: React.Node,
  onPress: () => void
}

const FioName = (props: FioNameProps & ThemeProps) => {
  const { name, expiration, bundledTxs, onPress, icon, theme } = props
  const styles = getStyles(theme)

  const renderSubTitle = () => {
    if (expiration != null) {
      const subTitle = `${s.strings.fio_address_details_screen_expires} ${formatDate(new Date(expiration))}`
      return <EdgeText style={styles.infoSubtitle}>{subTitle}</EdgeText>
    }

    if (bundledTxs != null) {
      const subTitle = `${s.strings.fio_address_details_screen_bundled_txs}: ${bundledTxs}`
      return <EdgeText style={styles.infoSubtitle}>{subTitle}</EdgeText>
    }

    return null
  }

  return (
    <ClickableRow onPress={() => onPress()}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.info}>
        <EdgeText style={styles.infoTitle}>{name}</EdgeText>
        {renderSubTitle()}
      </View>
      <View style={styles.arrow}>
        <FontAwesomeIcon name="angle-right" size={theme.rem(1.5)} color={theme.icon} />
      </View>
    </ClickableRow>
  )
}

export const FioNameRow = withTheme(FioName)

const getStyles = cacheStyles((theme: Theme) => ({
  lastItem: {
    marginBottom: 0
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  info: {
    flex: 4
  },
  infoTitle: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  infoSubtitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  }
}))
