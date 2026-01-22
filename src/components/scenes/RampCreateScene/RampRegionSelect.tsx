import { useFocusEffect } from '@react-navigation/native'
import * as React from 'react'
import { View } from 'react-native'
import Feather from 'react-native-vector-icons/Feather'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { EdgeTouchableOpacity } from '../../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ChevronRightIcon } from '../../icons/ThemedIcons'
import { SceneContainer } from '../../layout/SceneContainer'
import { showError } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'

interface Props {
  headerTitle: string
  onRegionSelect: () => Promise<void>
}

export const RampRegionSelect: React.FC<Props> = props => {
  const { headerTitle, onRegionSelect } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleRegionSelect = useHandler(() => {
    onRegionSelect().catch((error: unknown) => {
      showError(error)
    })
  })

  // Auto-open region selection modal every time the scene gains focus
  // TODO: Replace the entire instructional scene with a country selection list
  // instead of a modal in the event there is no region selected.
  useFocusEffect(
    React.useCallback(() => {
      handleRegionSelect()
    }, [handleRegionSelect])
  )

  return (
    <SceneWrapper scroll hasTabs>
      <SceneContainer headerTitle={headerTitle}>
        <EdgeText style={styles.subtitleText}>
          {lstrings.trade_region_select_start_steps}
        </EdgeText>

        <View style={styles.stepsCard}>
          <View style={styles.stepRow}>
            <EdgeText style={styles.stepNumberText}>
              {sprintf(lstrings.step_prefix_s, '1')}
            </EdgeText>
            <EdgeText style={styles.stepText} numberOfLines={0}>
              {lstrings.trade_region_select_step_1}
            </EdgeText>
          </View>
          <View style={styles.stepRow}>
            <EdgeText style={styles.stepNumberText}>
              {sprintf(lstrings.step_prefix_s, '2')}
            </EdgeText>
            <EdgeText style={styles.stepText} numberOfLines={0}>
              {lstrings.trade_region_select_step_2}
            </EdgeText>
          </View>
          <View style={styles.stepRow}>
            <EdgeText style={styles.stepNumberText}>
              {sprintf(lstrings.step_prefix_s, '3')}
            </EdgeText>
            <EdgeText style={styles.stepText} numberOfLines={0}>
              {lstrings.trade_region_select_step_3}
            </EdgeText>
          </View>
          <View style={styles.stepRow}>
            <EdgeText style={styles.stepNumberText}>
              {sprintf(lstrings.step_prefix_s, '4')}
            </EdgeText>
            <EdgeText style={styles.stepText} numberOfLines={0}>
              {lstrings.trade_region_select_step_4}
            </EdgeText>
          </View>
        </View>

        <EdgeTouchableOpacity
          style={styles.regionButton}
          onPress={handleRegionSelect}
        >
          <Feather
            style={styles.globeIcon}
            name="globe"
            color={theme.iconTappable}
            size={theme.rem(1.5)}
          />
          <EdgeText
            style={styles.regionButtonText}
            disableFontScaling
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {lstrings.buy_sell_crypto_select_country_button}
          </EdgeText>
          <ChevronRightIcon color={theme.iconTappable} size={theme.rem(1.25)} />
        </EdgeTouchableOpacity>
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  stepsCard: {
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(0.5),
    padding: theme.rem(1),
    backgroundColor: theme.cardBaseColor,
    borderRadius: theme.rem(0.5),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.cardBorderColor
  },
  stepRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginVertical: theme.rem(0.25),
    gap: theme.rem(0.5)
  },
  stepNumberText: {
    fontWeight: '600' as const,
    minWidth: theme.rem(1.25)
  },
  stepText: {
    flex: 1
  },
  regionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.cardBaseColor,
    borderRadius: theme.rem(0.5),
    margin: theme.rem(0.5),
    padding: theme.rem(1),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.cardBorderColor,
    gap: theme.rem(0.5)
  },
  regionButtonText: {
    flexShrink: 1,
    color: theme.primaryText,
    fontSize: theme.rem(1.1),
    fontFamily: theme.fontFaceDefault
  },
  globeIcon: {
    marginRight: theme.rem(0.75)
  },
  subtitleText: {
    color: theme.primaryText,
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceDefault,
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5),
    marginHorizontal: theme.rem(0.5)
  }
}))
