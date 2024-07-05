import * as React from 'react'
import { View } from 'react-native'

import { formatDate } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { EdgeCard } from '../cards/EdgeCard'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { RowUi4 } from '../ui4/RowUi4'

interface FioNameProps {
  name: string
  expiration?: string
  bundledTxs?: string
  icon: React.ReactNode
  onPress: () => void
}

export const FioNameRow = (props: FioNameProps) => {
  const { name, expiration, bundledTxs, onPress, icon } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderSubTitle = () => {
    if (expiration != null) {
      const subTitle = `${lstrings.fio_address_details_screen_expires} ${formatDate(new Date(expiration))}`
      return <EdgeText style={styles.infoSubtitle}>{subTitle}</EdgeText>
    }

    if (bundledTxs != null) {
      const subTitle = `${lstrings.fio_address_details_screen_bundled_txs}: ${bundledTxs}`
      return <EdgeText style={styles.infoSubtitle}>{subTitle}</EdgeText>
    }

    return null
  }

  return (
    <EdgeCard>
      <RowUi4 icon={<View style={styles.icon}>{icon}</View>} onPress={onPress}>
        <View style={styles.info}>
          <EdgeText style={styles.infoTitle}>{name}</EdgeText>
          {renderSubTitle()}
        </View>
      </RowUi4>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(1.5),
    marginRight: theme.rem(0.5)
  },
  info: {
    flex: 1
  },
  infoTitle: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  infoSubtitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  }
}))
