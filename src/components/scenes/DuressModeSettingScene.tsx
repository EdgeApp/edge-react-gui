import * as React from 'react'
import { useEffect } from 'react'
import { Image, View } from 'react-native'

import illustrationImageSource from '../../assets/images/duressMode/illustration.png'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SceneContainer } from '../layout/SceneContainer'
import { showError, showToast } from '../services/AirshipInstance'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { onPin } from './DuressPinScene'

interface Props extends EdgeAppSceneProps<'duressModeSetting'> {}

export const DuressModeSettingScene = (props: Props) => {
  const { navigation } = props
  const account = useSelector(state => state.core.account)

  const handleDisableDuress = useHandler(async () => {
    await account.changePin({ enableLogin: false, forDuressAccount: true })
  })

  const handleEnableDuress = useHandler(async () => {
    navigation.navigate('duressPin')
  })

  const handleLearnMore = useHandler(() => {
    navigation.navigate('duressModeHowTo')
  })

  const canDuressLogin = useWatch(account, 'canDuressLogin')

  // Subscribe to pin event from VerifyPinScene
  useEffect(
    () =>
      onPin(pin => {
        account
          .checkPin(pin)
          .then(async isCorrect => {
            if (isCorrect) {
              showToast(lstrings.duress_mode_pin_match_rule_message)
              return
            }
            await account.changePin({ enableLogin: true, pin, forDuressAccount: true })
            // Navigate back to this scene
            navigation.navigate('duressModeSetting')
          })
          .catch(err => showError(err))
      }),
    [account, navigation]
  )

  return (
    <SceneWrapper scroll>
      <SceneContainer>
        <HeadingContainer>
          <HeadingImageContainer>
            <HeadingImage source={illustrationImageSource} />
          </HeadingImageContainer>
          <Heading>{lstrings.title_duress_mode}</Heading>
        </HeadingContainer>

        <EdgeCard>
          <Paragraph>{lstrings.enable_duress_mode_description}</Paragraph>
        </EdgeCard>

        <ButtonsView
          layout="column"
          primary={
            canDuressLogin
              ? {
                  label: lstrings.change_duress_pin,
                  onPress: handleEnableDuress
                }
              : {
                  label: lstrings.enable_duress_mode,
                  onPress: handleEnableDuress
                }
          }
          secondary={
            canDuressLogin
              ? {
                  label: lstrings.disable_duress_mode,
                  onPress: handleDisableDuress
                }
              : undefined
          }
          tertiary={{
            label: lstrings.learn_more,
            onPress: handleLearnMore
          }}
        />
      </SceneContainer>
    </SceneWrapper>
  )
}

const HeadingContainer = styled(View)({
  flexDirection: 'column',
  alignItems: 'center'
})

const HeadingImageContainer = styled(View)(theme => ({
  aspectRatio: 1,
  borderRadius: theme.rem(100),
  margin: theme.rem(0.5),
  width: theme.rem(16),
  overflow: 'hidden'
}))

const HeadingImage = styled(Image)({
  width: '100%',
  height: '100%',
  resizeMode: 'cover'
})

const Heading = styled(EdgeText)(theme => ({
  fontSize: theme.rem(1.2),
  textAlign: 'center',
  margin: theme.rem(0.5)
}))
