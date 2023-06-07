import * as React from 'react'
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import visaBrandImage from '../../../assets/images/guiPlugins/visaBrand.png'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { styled } from '../../../components/hoc/styled'
import { Space } from '../../../components/layout/Space'
import { useTheme } from '../../../components/services/ThemeContext'
import { DividerLine } from '../../../components/themed/DividerLine'
import { EdgeText } from '../../../components/themed/EdgeText'
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
  showLoading?: boolean
}

interface Props {
  route: RouteProp<'rewardsCardDashboard'>
}

export const RewardsCardDashboardScene = (props: Props) => {
  const { route } = props
  const { items, onCardPress, onHelpPress, onNewPress, onRemovePress, showLoading = false } = route.params
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
              <CardListItemWrapper key={item.id}>
                <RewardCard item={item} onPress={() => onCardPress(item)} onRemovePress={() => handleRemovePress(item)} />
              </CardListItemWrapper>
            )
          })}
          {items.length === 0 && !showLoading ? <MessageText>{lstrings.rewards_card_no_cards}</MessageText> : null}
          {showLoading ? (
            <CardListItem>
              <CardListItemContainer>
                <LoadingContainer>
                  <ActivityIndicator color={theme.iconTappable} size="large" style={{ margin: theme.rem(1) }} />
                  <LoadingText numberOfLines={0}>{lstrings.rewards_card_loading}</LoadingText>
                  <LoadingTextDisclaimer numberOfLines={0} minimumFontScale={0.75} adjustsFontSizeToFit>
                    {lstrings.rewards_card_purchase_disclaimer}
                  </LoadingTextDisclaimer>
                </LoadingContainer>
              </CardListItemContainer>
            </CardListItem>
          ) : null}
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

export const RewardCard = ({ item, onPress, onRemovePress }: { item: RewardsCardItem; onPress?: () => void; onRemovePress?: () => void }) => {
  const theme = useTheme()

  return (
    <CardListItem>
      <TouchableOpacity onPress={onPress}>
        <CardListItemContainer>
          <Details>
            <VisaBrandImage source={visaBrandImage} />
            <DetailItem>
              <ExpiryLabel>{lstrings.rewards_card_dashboard_expires_label}</ExpiryLabel>
              <DateLabel>{item.expiration.toLocaleString()}</DateLabel>
            </DetailItem>
          </Details>
          {onRemovePress == null ? null : (
            <TouchableOpacity onPress={onRemovePress}>
              <Icon name="remove-circle-outline" size={theme.rem(1.5)} color={theme.dangerIcon} />
            </TouchableOpacity>
          )}
        </CardListItemContainer>
      </TouchableOpacity>
    </CardListItem>
  )
}

const MessageText = styled(EdgeText)(props => ({
  fontFamily: props.theme.fontFaceMedium,
  color: props.theme.secondaryText,
  textAlign: 'center'
}))

const CardListContainer = styled(View)<{ bottomSpace: number }>(props => ({
  justifyContent: 'space-around',
  marginBottom: props.bottomSpace,
  padding: props.theme.rem(1.5)
}))

const CardListItemWrapper = styled(View)(props => ({
  height: props.theme.rem(7)
}))
const CardListItem = styled(View)(props => ({
  backgroundColor: props.theme.modal,
  // Math for figuring out 1/8th inches border radius ((1/8)/3.375 * 314)/16:
  borderRadius: props.theme.rem(0.7268518519),
  borderWidth: 1,
  borderTopColor: 'rgba(255,255,255,.2)',
  borderColor: 'rgba(255,255,255,.1)',
  shadowOpacity: 0.5,
  shadowRadius: props.theme.rem(0.5)
}))

const CardListItemContainer = styled(View)(props => ({
  aspectRatio: 1.5882352941,
  flexDirection: 'row',
  justifyContent: 'space-between',
  padding: props.theme.rem(1.25),
  width: '100%'
}))

const BottomFloat = styled(View)(props => ({
  alignSelf: 'center',
  bottom: 0,
  position: 'absolute'
}))

const LoadingContainer = styled(View)(props => ({
  alignItems: 'center',
  flex: 1,
  justifyContent: 'center',
  paddingVertical: props.theme.rem(1)
}))

const LoadingText = styled(Text)(props => ({
  alignSelf: 'stretch',
  color: props.theme.primaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(1),
  includeFontPadding: false,
  marginBottom: props.theme.rem(0.5),
  textAlign: 'left'
}))

const LoadingTextDisclaimer = styled(Text)(props => ({
  alignSelf: 'stretch',
  color: props.theme.secondaryText,
  fontFamily: props.theme.fontFaceDefault,
  includeFontPadding: false,
  textAlign: 'left'
}))

const Icon = styled(Ionicon)(props => ({}))

const Details = styled(View)(props => ({}))

const DetailItem = styled(View)(prop => ({}))

const VisaBrandImage = styled(Image)(props => ({
  resizeMode: 'contain',
  height: props.theme.rem(1.75),
  width: props.theme.rem(4),
  marginBottom: props.theme.rem(1.25)
}))

const ExpiryLabel = styled(Text)(props => ({
  color: props.theme.secondaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(0.75),
  includeFontPadding: false
}))

const DateLabel = styled(Text)(props => ({
  color: props.theme.primaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(0.75),
  includeFontPadding: false
}))
