// @flow
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import { ScrollView } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { type ActionDisplayInfo, type ActionQueueItem, type ActionQueueMap } from '../../../controllers/action-queue/types'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { getActionProgramDisplayInfo } from '../../../plugins/action-queue'
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
  const [programDisplayInfo, setProgramDisplayInfo] = useState<ActionDisplayInfo | void>()
  const [actionQueueItem, setActionQueueItem] = useState<ActionQueueItem | void>()

  // Refresh tinkering
  const [testIsProgramDone, setTestIsProgramDone] = useState(false)
  const [testSteps, setTestSteps] = useState<ActionDisplayInfo[]>([])

  useEffect(() => {
    const actionQueueItem = actionQueue[actionQueueId]
    if (actionQueueItem == null) {
      console.log(`\x1b[34m\x1b[43m === ${'LoanStatusScene (actionQueueItem == null)'} === \x1b[0m`)
      if (programDisplayInfo != null) {
        const lastStatus = programDisplayInfo.steps[programDisplayInfo.steps.length - 1].status
        if (lastStatus !== 'done') {
          // Manual completion handling - program actionQueueItem gets removed from queue
          console.log(`\x1b[34m\x1b[43m === ${"LoanStatusScene: Setting last step to 'done'"} === \x1b[0m`)
          programDisplayInfo.steps[programDisplayInfo.steps.length - 1].status = 'done'
          setProgramDisplayInfo(programDisplayInfo)

          setTestSteps([...programDisplayInfo.steps])
          setTestIsProgramDone(true)
        }
      }
    } else {
      setActionQueueItem(actionQueueItem)
    }
  }, [actionQueue, actionQueueId])

  useEffect(() => {
    if (actionQueueItem != null) {
      const { program, state } = actionQueueItem
      const displayInfo = getActionProgramDisplayInfo(account, program, state)
      console.log(`\x1b[34m\x1b[43m === ${'displayInfo:'} === \x1b[0m`)
      console.log(`\x1b[34m\x1b[43m === ${JSON.stringify(displayInfo, null, 2)} === \x1b[0m`)
      console.log(`\x1b[34m\x1b[43m === ${'programState:'} === \x1b[0m`)
      console.log(`\x1b[34m\x1b[43m === ${JSON.stringify(state, null, 2)} === \x1b[0m`)
      setProgramDisplayInfo(displayInfo)
      setTestSteps([...displayInfo.steps])
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionQueueItem, account])

  // useEffect(() => {
  //   // If we had already initialized displayInfo and the program no longer
  //   // exists, assume the program has finished.
  //   // TODO: Sam's design intent?
  //   if (actionQueueItem == null && programDisplayInfo != null) {
  //     const lastStatus = programDisplayInfo.steps[programDisplayInfo.steps.length - 1].status
  //     if (lastStatus !== 'done') {
  //       console.log(`\x1b[34m\x1b[43m === ${'LoanStatusScene: Setting last step done'} === \x1b[0m`)
  //       programDisplayInfo.steps[programDisplayInfo.steps.length - 1].status = 'done'
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [programDisplayInfo])

  console.log(`\x1b[34m\x1b[43m === ${'LoanStatusScene: actionQueue[actionQueueId] (queue):'} === \x1b[0m`)
  console.log(`\x1b[34m\x1b[43m === ${JSON.stringify(actionQueue[actionQueueId], null, 2)} === \x1b[0m`)

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

  if (testSteps) console.log(`\n🪲🪲🪲🪲🪲\n🪲 ${JSON.stringify(testSteps, null, 2)} 🪲\n🪲🪲🪲🪲🪲`)

  return testSteps == null ? null : (
    <SceneWrapper background="theme" hasHeader hasTabs={false}>
      <SceneHeader underline title={s.strings.loan_status_title} />
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
          <StepProgressBar actionDisplayInfos={testSteps} />
        </ScrollView>
        {testIsProgramDone ? (
          <>
            <View style={styles.footerContainer}>
              <EdgeText style={styles.textCompleteTitle}>{s.strings.exchange_congratulations}</EdgeText>
              <EdgeText style={styles.textCompleteInfo}>{s.strings.loan_status_complete}</EdgeText>
            </View>
          </>
        ) : (
          <MainButton label={s.strings.loan_status_cancel_txs} type="secondary" onPress={handleCancelPress} marginRem={[0.5, 1, 2, 1]} />
        )}
        {testIsProgramDone ? <ConfettiCannon autostart count={250} origin={{ x: -50, y: -50 }} fallSpeed={4000} /> : null}
      </View>
    </SceneWrapper>
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
