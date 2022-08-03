// @flow

import * as React from 'react'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { type ActionDisplayInfo } from '../../controllers/action-queue/types'
import { memo, useMemo } from '../../types/reactHooks'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'

// -----------------------------------------------------------------------------
// A StepProgressRow consists of a left node + segment, right title text, and
// right body text.
// A collection of StepProgressRows makes up a StepProgressBar component.
// -----------------------------------------------------------------------------
const StepProgressRowComponent = ({
  isLast,
  isNodeActive,
  isNodeCompleted,
  stepText
}: {
  isLast: boolean,
  isNodeActive: boolean,
  isNodeCompleted: boolean,
  stepText: { title: string, message: string }
}) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  // Circular part of the step progress bar
  const node = useMemo(() => {
    if (isNodeActive) {
      // 'start' and 'end' LinearGradient coordinates close to each other give
      // the illusion of a partial solid fill.
      return <LinearGradient style={styles.circleCommon} start={{ x: 0, y: 0.49 }} end={{ x: 0, y: 0.51 }} colors={[theme.iconTappable, theme.fadeDisable]} />
    } else
      return (
        // Queued/completed
        <View style={isNodeCompleted ? styles.circleCompleted : styles.circleQueued} />
      )
  }, [isNodeActive, isNodeCompleted, styles.circleCommon, styles.circleCompleted, styles.circleQueued, theme.fadeDisable, theme.iconTappable])

  // Render connecting segment lines between the bottom of this node and the
  // top of the next node (omitting if this is the last node).
  const lineStyle = isNodeCompleted ? styles.lineCompleted : styles.lineQueued
  const segment = isLast ? null : <View style={lineStyle} />

  // Combine the node+segment on the left with the text elements on the right
  // into a completed StepProgressRow
  const titleStyle = isNodeCompleted || isNodeActive ? styles.textTitleActive : styles.textTitleDisabled
  const bodyStyle = isNodeCompleted || isNodeActive ? styles.textBodyActive : styles.textBodyDisabled

  return (
    <View style={styles.actionRow}>
      <View style={styles.columnContainer}>
        {node}
        {segment}
      </View>
      <View style={styles.childContainer}>
        <EdgeText style={titleStyle} numberOfLines={3}>
          {stepText.title}
        </EdgeText>
        <EdgeText style={bodyStyle} numberOfLines={100}>
          {stepText.message}
        </EdgeText>
      </View>
    </View>
  )
}

const StepProgressRow = memo(StepProgressRowComponent)

// -----------------------------------------------------------------------------
// StepProgressBar visualizes the completed, active, and pending steps with a
// variably shaded/highlighted vertical step progress bar column on the left,
// accompanied by messages describing the steps are drawn on the right.
//
// StepProgressBar is a collection of StepProgressRows.
// -----------------------------------------------------------------------------
const StepProgressBarComponent = (props: { actionDisplayInfos: ActionDisplayInfo[] }) => {
  // completedSteps of -1 will gray out all steps, while 0 will highlight the
  // first step
  const { actionDisplayInfos, ...containerProps } = props
  const totalSteps = actionDisplayInfos.length

  // Render nodes and their connecting segments, starting from the top
  const renderRows = useMemo(() => {
    const actionRows = []
    for (let i = 0; i < totalSteps; i++) {
      // Render a completed, active/in-progress, or queued node.
      // Active/in-progress nodes are partially filled while queued or completed
      // nodes are solid filled.
      const isLast = totalSteps <= 1 || i >= totalSteps - 1
      // HACK: Also set active status of this node based on the status of the previous node. Check to be removed when ActionQueue properly handles updating its execution state.
      const isNodeCompleted = actionDisplayInfos[i].status === 'done' || actionDisplayInfos[i].status instanceof Error
      const isNodeActive = !isNodeCompleted && (actionDisplayInfos[i].status === 'active' || (i > 0 && actionDisplayInfos[i - 1].status === 'done'))

      actionRows.push(
        <StepProgressRow
          isNodeActive={isNodeActive}
          isNodeCompleted={isNodeCompleted}
          isLast={isLast}
          stepText={{ title: actionDisplayInfos[i].title, message: actionDisplayInfos[i].message }}
          key={'spb' + i}
        />
      )
    }
    return actionRows
  }, [actionDisplayInfos, totalSteps])

  return <View {...containerProps}>{renderRows}</View>
}

const getStyles = cacheStyles((theme: Theme) => {
  const circleCommon = {
    width: theme.rem(1),
    height: theme.rem(1),
    borderRadius: theme.rem(0.5),
    zIndex: 1
  }

  // Lines are rendered underneath the circles' layer, to hide the y overlap
  // (negative margin) necessary in the styling.
  const lineCommon = {
    width: theme.rem(0.25),
    margin: theme.rem(-0.5),
    zIndex: 0,
    flexGrow: 1
  }

  return {
    childContainer: {
      flexDirection: 'column',
      marginBottom: theme.rem(1.5),
      flexShrink: 1
    },
    columnContainer: {
      alignItems: 'center',
      flexDirection: 'column',
      marginRight: theme.rem(1.5)
    },
    actionRow: {
      alignItems: 'flex-start',
      flexDirection: 'row'
    },
    circleCommon: {
      ...circleCommon
    },
    circleQueued: {
      ...circleCommon,
      backgroundColor: theme.deactivatedText
    },
    circleCompleted: {
      ...circleCommon,
      backgroundColor: theme.iconTappable
    },
    lineQueued: {
      ...lineCommon,
      backgroundColor: theme.deactivatedText
    },
    lineCompleted: {
      ...lineCommon,
      backgroundColor: theme.iconTappable
    },
    textBodyActive: {
      fontSize: theme.rem(0.75)
    },
    textTitleActive: {
      fontFamily: theme.fontFaceBold,
      marginBottom: theme.rem(0.5)
    },
    textBodyDisabled: {
      color: theme.deactivatedText,
      fontSize: theme.rem(0.75)
    },
    textTitleDisabled: {
      color: theme.deactivatedText,
      fontFamily: theme.fontFaceBold,
      marginBottom: theme.rem(0.5)
    }
  }
})

export const StepProgressBar = memo(StepProgressBarComponent)
