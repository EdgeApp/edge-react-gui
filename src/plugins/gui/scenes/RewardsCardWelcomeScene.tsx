import * as React from 'react'
import { Image, Text, View } from 'react-native'

import visaBrandImage from '../../../assets/images/guiPlugins/visaBrand.png'
import visaCardSayAnythingIllustration from '../../../assets/images/guiPlugins/visaCardSayAnythingIllustration.png'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { styled } from '../../../components/hoc/styled'
import { Space } from '../../../components/layout/Space'
import { MainButton } from '../../../components/themed/MainButton'
import { lstrings } from '../../../locales/strings'
import { EdgeSceneProps } from '../../../types/routerTypes'

export interface RewardsCardWelcomeParams {
  onMoreInfo: () => void
  onNewCard: () => void
}

interface Props extends EdgeSceneProps<'rewardsCardWelcome'> {}

export const RewardsCardWelcomeScene = (props: Props) => {
  const { onMoreInfo, onNewCard } = props.route.params

  return (
    <SceneWrapper keyboardShouldPersistTaps="handled" background="theme">
      <SceneContainer>
        <WelcomeContainer>
          <IllustrationImage source={visaCardSayAnythingIllustration} />
          <VisaBrandImage source={visaBrandImage} />
          <WelcomeInto adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={4}>
            {lstrings.rewards_card_welcome_intro}
          </WelcomeInto>
        </WelcomeContainer>
        <MainButton onPress={onNewCard} label={lstrings.buy_new_card_button} />
        <Space vertical={1}>
          <MainButton type="secondary" label={lstrings.learn_more_button} onPress={onMoreInfo} />
        </Space>
      </SceneContainer>
    </SceneWrapper>
  )
}

const SceneContainer = styled(View)(theme => ({
  flex: 1,
  justifyContent: 'space-between',
  marginVertical: theme.rem(1),
  marginHorizontal: theme.rem(2)
}))

const WelcomeContainer = styled(View)(theme => ({
  alignItems: 'center',
  flex: 1,
  justifyContent: 'flex-start'
}))

const IllustrationImage = styled(Image)(theme => ({
  resizeMode: 'contain',
  flex: 1,
  aspectRatio: 1
}))

const VisaBrandImage = styled(Image)(theme => ({
  resizeMode: 'contain',
  height: 50,
  aspectRatio: 3.0802005013,
  margin: 30
}))

const WelcomeInto = styled(Text)(theme => ({
  alignSelf: 'stretch',
  color: theme.primaryText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(1),
  includeFontPadding: false,
  marginBottom: theme.rem(1),
  textAlign: 'center'
}))
