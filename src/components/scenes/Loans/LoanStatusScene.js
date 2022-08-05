// @flow
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import { ScrollView } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { getActionProgramDisplayInfo } from '../../../controllers/action-queue/display'
import { type ActionDisplayInfo, type ActionQueueMap } from '../../../controllers/action-queue/types'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useEffect, useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
import { type Theme } from '../../../types/Theme'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ConfirmContinueModal } from '../../modals/ConfirmContinueModal'
import { StepProgressBar } from '../../progress-indicators/StepProgressBar'
import { Airship } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanStatus'>,
  route: RouteProp<'loanStatus'>
}

export const LoanStatusScene = (props: Props) => {
  const { navigation, route } = props
  const { actionQueueId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)
  const account: EdgeAccount = useSelector(state => state.core.account)

  const actionQueue: ActionQueueMap = useSelector(state => state.actionQueue.queue)
  const [steps, setSteps] = useState<ActionDisplayInfo[] | void>()
  useEffect(() => {
    const actionQueueItem = actionQueue[actionQueueId]

    // HACK: Manual program completion handling:
    // 1. actionQueueItem gets removed from actionQueue when the last step completes, so we need to maintain and mutate a copy of the steps to reflect program completion since there's nothing to reference after completion.
    // 2. The first step of a seq does not get set to 'active'
    // TODO: Make ActionQueue handle these cases correctly.
    if (actionQueueItem == null && steps != null) {
      const lastStepIndex = steps.length - 1
      const lastStatus = steps[lastStepIndex].status
      if (lastStatus !== 'done') {
        steps[lastStepIndex].status = 'done'
        setSteps([...steps])
      }
    } else {
      const { program, state } = actionQueueItem
      const displayInfo = getActionProgramDisplayInfo(account, program, state)
      if (steps == null) displayInfo.steps[0].status = 'active'
      setSteps([...displayInfo.steps])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionQueue])

  // Show a confirmation modal before aborting the ActionQueue
  const handleCancelPress = useHandler(async () => {
    const approve = await Airship.show(bridge => (
      <ConfirmContinueModal
        bridge={bridge}
        title={s.strings.loan_status_cancel_txs}
        body={sprintf(s.strings.loan_status_cancel_txs_modal_msg, config.appName)}
        isSkippable
      />
    ))

    if (approve) {
      // TODO: Abort action queue
      navigation.pop()
    }
  })

  const isProgramDone = steps != null && steps[steps.length - 1].status === 'done'
  return steps == null ? null : (
    <>
      <SceneWrapper background="theme" hasHeader hasTabs={false}>
        <SceneHeader underline title={s.strings.loan_status_title} />
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
            <StepProgressBar actionDisplayInfos={steps} />
          </ScrollView>
          {isProgramDone ? (
            <>
              <View style={styles.footerContainer}>
                <EdgeText style={styles.textCompleteTitle}>{s.strings.exchange_congratulations}</EdgeText>
                <EdgeText style={styles.textCompleteInfo}>{s.strings.loan_status_complete}</EdgeText>
              </View>
            </>
          ) : (
            <MainButton label={s.strings.loan_status_cancel_txs} type="secondary" onPress={handleCancelPress} marginRem={[0.5, 1, 2, 1]} />
          )}
          {isProgramDone ? <ConfettiCannon autostart count={250} origin={{ x: -50, y: -50 }} fallSpeed={4000} /> : null}
        </View>
      </SceneWrapper>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    button: {
      color: theme.textLink,
      fontFamily: theme.addButtonFont,
      alignSelf: 'center'
    },
    footerContainer: {
      backgroundColor: theme.tileBackground,
      flexDirection: 'column',
      height: theme.rem(6),
      marginBottom: theme.rem(1)
    },
    textCompleteTitle: {
      width: '100%',
      textAlign: 'center',
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(1.25),
      marginBottom: theme.rem(0.25)
    },
    textCompleteInfo: {
      textAlign: 'center',
      fontSize: theme.rem(0.75)
    },
    scroll: {
      flex: 1,
      marginTop: theme.rem(-0.5)
    },
    scrollContainer: {
      padding: theme.rem(1.5)
    }
  }
})
