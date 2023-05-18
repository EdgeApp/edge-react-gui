import * as React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import visaBrandImage from '../../../assets/images/guiPlugins/visaBrand.png'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { styled } from '../../../components/hoc/styled'
import { Space } from '../../../components/layout/Space'
import { useTheme } from '../../../components/services/ThemeContext'
import { DividerLine } from '../../../components/themed/DividerLine'
import { MainButton } from '../../../components/themed/MainButton'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { useState } from '../../../types/reactHooks'
import { RouteProp } from '../../../types/routerTypes'
import { RewardsCardItem } from '../RewardsCardPlugin'

export interface RewardsCardDashboardParams {
  items: RewardsCardItem[]
  onCardPress: (card: RewardsCardItem) => void
  onHelpPress: () => void
  onNewPress: () => void
  onRemovePress: (item: RewardsCardItem) => void
}

interface Props {
  route: RouteProp<'rewardsCardDashboard'>
}

export const RewardsCardDashboardScene = (props: Props) => {
  const { route } = props
  const { items, onCardPress, onHelpPress, onNewPress, onRemovePress } = route.params
  const theme = useTheme()
  const [bottomFloatHeight, setBottomFloatHeight] = useState(0)

  const handleHelpPress = useHandler(() => {
    onHelpPress()
  })
  const handleRemovePress = useHandler((item: RewardsCardItem) => {
    onRemovePress(item)
  })

  return (
    <>
      <SceneWrapper keyboardShouldPersistTaps="handled" background="theme" hasHeader scroll hasTabs>
        <SceneHeader
          title={lstrings.rewards_card_dashboard_title}
          tertiary={
            <TouchableOpacity onPress={handleHelpPress}>
              <Ionicon name="help-circle-outline" size={theme.rem(1.5)} color={theme.iconTappable} />
            </TouchableOpacity>
          }
          underline
          withTopMargin
        />
        <DividerLine marginRem={[0, 1]} />
        <CardListContainer bottomSpace={bottomFloatHeight}>
          {items.map(item => {
            return (
              <CardListItem key={item.id}>
                <TouchableOpacity onPress={() => onCardPress(item)}>
                  <CardListItemContainer>
                    <Details>
                      <VisaBrandImage source={visaBrandImage} />
                      <ExpiryLabel>{lstrings.rewards_card_dashboard_expires_label}</ExpiryLabel>
                      <DateLabel>{item.expiration.toLocaleString()}</DateLabel>
                    </Details>
                    {/* TODO: Add delete button after card presentation redesign */}
                    {Math.random() === -1 ? (
                      <TouchableOpacity onPress={() => handleRemovePress(item)}>
                        <Icon name="remove-circle-outline" size={theme.rem(2)} color={theme.iconTappable} />
                      </TouchableOpacity>
                    ) : null}
                    <Icon name="chevron-forward-outline" size={theme.rem(2)} color={theme.iconTappable} />
                  </CardListItemContainer>
                  <DividerLine marginRem={[0, 0]} />
                </TouchableOpacity>
              </CardListItem>
            )
          })}
        </CardListContainer>
      </SceneWrapper>
      <BottomFloat onLayout={event => setBottomFloatHeight(event.nativeEvent.layout.height)}>
        <Space around={1}>
          <MainButton onPress={onNewPress} label={lstrings.rewards_card_new_card_button_label} />
        </Space>
      </BottomFloat>
    </>
  )
}

const CardListContainer = styled(View)<{ bottomSpace: number }>(props => ({
  justifyContent: 'space-around',
  marginBottom: props.bottomSpace
}))

const CardListItem = styled(View)(props => ({
  marginLeft: props.theme.rem(1)
}))

const CardListItemContainer = styled(View)(props => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginVertical: props.theme.rem(1),
  marginRight: props.theme.rem(1)
}))

const BottomFloat = styled(View)(props => ({
  alignSelf: 'center',
  bottom: 0,
  position: 'absolute'
}))

const Icon = styled(Ionicon)(props => ({}))

const Details = styled(View)(props => ({}))

const VisaBrandImage = styled(Image)(props => ({
  resizeMode: 'contain',
  height: props.theme.rem(1.75),
  width: props.theme.rem(4),
  marginBottom: props.theme.rem(0.5)
}))

const ExpiryLabel = styled(Text)(props => ({
  color: props.theme.primaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(0.75),
  includeFontPadding: false
}))

const DateLabel = styled(Text)(props => ({
  color: props.theme.primaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(1),
  includeFontPadding: false
}))
