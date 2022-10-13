import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import { ScrollView } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { getActionProgramDisplayInfo } from '../../../controllers/action-queue/display'
import { cancelActionProgram } from '../../../controllers/action-queue/redux/actions'
import { ActionDisplayInfo, ActionQueueMap } from '../../../controllers/action-queue/types'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { Theme } from '../../../types/Theme'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ConfirmContinueModal } from '../../modals/ConfirmContinueModal'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { StepProgressBar } from '../../progress-indicators/StepProgressBar'
import { Airship } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanStatus'>
  route: RouteProp<'loanStatus'>
}

export const LoanStatusScene = (props: Props) => {
  const { navigation, route } = props
  const { actionQueueId, loanAccountId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)
  const account: EdgeAccount = useSelector(state => state.core.account)
  const dispatch = useDispatch()

  const buttonMargin = [2, 1, 2, 1]

  const actionQueueMap: ActionQueueMap = useSelector(state => state.actionQueue.actionQueueMap)
  const [steps, setSteps] = React.useState<ActionDisplayInfo[]>()
  useAsyncEffect(async () => {
    const actionQueueItem = actionQueueMap[actionQueueId]

    // 2. The first step of a seq does not get set to 'active'
    const { program, state } = actionQueueItem
    const displayInfo = await getActionProgramDisplayInfo(account, program, state)

    // Flatten steps
    const steps = [...displayInfo.steps].reduce((steps: ActionDisplayInfo[], step) => [...steps, ...(step.steps.length > 0 ? step.steps : [step])], [])

    if (steps[0].status === 'pending') steps[0].status = 'active'

    setSteps(steps)

    return () => {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionQueueMap])

  // Show a confirmation modal before aborting the ActionQueue
  const handleCancelPress = useHandler(async () => {
    const approve = await Airship.show<boolean>(bridge => (
      <ConfirmContinueModal
        bridge={bridge}
        title={s.strings.loan_status_cancel_txs}
        body={sprintf(s.strings.loan_status_cancel_txs_modal_msg, config.appName)}
        isSkippable
      />
    ))

    if (approve) {
      dispatch(cancelActionProgram(actionQueueId))
      navigation.pop()
    }
  })

  const handleDonePress = useHandler(() => {
    if (loanAccountId != null) navigation.navigate('loanDetails', { loanAccountId })
    else navigation.navigate('loanDashboard', {})
  })

  const isProgramDone = steps != null && steps[steps.length - 1].status === 'done'

  return (
    <SceneWrapper background="theme" hasHeader hasTabs={false}>
      <SceneHeader underline title={s.strings.loan_status_title} />
      {steps == null ? (
        <FillLoader />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
            <StepProgressBar actionDisplayInfos={steps} />
          </ScrollView>
          <View style={styles.footerContainer}>
            {isProgramDone ? (
              <>
                <EdgeText style={styles.textCompleteTitle}>{s.strings.exchange_congratulations}</EdgeText>
                <EdgeText style={styles.textCompleteInfo}>{s.strings.loan_status_complete}</EdgeText>
              </>
            ) : null}
          </View>
          {isProgramDone ? (
            <MainButton label={s.strings.string_done_cap} type="secondary" onPress={handleDonePress} marginRem={buttonMargin} />
          ) : (
            <MainButton label={s.strings.loan_status_cancel_txs} type="secondary" onPress={handleCancelPress} marginRem={buttonMargin} />
          )}
          {isProgramDone ? <ConfettiCannon count={250} origin={{ x: -50, y: -50 }} fallSpeed={4000} /> : null}
        </View>
      )}
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
      flexDirection: 'column'
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
