import * as React from 'react'
import { Image, Text, View } from 'react-native'

import visaBrandImage from '../../../assets/images/guiPlugins/visaBrand.png'
import visaCardSayAnythingIllustration from '../../../assets/images/guiPlugins/visaCardSayAnythingIllustration.png'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { styled } from '../../../components/hoc/styled'
import { Space } from '../../../components/layout/Space'
import { MainButton } from '../../../components/themed/MainButton'
import { lstrings } from '../../../locales/strings'
import { RouteProp } from '../../../types/routerTypes'

export interface RewardsCardWelcomeParams {
  onMoreInfo: () => void
  onNewCard: () => void
}

interface Props {
  route: RouteProp<'rewardsCardWelcome'>
}

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

const SceneContainer = styled(View)(props => ({
  flex: 1,
  justifyContent: 'space-between',
  marginVertical: props.theme.rem(1),
  marginHorizontal: props.theme.rem(2)
}))

const WelcomeContainer = styled(View)(props => ({
  alignItems: 'center',
  flex: 1,
  justifyContent: 'flex-start'
}))

const IllustrationImage = styled(Image)(props => ({
  resizeMode: 'contain',
  flex: 1,
  aspectRatio: 1
}))

const VisaBrandImage = styled(Image)(props => ({
  resizeMode: 'contain',
  height: 50,
  aspectRatio: 3.0802005013,
  margin: 30
}))

const WelcomeInto = styled(Text)(props => ({
  alignSelf: 'stretch',
  color: props.theme.primaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(1),
  includeFontPadding: false,
  marginBottom: props.theme.rem(1),
  textAlign: 'center'
}))
