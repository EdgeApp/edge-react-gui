import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { WcDetails } from '../../util/walletConnectActions'
import { ChevronDownIcon, ChevronUpIcon } from '../icons/ThemedIcons'
import { EdgeRow } from '../rows/EdgeRow'
import { type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  details: WcDetails[]
}

/**
 * Every field a signature covers, folded away behind a header row. The cards
 * above already say what the request does; the raw fields are for the few
 * who want to check them, so they stay hidden until tapped.
 */
export const WcDetailsCard: React.FC<Props> = props => {
  const { details } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isExpanded, setIsExpanded] = React.useState(false)

  const handleToggle = useHandler(() => {
    setIsExpanded(expanded => !expanded)
  })

  const sections = details.filter(section => section.rows.length > 0)
  if (sections.length === 0) return null

  const summary = sections.map(section => section.title).join(', ')
  const rows: React.ReactNode[] = []
  for (const section of sections) {
    // One section needs no heading, since the summary already names it:
    if (sections.length > 1) {
      rows.push(
        <EdgeRow key={`title:${section.title}`} title={section.title} />
      )
    }
    section.rows.forEach((row, index) => {
      rows.push(
        <EdgeRow
          key={`${section.title}:${index}`}
          title={row.name}
          body={row.value}
          maximumHeight="large"
        />
      )
    })
  }

  return (
    <EdgeCard sections>
      <EdgeRow
        title={lstrings.wc_details_title}
        rightButtonType="none"
        onPress={handleToggle}
        testID="wcDetailsToggle"
      >
        <View style={styles.summary}>
          <EdgeText style={styles.summaryText} numberOfLines={1}>
            {summary}
          </EdgeText>
          {isExpanded ? (
            <ChevronUpIcon size={theme.rem(1)} color={theme.iconTappable} />
          ) : (
            <ChevronDownIcon size={theme.rem(1)} color={theme.iconTappable} />
          )}
        </View>
      </EdgeRow>
      {isExpanded ? rows : null}
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryText: {
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  }
}))
